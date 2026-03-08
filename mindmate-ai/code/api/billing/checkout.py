"""
Subscription Creation Flow - Checkout Session
=============================================
Handles creation of Stripe checkout sessions for new subscriptions.
"""

import stripe
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID
import logging

from sqlalchemy.orm import Session

from .config import StripeConfig, SUBSCRIPTION_PLANS, get_price_id_for_plan, is_valid_plan
from .models import (
    StripeCustomer, Subscription, CheckoutSession, 
    BillingCycleEnum, SubscriptionStatusEnum
)


logger = logging.getLogger(__name__)


class CheckoutError(Exception):
    """Custom exception for checkout errors."""
    pass


class SubscriptionCreationError(Exception):
    """Custom exception for subscription creation errors."""
    pass


class CheckoutSessionManager:
    """Manager for creating and handling checkout sessions."""
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the checkout session manager.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration (loads from env if not provided)
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
        stripe.api_key = self.config.secret_key
        stripe.api_version = self.config.api_version
    
    def create_checkout_session(
        self,
        user_id: UUID,
        plan_id: str,
        billing_cycle: str = "monthly",
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        trial_enabled: bool = True,
        custom_metadata: Optional[Dict[str, Any]] = None,
        allow_promotion_codes: bool = True,
        coupon_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new checkout session for subscription.
        
        Args:
            user_id: The user's UUID
            plan_id: The subscription plan ID (starter, professional, enterprise)
            billing_cycle: 'monthly' or 'yearly'
            success_url: Optional custom success URL
            cancel_url: Optional custom cancel URL
            trial_enabled: Whether to enable trial period
            custom_metadata: Additional metadata to store
            allow_promotion_codes: Whether to allow promotion codes
            coupon_code: Optional coupon code to apply
            
        Returns:
            Dictionary containing checkout session URL and ID
            
        Raises:
            CheckoutError: If checkout session creation fails
        """
        # Validate plan
        if not is_valid_plan(plan_id):
            raise CheckoutError(f"Invalid plan ID: {plan_id}")
        
        # Validate billing cycle
        if billing_cycle not in ["monthly", "yearly"]:
            raise CheckoutError(f"Invalid billing cycle: {billing_cycle}")
        
        # Get or create Stripe customer
        customer = self._get_or_create_customer(user_id)
        
        # Get price ID
        price_id = get_price_id_for_plan(plan_id, billing_cycle)
        if not price_id:
            raise CheckoutError(f"Price ID not configured for plan {plan_id}")
        
        # Prepare URLs
        success_url = success_url or self.config.success_url
        cancel_url = cancel_url or self.config.cancel_url
        
        # Build checkout session parameters
        session_params = self._build_session_params(
            customer=customer,
            price_id=price_id,
            plan_id=plan_id,
            billing_cycle=billing_cycle,
            success_url=success_url,
            cancel_url=cancel_url,
            trial_enabled=trial_enabled,
            user_id=user_id,
            custom_metadata=custom_metadata,
            allow_promotion_codes=allow_promotion_codes,
            coupon_code=coupon_code,
        )
        
        try:
            # Create Stripe checkout session
            stripe_session = stripe.checkout.Session.create(**session_params)
            
            # Record checkout session in database
            checkout_record = self._record_checkout_session(
                stripe_session=stripe_session,
                customer=customer,
                user_id=user_id,
                plan_id=plan_id,
                billing_cycle=billing_cycle,
                trial_enabled=trial_enabled,
            )
            
            logger.info(
                f"Created checkout session {stripe_session.id} for user {user_id}, "
                f"plan {plan_id}, billing {billing_cycle}"
            )
            
            return {
                "checkout_url": stripe_session.url,
                "session_id": stripe_session.id,
                "checkout_record_id": str(checkout_record.id),
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {str(e)}")
            raise CheckoutError(f"Failed to create checkout session: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating checkout session: {str(e)}")
            raise CheckoutError(f"Unexpected error: {str(e)}")
    
    def _get_or_create_customer(self, user_id: UUID) -> StripeCustomer:
        """Get existing Stripe customer or create new one.
        
        Args:
            user_id: The user's UUID
            
        Returns:
            StripeCustomer record
        """
        # Check for existing customer
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if customer:
            logger.debug(f"Found existing Stripe customer {customer.stripe_customer_id}")
            return customer
        
        # Get user details (this would come from your user service)
        user = self._get_user_details(user_id)
        
        # Create Stripe customer
        try:
            stripe_customer = stripe.Customer.create(
                email=user.get("email"),
                name=user.get("name"),
                metadata={
                    "user_id": str(user_id),
                    "app": "mindmate-ai",
                }
            )
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {str(e)}")
            raise CheckoutError(f"Failed to create customer: {str(e)}")
        
        # Create database record
        customer = StripeCustomer(
            user_id=user_id,
            stripe_customer_id=stripe_customer.id,
            email=user.get("email"),
            name=user.get("name"),
        )
        
        self.db.add(customer)
        self.db.commit()
        
        logger.info(f"Created new Stripe customer {stripe_customer.id} for user {user_id}")
        
        return customer
    
    def _get_user_details(self, user_id: UUID) -> Dict[str, Any]:
        """Get user details from user service.
        
        In production, this would query your user service/database.
        """
        # Placeholder - replace with actual user service call
        return {
            "email": f"user_{user_id}@example.com",
            "name": "User Name",
        }
    
    def _build_session_params(
        self,
        customer: StripeCustomer,
        price_id: str,
        plan_id: str,
        billing_cycle: str,
        success_url: str,
        cancel_url: str,
        trial_enabled: bool,
        user_id: UUID,
        custom_metadata: Optional[Dict[str, Any]],
        allow_promotion_codes: bool,
        coupon_code: Optional[str],
    ) -> Dict[str, Any]:
        """Build parameters for Stripe checkout session.
        
        Args:
            customer: StripeCustomer record
            price_id: Stripe price ID
            plan_id: Plan ID
            billing_cycle: Billing cycle
            success_url: Success redirect URL
            cancel_url: Cancel redirect URL
            trial_enabled: Whether trial is enabled
            user_id: User UUID
            custom_metadata: Additional metadata
            allow_promotion_codes: Allow promotion codes
            coupon_code: Coupon code to apply
            
        Returns:
            Dictionary of session parameters
        """
        params = {
            "customer": customer.stripe_customer_id,
            "mode": "subscription",
            "line_items": [{
                "price": price_id,
                "quantity": 1,
            }],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "client_reference_id": str(user_id),
            "metadata": {
                "user_id": str(user_id),
                "plan_id": plan_id,
                "billing_cycle": billing_cycle,
                "app": "mindmate-ai",
                **(custom_metadata or {}),
            },
            "subscription_data": {
                "metadata": {
                    "user_id": str(user_id),
                    "plan_id": plan_id,
                    "billing_cycle": billing_cycle,
                    "app": "mindmate-ai",
                },
            },
            "allow_promotion_codes": allow_promotion_codes,
            "billing_address_collection": "required",
            "automatic_tax": {
                "enabled": False,  # Set to True if using Stripe Tax
            },
        }
        
        # Add trial period if enabled
        if trial_enabled:
            params["subscription_data"]["trial_period_days"] = self.config.trial_period_days
            params["subscription_data"]["trial_settings"] = {
                "end_behavior": {
                    "missing_payment_method": "pause"
                }
            }
        
        # Apply coupon if provided
        if coupon_code:
            params["discounts"] = [{"coupon": coupon_code}]
        
        # Configure payment method collection
        if self.config.payment_method_collection == "always":
            params["payment_method_collection"] = "always"
        
        return params
    
    def _record_checkout_session(
        self,
        stripe_session: stripe.checkout.Session,
        customer: StripeCustomer,
        user_id: UUID,
        plan_id: str,
        billing_cycle: str,
        trial_enabled: bool,
    ) -> CheckoutSession:
        """Record checkout session in database.
        
        Args:
            stripe_session: Stripe checkout session object
            customer: StripeCustomer record
            user_id: User UUID
            plan_id: Plan ID
            billing_cycle: Billing cycle
            trial_enabled: Whether trial is enabled
            
        Returns:
            CheckoutSession database record
        """
        checkout_record = CheckoutSession(
            customer_id=customer.id if customer else None,
            user_id=user_id,
            stripe_session_id=stripe_session.id,
            mode="subscription",
            plan_id=plan_id,
            billing_cycle=BillingCycleEnum(billing_cycle),
            success_url=stripe_session.success_url,
            cancel_url=stripe_session.cancel_url,
            trial_enabled=trial_enabled,
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
        
        self.db.add(checkout_record)
        self.db.commit()
        
        return checkout_record
    
    def get_checkout_session(self, session_id: str) -> Optional[CheckoutSession]:
        """Get checkout session by Stripe session ID.
        
        Args:
            session_id: Stripe checkout session ID
            
        Returns:
            CheckoutSession record or None
        """
        return self.db.query(CheckoutSession).filter(
            CheckoutSession.stripe_session_id == session_id
        ).first()
    
    def expire_checkout_session(self, session_id: str) -> bool:
        """Expire a checkout session.
        
        Args:
            session_id: Stripe checkout session ID
            
        Returns:
            True if expired successfully
        """
        try:
            stripe.checkout.Session.expire(session_id)
            
            # Update database record
            checkout = self.get_checkout_session(session_id)
            if checkout:
                checkout.status = "expired"
                self.db.commit()
            
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Failed to expire checkout session: {str(e)}")
            return False


class SubscriptionManager:
    """Manager for subscription operations."""
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the subscription manager.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
        stripe.api_key = self.config.secret_key
        stripe.api_version = self.config.api_version
    
    def create_subscription_direct(
        self,
        user_id: UUID,
        plan_id: str,
        billing_cycle: str = "monthly",
        trial_enabled: bool = True,
        payment_method_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create subscription directly without checkout (for existing customers).
        
        Args:
            user_id: User UUID
            plan_id: Plan ID
            billing_cycle: Billing cycle
            trial_enabled: Whether to enable trial
            payment_method_id: Optional payment method ID
            
        Returns:
            Dictionary with subscription details
        """
        # Validate plan
        if not is_valid_plan(plan_id):
            raise SubscriptionCreationError(f"Invalid plan ID: {plan_id}")
        
        # Get customer
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            raise SubscriptionCreationError("Customer not found")
        
        # Get price ID
        price_id = get_price_id_for_plan(plan_id, billing_cycle)
        if not price_id:
            raise SubscriptionCreationError(f"Price ID not configured for plan {plan_id}")
        
        # Build subscription parameters
        subscription_params = {
            "customer": customer.stripe_customer_id,
            "items": [{"price": price_id}],
            "metadata": {
                "user_id": str(user_id),
                "plan_id": plan_id,
                "billing_cycle": billing_cycle,
                "app": "mindmate-ai",
            },
            "payment_behavior": "default_incomplete",
            "expand": ["latest_invoice.payment_intent"],
        }
        
        # Add trial if enabled
        if trial_enabled:
            subscription_params["trial_period_days"] = self.config.trial_period_days
        
        # Add default payment method if provided
        if payment_method_id:
            subscription_params["default_payment_method"] = payment_method_id
        elif customer.default_payment_method_id:
            subscription_params["default_payment_method"] = customer.default_payment_method_id
        
        try:
            # Create Stripe subscription
            stripe_subscription = stripe.Subscription.create(**subscription_params)
            
            # Create database record
            subscription = self._create_subscription_record(
                customer=customer,
                stripe_subscription=stripe_subscription,
                plan_id=plan_id,
                billing_cycle=billing_cycle,
            )
            
            logger.info(
                f"Created subscription {stripe_subscription.id} for user {user_id}"
            )
            
            return {
                "subscription_id": str(subscription.id),
                "stripe_subscription_id": stripe_subscription.id,
                "status": stripe_subscription.status,
                "client_secret": stripe_subscription.latest_invoice.payment_intent.client_secret
                if stripe_subscription.latest_invoice and stripe_subscription.latest_invoice.payment_intent
                else None,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating subscription: {str(e)}")
            raise SubscriptionCreationError(f"Failed to create subscription: {str(e)}")
    
    def _create_subscription_record(
        self,
        customer: StripeCustomer,
        stripe_subscription: stripe.Subscription,
        plan_id: str,
        billing_cycle: str,
    ) -> Subscription:
        """Create subscription database record.
        
        Args:
            customer: StripeCustomer record
            stripe_subscription: Stripe subscription object
            plan_id: Plan ID
            billing_cycle: Billing cycle
            
        Returns:
            Subscription database record
        """
        # Determine status
        status = SubscriptionStatusEnum(stripe_subscription.status)
        
        # Parse dates
        trial_start = None
        trial_end = None
        if stripe_subscription.trial_start:
            trial_start = datetime.fromtimestamp(stripe_subscription.trial_start)
        if stripe_subscription.trial_end:
            trial_end = datetime.fromtimestamp(stripe_subscription.trial_end)
        
        subscription = Subscription(
            customer_id=customer.id,
            stripe_subscription_id=stripe_subscription.id,
            plan_id=plan_id,
            billing_cycle=BillingCycleEnum(billing_cycle),
            status=status,
            trial_start=trial_start,
            trial_end=trial_end,
            current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start),
            current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end),
            cancel_at_period_end=stripe_subscription.cancel_at_period_end,
            default_payment_method_id=stripe_subscription.default_payment_method,
            metadata={
                "stripe_items": [
                    {"id": item.id, "price": item.price.id}
                    for item in stripe_subscription.items.data
                ]
            },
        )
        
        self.db.add(subscription)
        self.db.commit()
        
        return subscription


# Convenience functions for API endpoints
def create_checkout_session(
    db: Session,
    user_id: UUID,
    plan_id: str,
    billing_cycle: str = "monthly",
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to create checkout session.
    
    Args:
        db: Database session
        user_id: User UUID
        plan_id: Plan ID
        billing_cycle: Billing cycle
        **kwargs: Additional parameters for CheckoutSessionManager
        
    Returns:
        Dictionary with checkout URL and session details
    """
    manager = CheckoutSessionManager(db)
    return manager.create_checkout_session(
        user_id=user_id,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        **kwargs
    )


def create_subscription_direct(
    db: Session,
    user_id: UUID,
    plan_id: str,
    billing_cycle: str = "monthly",
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to create subscription directly.
    
    Args:
        db: Database session
        user_id: User UUID
        plan_id: Plan ID
        billing_cycle: Billing cycle
        **kwargs: Additional parameters for SubscriptionManager
        
    Returns:
        Dictionary with subscription details
    """
    manager = SubscriptionManager(db)
    return manager.create_subscription_direct(
        user_id=user_id,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        **kwargs
    )
