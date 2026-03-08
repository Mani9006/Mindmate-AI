"""
Subscription Status Enforcement Middleware
==========================================
Middleware and decorators for enforcing subscription-based access control.
"""

import functools
from datetime import datetime, timedelta
from typing import Optional, Callable, Dict, Any, List
from uuid import UUID
import logging

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.orm import Session

from .config import StripeConfig, SUBSCRIPTION_PLANS, get_plan_by_id
from .models import (
    StripeCustomer, Subscription, UsageRecord,
    SubscriptionStatusEnum
)


logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class SubscriptionRequiredError(HTTPException):
    """Exception raised when subscription is required but not found."""
    
    def __init__(self, detail: str = "Active subscription required"):
        super().__init__(status_code=403, detail=detail)


class PlanUpgradeRequiredError(HTTPException):
    """Exception raised when plan upgrade is required."""
    
    def __init__(self, required_plan: str, current_plan: Optional[str] = None):
        detail = f"Plan upgrade required. Current: {current_plan or 'none'}, Required: {required_plan}"
        super().__init__(status_code=403, detail=detail)


class UsageLimitExceededError(HTTPException):
    """Exception raised when usage limit is exceeded."""
    
    def __init__(self, resource_type: str, limit: int, current: int):
        detail = f"Usage limit exceeded for {resource_type}. Limit: {limit}, Current: {current}"
        super().__init__(status_code=429, detail=detail)


class SubscriptionEnforcer:
    """Enforces subscription-based access control."""
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the subscription enforcer.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
    
    def get_user_subscription(self, user_id: UUID) -> Optional[Subscription]:
        """Get the active subscription for a user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Active subscription or None
        """
        # Get customer
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return None
        
        # Get active subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.customer_id == customer.id,
            Subscription.status.in_([
                SubscriptionStatusEnum.ACTIVE,
                SubscriptionStatusEnum.TRIALING,
            ])
        ).order_by(Subscription.created_at.desc()).first()
        
        return subscription
    
    def has_active_subscription(self, user_id: UUID) -> bool:
        """Check if user has an active subscription.
        
        Args:
            user_id: User UUID
            
        Returns:
            True if user has active subscription
        """
        subscription = self.get_user_subscription(user_id)
        return subscription is not None and subscription.is_active
    
    def has_plan_or_higher(self, user_id: UUID, required_plan: str) -> bool:
        """Check if user has required plan or higher.
        
        Args:
            user_id: User UUID
            required_plan: Required plan ID
            
        Returns:
            True if user has required plan or higher
        """
        subscription = self.get_user_subscription(user_id)
        
        if not subscription:
            return False
        
        # Define plan hierarchy
        plan_hierarchy = ["starter", "professional", "enterprise"]
        
        required_index = plan_hierarchy.index(required_plan) if required_plan in plan_hierarchy else -1
        current_index = plan_hierarchy.index(subscription.plan_id) if subscription.plan_id in plan_hierarchy else -1
        
        return current_index >= required_index
    
    def check_session_availability(self, user_id: UUID) -> Dict[str, Any]:
        """Check if user can start a new therapy session.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dictionary with availability status and details
        """
        subscription = self.get_user_subscription(user_id)
        
        if not subscription:
            return {
                "can_start": False,
                "reason": "no_subscription",
                "message": "No active subscription found",
            }
        
        if not subscription.is_active:
            return {
                "can_start": False,
                "reason": "inactive_subscription",
                "message": f"Subscription status: {subscription.status.value}",
            }
        
        remaining = subscription.get_sessions_remaining()
        
        if remaining == 0:
            return {
                "can_start": False,
                "reason": "limit_exceeded",
                "message": "Monthly session limit reached",
                "current_period_end": subscription.current_period_end.isoformat(),
            }
        
        return {
            "can_start": True,
            "remaining_sessions": remaining if remaining != -1 else "unlimited",
            "plan": subscription.plan_id,
            "is_trial": subscription.is_trial_active,
        }
    
    def record_session_usage(self, user_id: UUID, session_id: Optional[UUID] = None) -> bool:
        """Record usage of a therapy session.
        
        Args:
            user_id: User UUID
            session_id: Optional therapy session ID
            
        Returns:
            True if usage was recorded successfully
        """
        subscription = self.get_user_subscription(user_id)
        
        if not subscription:
            logger.warning(f"Cannot record usage: No subscription for user {user_id}")
            return False
        
        if not subscription.increment_session_usage():
            logger.warning(f"Cannot record usage: Session limit reached for user {user_id}")
            return False
        
        # Record usage in usage records table
        usage = UsageRecord(
            subscription_id=subscription.id,
            user_id=user_id,
            resource_type="session",
            quantity=1,
            session_id=session_id,
        )
        self.db.add(usage)
        self.db.commit()
        
        logger.info(f"Recorded session usage for user {user_id}, subscription {subscription.id}")
        
        return True
    
    def get_subscription_features(self, user_id: UUID) -> Dict[str, Any]:
        """Get available features for user's subscription.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dictionary with feature information
        """
        subscription = self.get_user_subscription(user_id)
        
        if not subscription:
            # Return free tier features
            return {
                "plan": "free",
                "features": [],
                "limits": {
                    "sessions_per_month": 0,
                    "storage_gb": 0,
                    "support_level": "none",
                },
            }
        
        plan = get_plan_by_id(subscription.plan_id)
        
        return {
            "plan": subscription.plan_id,
            "billing_cycle": subscription.billing_cycle.value,
            "status": subscription.status.value,
            "is_trial": subscription.is_trial_active,
            "trial_days_remaining": subscription.days_until_trial_ends,
            "features": plan.get("features", []) if plan else [],
            "limits": plan.get("limits", {}) if plan else {},
            "current_usage": {
                "sessions_this_period": subscription.sessions_used_this_period,
                "storage_used_mb": subscription.storage_used_mb,
            },
            "remaining": {
                "sessions": subscription.get_sessions_remaining(),
            },
            "period": {
                "start": subscription.current_period_start.isoformat(),
                "end": subscription.current_period_end.isoformat(),
            },
            "cancel_at_period_end": subscription.cancel_at_period_end,
        }


class SubscriptionMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for subscription enforcement."""
    
    def __init__(
        self, 
        app: ASGIApp, 
        db_session_factory: Callable,
        exempt_paths: Optional[List[str]] = None,
        exempt_prefixes: Optional[List[str]] = None,
    ):
        """Initialize the middleware.
        
        Args:
            app: ASGI application
            db_session_factory: Factory function to create database sessions
            exempt_paths: List of paths to exempt from subscription checks
            exempt_prefixes: List of path prefixes to exempt
        """
        super().__init__(app)
        self.db_session_factory = db_session_factory
        self.exempt_paths = exempt_paths or [
            "/health",
            "/docs",
            "/openapi.json",
            "/auth/login",
            "/auth/register",
            "/billing/webhook",
            "/billing/plans",
            "/billing/checkout",
        ]
        self.exempt_prefixes = exempt_prefixes or [
            "/static",
            "/public",
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process incoming request.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response
        """
        # Check if path is exempt
        if self._is_exempt(request.url.path):
            return await call_next(request)
        
        # Get user ID from request (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        
        if not user_id:
            # No user authenticated, proceed (auth middleware will handle)
            return await call_next(request)
        
        # Check subscription and attach to request state
        db = self.db_session_factory()
        try:
            enforcer = SubscriptionEnforcer(db)
            subscription = enforcer.get_user_subscription(user_id)
            
            # Attach subscription info to request state
            request.state.subscription = subscription
            request.state.has_active_subscription = subscription is not None and subscription.is_active
            
        finally:
            db.close()
        
        return await call_next(request)
    
    def _is_exempt(self, path: str) -> bool:
        """Check if path is exempt from subscription checks."""
        # Check exact paths
        if path in self.exempt_paths:
            return True
        
        # Check prefixes
        for prefix in self.exempt_prefixes:
            if path.startswith(prefix):
                return True
        
        return False


# ==================== Dependency Functions ====================

def require_subscription(
    allow_trialing: bool = True,
    allow_grace_period: bool = True,
) -> Callable:
    """Dependency factory to require active subscription.
    
    Args:
        allow_trialing: Whether to allow trialing subscriptions
        allow_grace_period: Whether to allow grace period after cancellation
        
    Returns:
        Dependency function
    """
    def dependency(
        request: Request,
        db: Session = None,  # Injected by FastAPI Depends
    ) -> Subscription:
        user_id = getattr(request.state, "user_id", None)
        
        if not user_id:
            raise SubscriptionRequiredError("Authentication required")
        
        enforcer = SubscriptionEnforcer(db)
        subscription = enforcer.get_user_subscription(user_id)
        
        if not subscription:
            raise SubscriptionRequiredError("No active subscription found")
        
        # Check if trial is allowed
        if subscription.status == SubscriptionStatusEnum.TRIALING and not allow_trialing:
            raise SubscriptionRequiredError("Paid subscription required")
        
        # Check grace period for canceled subscriptions
        if subscription.status == SubscriptionStatusEnum.CANCELED and allow_grace_period:
            # Allow access for a short grace period after cancellation
            grace_period_end = subscription.ended_at + timedelta(days=3) if subscription.ended_at else None
            if grace_period_end and datetime.utcnow() > grace_period_end:
                raise SubscriptionRequiredError("Subscription has expired")
        elif subscription.status == SubscriptionStatusEnum.CANCELED:
            raise SubscriptionRequiredError("Subscription has been canceled")
        
        # Check past due
        if subscription.status == SubscriptionStatusEnum.PAST_DUE and not allow_grace_period:
            raise SubscriptionRequiredError("Payment required to continue")
        
        return subscription
    
    return dependency


def require_plan(min_plan: str) -> Callable:
    """Dependency factory to require specific plan or higher.
    
    Args:
        min_plan: Minimum required plan ID
        
    Returns:
        Dependency function
    """
    def dependency(
        request: Request,
        db: Session = None,
    ) -> Subscription:
        user_id = getattr(request.state, "user_id", None)
        
        if not user_id:
            raise SubscriptionRequiredError("Authentication required")
        
        enforcer = SubscriptionEnforcer(db)
        
        if not enforcer.has_plan_or_higher(user_id, min_plan):
            current_sub = enforcer.get_user_subscription(user_id)
            current_plan = current_sub.plan_id if current_sub else None
            raise PlanUpgradeRequiredError(min_plan, current_plan)
        
        return enforcer.get_user_subscription(user_id)
    
    return dependency


def check_session_limit(
    request: Request,
    db: Session = None,
) -> Dict[str, Any]:
    """Dependency to check if user can start a therapy session.
    
    Args:
        request: FastAPI request
        db: Database session
        
    Returns:
        Dictionary with session availability info
        
    Raises:
        UsageLimitExceededError: If session limit is reached
        SubscriptionRequiredError: If no subscription
    """
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        raise SubscriptionRequiredError("Authentication required")
    
    enforcer = SubscriptionEnforcer(db)
    result = enforcer.check_session_availability(user_id)
    
    if not result["can_start"]:
        if result["reason"] == "limit_exceeded":
            raise UsageLimitExceededError("sessions", 0, 0)
        raise SubscriptionRequiredError(result["message"])
    
    return result


def get_subscription_info(
    request: Request,
    db: Session = None,
) -> Dict[str, Any]:
    """Dependency to get subscription info for user.
    
    Args:
        request: FastAPI request
        db: Database session
        
    Returns:
        Dictionary with subscription information
    """
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        return {
            "plan": "none",
            "has_subscription": False,
        }
    
    enforcer = SubscriptionEnforcer(db)
    return enforcer.get_subscription_features(user_id)


# ==================== Decorators ====================

def require_active_subscription(allow_trialing: bool = True):
    """Decorator to require active subscription for a function.
    
    Args:
        allow_trialing: Whether to allow trialing subscriptions
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract user_id from kwargs or args
            user_id = kwargs.get("user_id")
            db = kwargs.get("db")
            
            if not user_id or not db:
                raise SubscriptionRequiredError("Missing user_id or db")
            
            enforcer = SubscriptionEnforcer(db)
            subscription = enforcer.get_user_subscription(user_id)
            
            if not subscription:
                raise SubscriptionRequiredError("No active subscription")
            
            if subscription.status == SubscriptionStatusEnum.TRIALING and not allow_trialing:
                raise SubscriptionRequiredError("Paid subscription required")
            
            # Add subscription to kwargs
            kwargs["subscription"] = subscription
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def track_usage(resource_type: str, quantity: int = 1):
    """Decorator to track resource usage.
    
    Args:
        resource_type: Type of resource being used
        quantity: Amount being used
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            user_id = kwargs.get("user_id")
            db = kwargs.get("db")
            
            if user_id and db:
                enforcer = SubscriptionEnforcer(db)
                
                # Check if usage is allowed
                if resource_type == "session":
                    availability = enforcer.check_session_availability(user_id)
                    if not availability["can_start"]:
                        raise UsageLimitExceededError(resource_type, 0, 0)
                
                # Record usage
                enforcer.record_session_usage(user_id)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


# ==================== API Router Integration ====================

def setup_subscription_routes(app, db_session_factory: Callable):
    """Setup subscription-related routes.
    
    Args:
        app: FastAPI application
        db_session_factory: Factory function for database sessions
    """
    from fastapi import APIRouter, Depends
    
    router = APIRouter(prefix="/billing", tags=["billing"])
    
    @router.get("/subscription")
    def get_subscription(
        request: Request,
        subscription_info: Dict[str, Any] = Depends(get_subscription_info),
    ):
        """Get current user's subscription information."""
        return subscription_info
    
    @router.get("/subscription/check")
    def check_subscription(
        request: Request,
        session_check: Dict[str, Any] = Depends(check_session_limit),
    ):
        """Check if user can start a therapy session."""
        return session_check
    
    # Add router to app
    app.include_router(router)
