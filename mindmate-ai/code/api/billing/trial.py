"""
Trial Period Handling
=====================
Manages trial periods for subscriptions including early termination,
extensions, and trial-to-paid conversions.
"""

import stripe
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID
import logging

from sqlalchemy.orm import Session
from sqlalchemy import and_

from .config import StripeConfig, SUBSCRIPTION_PLANS
from .models import (
    StripeCustomer, Subscription, SubscriptionEvent,
    SubscriptionStatusEnum, BillingCycleEnum
)


logger = logging.getLogger(__name__)


class TrialError(Exception):
    """Custom exception for trial-related errors."""
    pass


class TrialManager:
    """Manager for trial period operations."""
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the trial manager.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
        stripe.api_key = self.config.secret_key
        stripe.api_version = self.config.api_version
    
    def start_trial(
        self,
        user_id: UUID,
        plan_id: str,
        billing_cycle: str = "monthly",
        trial_days: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Start a new trial subscription.
        
        Args:
            user_id: User UUID
            plan_id: Plan ID for the trial
            billing_cycle: Billing cycle (monthly/yearly)
            trial_days: Optional custom trial duration
            
        Returns:
            Dictionary with trial subscription details
            
        Raises:
            TrialError: If trial cannot be started
        """
        # Check if user already had a trial
        if self.has_had_trial(user_id):
            raise TrialError("User has already used their trial period")
        
        # Get or create customer
        customer = self._get_or_create_customer(user_id)
        
        # Get plan and price
        plan = SUBSCRIPTION_PLANS.get(plan_id)
        if not plan:
            raise TrialError(f"Invalid plan ID: {plan_id}")
        
        price_id = plan.get(f"stripe_price_id_{billing_cycle}")
        if not price_id:
            raise TrialError(f"Price not configured for plan {plan_id}")
        
        # Determine trial duration
        trial_days = trial_days or self.config.trial_period_days
        
        try:
            # Create subscription with trial
            stripe_subscription = stripe.Subscription.create(
                customer=customer.stripe_customer_id,
                items=[{"price": price_id}],
                trial_period_days=trial_days,
                trial_settings={
                    "end_behavior": {
                        "missing_payment_method": "pause"
                    }
                },
                metadata={
                    "user_id": str(user_id),
                    "plan_id": plan_id,
                    "billing_cycle": billing_cycle,
                    "is_trial": "true",
                    "app": "mindmate-ai",
                },
                payment_settings={
                    "save_default_payment_method": "on_subscription",
                },
                expand=["latest_invoice"],
            )
            
            # Create database record
            subscription = Subscription(
                customer_id=customer.id,
                stripe_subscription_id=stripe_subscription.id,
                plan_id=plan_id,
                billing_cycle=BillingCycleEnum(billing_cycle),
                status=SubscriptionStatusEnum.TRIALING,
                trial_start=datetime.fromtimestamp(stripe_subscription.trial_start),
                trial_end=datetime.fromtimestamp(stripe_subscription.trial_end),
                current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end),
                metadata={
                    "is_trial": True,
                    "trial_converted": False,
                },
            )
            
            self.db.add(subscription)
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="trial_started",
                description=f"Trial started for plan {plan_id}, duration: {trial_days} days",
                new_values={
                    "trial_start": subscription.trial_start.isoformat(),
                    "trial_end": subscription.trial_end.isoformat(),
                    "trial_days": trial_days,
                },
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(f"Trial started for user {user_id}, subscription {subscription.id}")
            
            # Send trial started email
            self._send_trial_started_email(customer, subscription)
            
            return {
                "subscription_id": str(subscription.id),
                "stripe_subscription_id": stripe_subscription.id,
                "plan_id": plan_id,
                "trial_start": subscription.trial_start.isoformat(),
                "trial_end": subscription.trial_end.isoformat(),
                "days_remaining": trial_days,
                "status": "trialing",
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error starting trial: {str(e)}")
            raise TrialError(f"Failed to start trial: {str(e)}")
    
    def end_trial_early(
        self,
        user_id: UUID,
        charge_immediately: bool = True,
    ) -> Dict[str, Any]:
        """End trial early and convert to paid subscription.
        
        Args:
            user_id: User UUID
            charge_immediately: Whether to charge immediately or at period end
            
        Returns:
            Dictionary with conversion details
            
        Raises:
            TrialError: If trial cannot be ended early
        """
        # Get subscription
        subscription = self._get_active_trial(user_id)
        
        if not subscription:
            raise TrialError("No active trial found")
        
        try:
            # Update Stripe subscription to end trial now
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                trial_end="now",
                proration_behavior=self.config.proration_behavior,
                billing_cycle_anchor="now" if charge_immediately else "unchanged",
            )
            
            # Update database record
            subscription.trial_ended_early = True
            subscription.trial_end = datetime.utcnow()
            subscription.status = SubscriptionStatusEnum.ACTIVE
            subscription.metadata["trial_converted"] = True
            subscription.metadata["trial_ended_early"] = True
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="trial_ended_early",
                description="Trial ended early, converted to paid subscription",
                previous_values={
                    "status": "trialing",
                    "trial_end": subscription.trial_end.isoformat() if subscription.trial_end else None,
                },
                new_values={
                    "status": "active",
                    "trial_end": datetime.utcnow().isoformat(),
                },
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(f"Trial ended early for subscription {subscription.id}")
            
            # Send conversion email
            self._send_trial_converted_email(subscription.customer, subscription)
            
            return {
                "subscription_id": str(subscription.id),
                "status": "active",
                "message": "Trial ended early and converted to paid subscription",
                "charge_immediately": charge_immediately,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error ending trial early: {str(e)}")
            raise TrialError(f"Failed to end trial early: {str(e)}")
    
    def extend_trial(
        self,
        user_id: UUID,
        additional_days: int,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extend an active trial period.
        
        Args:
            user_id: User UUID
            additional_days: Number of days to extend
            reason: Reason for extension
            
        Returns:
            Dictionary with extension details
            
        Raises:
            TrialError: If trial cannot be extended
        """
        subscription = self._get_active_trial(user_id)
        
        if not subscription:
            raise TrialError("No active trial found")
        
        # Calculate new trial end date
        current_trial_end = subscription.trial_end or datetime.utcnow()
        new_trial_end = current_trial_end + timedelta(days=additional_days)
        
        try:
            # Update Stripe subscription
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                trial_end=int(new_trial_end.timestamp()),
            )
            
            # Update database record
            old_trial_end = subscription.trial_end
            subscription.trial_end = new_trial_end
            subscription.current_period_end = new_trial_end
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="trial_extended",
                description=f"Trial extended by {additional_days} days" + (f": {reason}" if reason else ""),
                previous_values={
                    "trial_end": old_trial_end.isoformat() if old_trial_end else None,
                },
                new_values={
                    "trial_end": new_trial_end.isoformat(),
                    "additional_days": additional_days,
                    "reason": reason,
                },
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(f"Trial extended for subscription {subscription.id} by {additional_days} days")
            
            return {
                "subscription_id": str(subscription.id),
                "previous_end": old_trial_end.isoformat() if old_trial_end else None,
                "new_end": new_trial_end.isoformat(),
                "additional_days": additional_days,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error extending trial: {str(e)}")
            raise TrialError(f"Failed to extend trial: {str(e)}")
    
    def has_had_trial(self, user_id: UUID) -> bool:
        """Check if user has ever had a trial.
        
        Args:
            user_id: User UUID
            
        Returns:
            True if user has had a trial
        """
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return False
        
        # Check for any subscription that was a trial
        trial_exists = self.db.query(Subscription).filter(
            and_(
                Subscription.customer_id == customer.id,
                Subscription.trial_start.isnot(None),
            )
        ).first()
        
        return trial_exists is not None
    
    def get_trial_status(self, user_id: UUID) -> Dict[str, Any]:
        """Get trial status for user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dictionary with trial status
        """
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return {
                "has_trial": False,
                "can_start_trial": True,
                "message": "No customer record found",
            }
        
        # Check for active trial
        active_trial = self.db.query(Subscription).filter(
            and_(
                Subscription.customer_id == customer.id,
                Subscription.status == SubscriptionStatusEnum.TRIALING,
            )
        ).first()
        
        if active_trial:
            days_remaining = active_trial.days_until_trial_ends or 0
            
            return {
                "has_trial": True,
                "is_active": True,
                "can_start_trial": False,
                "subscription_id": str(active_trial.id),
                "plan_id": active_trial.plan_id,
                "trial_start": active_trial.trial_start.isoformat() if active_trial.trial_start else None,
                "trial_end": active_trial.trial_end.isoformat() if active_trial.trial_end else None,
                "days_remaining": days_remaining,
                "hours_remaining": max(0, int((active_trial.trial_end - datetime.utcnow()).total_seconds() / 3600)) if active_trial.trial_end else 0,
                "can_end_early": True,
            }
        
        # Check if had trial before
        had_trial = self.db.query(Subscription).filter(
            and_(
                Subscription.customer_id == customer.id,
                Subscription.trial_start.isnot(None),
            )
        ).first()
        
        if had_trial:
            return {
                "has_trial": True,
                "is_active": False,
                "can_start_trial": False,
                "message": "Trial has already been used",
            }
        
        return {
            "has_trial": False,
            "is_active": False,
            "can_start_trial": True,
            "message": "Eligible for trial",
        }
    
    def get_trials_ending_soon(
        self,
        days: int = 3,
    ) -> List[Dict[str, Any]]:
        """Get trials that are ending soon.
        
        Args:
            days: Number of days to look ahead
            
        Returns:
            List of trials ending soon
        """
        end_threshold = datetime.utcnow() + timedelta(days=days)
        
        trials = self.db.query(Subscription).filter(
            and_(
                Subscription.status == SubscriptionStatusEnum.TRIALING,
                Subscription.trial_end <= end_threshold,
                Subscription.trial_end > datetime.utcnow(),
            )
        ).all()
        
        return [
            {
                "subscription_id": str(trial.id),
                "user_id": str(trial.customer.user_id),
                "plan_id": trial.plan_id,
                "trial_end": trial.trial_end.isoformat() if trial.trial_end else None,
                "days_remaining": trial.days_until_trial_ends,
            }
            for trial in trials
        ]
    
    def get_expired_trials(self) -> List[Dict[str, Any]]:
        """Get trials that have expired but not yet converted.
        
        Returns:
            List of expired trials
        """
        trials = self.db.query(Subscription).filter(
            and_(
                Subscription.status == SubscriptionStatusEnum.TRIALING,
                Subscription.trial_end < datetime.utcnow(),
            )
        ).all()
        
        return [
            {
                "subscription_id": str(trial.id),
                "user_id": str(trial.customer.user_id),
                "plan_id": trial.plan_id,
                "trial_end": trial.trial_end.isoformat() if trial.trial_end else None,
            }
            for trial in trials
        ]
    
    def process_expired_trials(self) -> Dict[str, Any]:
        """Process all expired trials.
        
        Returns:
            Dictionary with processing results
        """
        expired_trials = self.get_expired_trials()
        processed = []
        
        for trial_info in expired_trials:
            try:
                subscription = self.db.query(Subscription).filter(
                    Subscription.id == trial_info["subscription_id"]
                ).first()
                
                if subscription:
                    # Update status if Stripe has updated it
                    stripe_sub = stripe.Subscription.retrieve(
                        subscription.stripe_subscription_id
                    )
                    
                    if stripe_sub.status != "trialing":
                        old_status = subscription.status.value
                        subscription.status = SubscriptionStatusEnum(stripe_sub.status)
                        
                        # Log event
                        event = SubscriptionEvent(
                            subscription_id=subscription.id,
                            event_type="trial_expired",
                            description="Trial period has expired",
                            previous_values={"status": old_status},
                            new_values={"status": stripe_sub.status},
                        )
                        self.db.add(event)
                        
                        processed.append({
                            "subscription_id": str(subscription.id),
                            "new_status": stripe_sub.status,
                        })
                
            except Exception as e:
                logger.error(f"Error processing expired trial {trial_info['subscription_id']}: {str(e)}")
        
        self.db.commit()
        
        return {
            "processed_count": len(processed),
            "processed": processed,
        }
    
    def _get_or_create_customer(self, user_id: UUID) -> StripeCustomer:
        """Get or create Stripe customer."""
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if customer:
            return customer
        
        # Create new customer
        user = self._get_user_details(user_id)
        
        stripe_customer = stripe.Customer.create(
            email=user.get("email"),
            name=user.get("name"),
            metadata={
                "user_id": str(user_id),
                "app": "mindmate-ai",
            }
        )
        
        customer = StripeCustomer(
            user_id=user_id,
            stripe_customer_id=stripe_customer.id,
            email=user.get("email"),
            name=user.get("name"),
        )
        
        self.db.add(customer)
        self.db.commit()
        
        return customer
    
    def _get_user_details(self, user_id: UUID) -> Dict[str, Any]:
        """Get user details."""
        # Placeholder - replace with actual user service
        return {
            "email": f"user_{user_id}@example.com",
            "name": "User Name",
        }
    
    def _get_active_trial(self, user_id: UUID) -> Optional[Subscription]:
        """Get active trial subscription for user."""
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return None
        
        return self.db.query(Subscription).filter(
            and_(
                Subscription.customer_id == customer.id,
                Subscription.status == SubscriptionStatusEnum.TRIALING,
            )
        ).first()
    
    # ==================== Email Notifications ====================
    
    def _send_trial_started_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send trial started email."""
        logger.info(f"Sending trial started email to {customer.email}")
        # Implement email sending logic
    
    def _send_trial_converted_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send trial converted email."""
        logger.info(f"Sending trial converted email to {customer.email}")
        # Implement email sending logic
    
    def _send_trial_ending_reminder(
        self, 
        customer: StripeCustomer, 
        subscription: Subscription,
        days_remaining: int,
    ):
        """Send trial ending reminder email."""
        logger.info(f"Sending trial ending reminder ({days_remaining} days) to {customer.email}")
        # Implement email sending logic


# Convenience functions
def start_trial(
    db: Session,
    user_id: UUID,
    plan_id: str,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to start a trial.
    
    Args:
        db: Database session
        user_id: User UUID
        plan_id: Plan ID
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with trial details
    """
    manager = TrialManager(db)
    return manager.start_trial(user_id, plan_id, **kwargs)


def get_trial_status(db: Session, user_id: UUID) -> Dict[str, Any]:
    """Convenience function to get trial status.
    
    Args:
        db: Database session
        user_id: User UUID
        
    Returns:
        Dictionary with trial status
    """
    manager = TrialManager(db)
    return manager.get_trial_status(user_id)


def end_trial_early(
    db: Session,
    user_id: UUID,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to end trial early.
    
    Args:
        db: Database session
        user_id: User UUID
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with conversion details
    """
    manager = TrialManager(db)
    return manager.end_trial_early(user_id, **kwargs)
