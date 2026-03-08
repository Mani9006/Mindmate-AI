"""
Customer Portal Integration
===========================
Handles Stripe Customer Portal for subscription management.
"""

import stripe
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
import logging

from sqlalchemy.orm import Session

from .config import StripeConfig, SUBSCRIPTION_PLANS, get_plan_by_id
from .models import (
    StripeCustomer, Subscription, PaymentMethod, Invoice,
    SubscriptionStatusEnum, BillingCycleEnum
)


logger = logging.getLogger(__name__)


class PortalError(Exception):
    """Custom exception for portal errors."""
    pass


class CustomerPortalManager:
    """Manager for Stripe Customer Portal operations."""
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the customer portal manager.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
        stripe.api_key = self.config.secret_key
        stripe.api_version = self.config.api_version
    
    def create_portal_session(
        self,
        user_id: UUID,
        return_url: Optional[str] = None,
        configuration: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a customer portal session.
        
        Args:
            user_id: User UUID
            return_url: URL to return to after portal session
            configuration: Optional portal configuration overrides
            
        Returns:
            Dictionary with portal URL and session details
            
        Raises:
            PortalError: If portal session creation fails
        """
        # Get customer
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            raise PortalError("Customer not found")
        
        # Prepare return URL
        return_url = return_url or self.config.portal_return_url
        
        # Build portal session parameters
        params = {
            "customer": customer.stripe_customer_id,
            "return_url": return_url,
        }
        
        # Add configuration if provided
        if configuration:
            params["configuration"] = configuration
        
        try:
            # Create portal session
            session = stripe.billing_portal.Session.create(**params)
            
            logger.info(f"Created portal session for user {user_id}")
            
            return {
                "portal_url": session.url,
                "session_id": session.id,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating portal session: {str(e)}")
            raise PortalError(f"Failed to create portal session: {str(e)}")
    
    def get_portal_configuration(
        self,
        features: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Get or create portal configuration.
        
        Args:
            features: Optional feature configuration overrides
            
        Returns:
            Portal configuration
        """
        default_features = {
            "customer_update": {
                "enabled": True,
                "allowed_updates": ["email", "tax_id"],
            },
            "invoice_history": {"enabled": True},
            "payment_method_update": {"enabled": True},
            "subscription_update": {
                "enabled": True,
                "default_allowed_updates": ["price", "promotion_code"],
                "proration_behavior": self.config.proration_behavior,
                "products": [
                    {
                        "product": plan.get("stripe_product_id", ""),
                        "prices": [
                            plan.get("stripe_price_id_monthly", ""),
                            plan.get("stripe_price_id_yearly", ""),
                        ],
                    }
                    for plan in SUBSCRIPTION_PLANS.values()
                    if plan.get("stripe_price_id_monthly")
                ],
            },
            "subscription_cancel": {
                "enabled": True,
                "mode": "at_period_end",
                "cancellation_reason": {
                    "enabled": True,
                    "options": [
                        "too_expensive",
                        "missing_features",
                        "switched_service",
                        "unused",
                        "other",
                    ],
                },
            },
        }
        
        # Merge with provided features
        if features:
            default_features.update(features)
        
        return default_features
    
    def create_portal_configuration(
        self,
        business_profile: Dict[str, Any],
        features: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new portal configuration.
        
        Args:
            business_profile: Business profile information
            features: Feature configuration
            
        Returns:
            Created configuration
        """
        config_features = self.get_portal_configuration(features)
        
        try:
            configuration = stripe.billing_portal.Configuration.create(
                business_profile=business_profile,
                features=config_features,
            )
            
            return {
                "configuration_id": configuration.id,
                "features": configuration.features,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating portal configuration: {str(e)}")
            raise PortalError(f"Failed to create portal configuration: {str(e)}")


class SubscriptionManager:
    """Manager for subscription management operations."""
    
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
    
    def get_subscription_details(self, user_id: UUID) -> Dict[str, Any]:
        """Get detailed subscription information for user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dictionary with subscription details
        """
        # Get customer
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return {
                "has_subscription": False,
                "plan": None,
            }
        
        # Get subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.customer_id == customer.id,
        ).order_by(Subscription.created_at.desc()).first()
        
        if not subscription:
            return {
                "has_subscription": False,
                "plan": None,
                "customer": {
                    "id": str(customer.id),
                    "stripe_id": customer.stripe_customer_id,
                    "email": customer.email,
                },
            }
        
        # Get plan details
        plan = get_plan_by_id(subscription.plan_id)
        
        return {
            "has_subscription": True,
            "subscription": {
                "id": str(subscription.id),
                "stripe_id": subscription.stripe_subscription_id,
                "plan_id": subscription.plan_id,
                "plan_name": plan["name"] if plan else subscription.plan_id,
                "billing_cycle": subscription.billing_cycle.value,
                "status": subscription.status.value,
                "is_active": subscription.is_active,
                "is_trial": subscription.is_trial_active,
                "trial_days_remaining": subscription.days_until_trial_ends,
                "current_period_start": subscription.current_period_start.isoformat(),
                "current_period_end": subscription.current_period_end.isoformat(),
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "canceled_at": subscription.canceled_at.isoformat() if subscription.canceled_at else None,
                "sessions_used": subscription.sessions_used_this_period,
                "sessions_remaining": subscription.get_sessions_remaining(),
            },
            "plan": {
                "id": plan["id"] if plan else None,
                "name": plan["name"] if plan else None,
                "description": plan["description"] if plan else None,
                "features": plan["features"] if plan else [],
                "limits": plan["limits"] if plan else {},
            } if plan else None,
        }
    
    def cancel_subscription(
        self,
        user_id: UUID,
        at_period_end: bool = True,
        reason: Optional[str] = None,
        feedback: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancel user's subscription.
        
        Args:
            user_id: User UUID
            at_period_end: Whether to cancel at period end (True) or immediately (False)
            reason: Cancellation reason
            feedback: Additional feedback
            
        Returns:
            Dictionary with cancellation result
        """
        # Get subscription
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            raise PortalError("Customer not found")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.customer_id == customer.id,
            Subscription.status.in_([
                SubscriptionStatusEnum.ACTIVE,
                SubscriptionStatusEnum.TRIALING,
            ]),
        ).first()
        
        if not subscription:
            raise PortalError("No active subscription found")
        
        try:
            if at_period_end:
                # Cancel at period end
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True,
                    cancellation_reason={
                        "feedback": feedback or "other",
                        "comment": reason,
                    } if reason else None,
                )
                
                subscription.cancel_at_period_end = True
                subscription.cancellation_reason = reason
                
                self.db.commit()
                
                logger.info(f"Subscription {subscription.id} scheduled for cancellation at period end")
                
                return {
                    "status": "scheduled",
                    "message": "Subscription will be canceled at the end of the billing period",
                    "cancel_at": subscription.current_period_end.isoformat(),
                }
            else:
                # Cancel immediately
                stripe.Subscription.delete(subscription.stripe_subscription_id)
                
                subscription.status = SubscriptionStatusEnum.CANCELED
                subscription.ended_at = datetime.utcnow()
                subscription.cancel_at_period_end = True
                subscription.cancellation_reason = reason
                
                self.db.commit()
                
                logger.info(f"Subscription {subscription.id} canceled immediately")
                
                return {
                    "status": "canceled",
                    "message": "Subscription has been canceled immediately",
                }
                
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling subscription: {str(e)}")
            raise PortalError(f"Failed to cancel subscription: {str(e)}")
    
    def reactivate_subscription(self, user_id: UUID) -> Dict[str, Any]:
        """Reactivate a subscription scheduled for cancellation.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dictionary with reactivation result
        """
        # Get subscription
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            raise PortalError("Customer not found")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.customer_id == customer.id,
            Subscription.cancel_at_period_end == True,
            Subscription.status.in_([
                SubscriptionStatusEnum.ACTIVE,
                SubscriptionStatusEnum.TRIALING,
            ]),
        ).first()
        
        if not subscription:
            raise PortalError("No subscription scheduled for cancellation found")
        
        try:
            # Remove cancellation schedule
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=False,
            )
            
            subscription.cancel_at_period_end = False
            subscription.cancellation_reason = None
            
            self.db.commit()
            
            logger.info(f"Subscription {subscription.id} reactivated")
            
            return {
                "status": "reactivated",
                "message": "Subscription has been reactivated",
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error reactivating subscription: {str(e)}")
            raise PortalError(f"Failed to reactivate subscription: {str(e)}")
    
    def update_payment_method(
        self,
        user_id: UUID,
        payment_method_id: str,
        set_as_default: bool = True,
    ) -> Dict[str, Any]:
        """Update payment method for user.
        
        Args:
            user_id: User UUID
            payment_method_id: Stripe payment method ID
            set_as_default: Whether to set as default payment method
            
        Returns:
            Dictionary with update result
        """
        # Get customer
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            raise PortalError("Customer not found")
        
        try:
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer.stripe_customer_id,
            )
            
            if set_as_default:
                # Set as default payment method
                stripe.Customer.modify(
                    customer.stripe_customer_id,
                    invoice_settings={
                        "default_payment_method": payment_method_id,
                    },
                )
                
                customer.default_payment_method_id = payment_method_id
                self.db.commit()
            
            # Get payment method details
            pm = stripe.PaymentMethod.retrieve(payment_method_id)
            
            # Update or create payment method record
            pm_record = self.db.query(PaymentMethod).filter(
                PaymentMethod.stripe_payment_method_id == payment_method_id
            ).first()
            
            if pm_record:
                pm_record.card_brand = pm.card.brand if pm.card else None
                pm_record.card_last4 = pm.card.last4 if pm.card else None
                pm_record.card_exp_month = pm.card.exp_month if pm.card else None
                pm_record.card_exp_year = pm.card.exp_year if pm.card else None
            else:
                pm_record = PaymentMethod(
                    customer_id=customer.id,
                    stripe_payment_method_id=payment_method_id,
                    type=pm.type,
                    card_brand=pm.card.brand if pm.card else None,
                    card_last4=pm.card.last4 if pm.card else None,
                    card_exp_month=pm.card.exp_month if pm.card else None,
                    card_exp_year=pm.card.exp_year if pm.card else None,
                    is_default=set_as_default,
                )
                self.db.add(pm_record)
            
            self.db.commit()
            
            logger.info(f"Payment method {payment_method_id} updated for user {user_id}")
            
            return {
                "status": "updated",
                "payment_method": {
                    "id": payment_method_id,
                    "type": pm.type,
                    "brand": pm.card.brand if pm.card else None,
                    "last4": pm.card.last4 if pm.card else None,
                },
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error updating payment method: {str(e)}")
            raise PortalError(f"Failed to update payment method: {str(e)}")
    
    def get_payment_methods(self, user_id: UUID) -> List[Dict[str, Any]]:
        """Get all payment methods for user.
        
        Args:
            user_id: User UUID
            
        Returns:
            List of payment methods
        """
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return []
        
        # Get from database
        pm_records = self.db.query(PaymentMethod).filter(
            PaymentMethod.customer_id == customer.id
        ).all()
        
        return [
            {
                "id": pm.stripe_payment_method_id,
                "type": pm.type,
                "brand": pm.card_brand,
                "last4": pm.card_last4,
                "exp_month": pm.card_exp_month,
                "exp_year": pm.card_exp_year,
                "is_default": pm.is_default or pm.stripe_payment_method_id == customer.default_payment_method_id,
            }
            for pm in pm_records
        ]
    
    def delete_payment_method(self, user_id: UUID, payment_method_id: str) -> Dict[str, Any]:
        """Delete a payment method.
        
        Args:
            user_id: User UUID
            payment_method_id: Stripe payment method ID
            
        Returns:
            Dictionary with deletion result
        """
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            raise PortalError("Customer not found")
        
        # Verify payment method belongs to customer
        pm_record = self.db.query(PaymentMethod).filter(
            PaymentMethod.stripe_payment_method_id == payment_method_id,
            PaymentMethod.customer_id == customer.id,
        ).first()
        
        if not pm_record:
            raise PortalError("Payment method not found")
        
        try:
            # Detach from Stripe
            stripe.PaymentMethod.detach(payment_method_id)
            
            # Delete from database
            self.db.delete(pm_record)
            self.db.commit()
            
            logger.info(f"Payment method {payment_method_id} deleted for user {user_id}")
            
            return {
                "status": "deleted",
                "payment_method_id": payment_method_id,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error deleting payment method: {str(e)}")
            raise PortalError(f"Failed to delete payment method: {str(e)}")
    
    def get_invoices(self, user_id: UUID, limit: int = 10) -> List[Dict[str, Any]]:
        """Get invoice history for user.
        
        Args:
            user_id: User UUID
            limit: Maximum number of invoices to return
            
        Returns:
            List of invoices
        """
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return []
        
        # Get from database
        invoices = self.db.query(Invoice).filter(
            Invoice.customer_id == customer.id
        ).order_by(Invoice.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": inv.stripe_invoice_id,
                "number": inv.number,
                "amount_due": float(inv.amount_due),
                "amount_paid": float(inv.amount_paid),
                "currency": inv.currency,
                "status": inv.status.value,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
                "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
                "pdf_url": inv.invoice_pdf,
                "hosted_url": inv.hosted_invoice_url,
            }
            for inv in invoices
        ]
    
    def get_upcoming_invoice(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get upcoming invoice for user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Upcoming invoice details or None
        """
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return None
        
        try:
            # Get upcoming invoice from Stripe
            upcoming = stripe.Invoice.upcoming(
                customer=customer.stripe_customer_id,
            )
            
            return {
                "amount_due": upcoming.amount_due / 100,
                "currency": upcoming.currency,
                "period_start": datetime.fromtimestamp(upcoming.period_start).isoformat(),
                "period_end": datetime.fromtimestamp(upcoming.period_end).isoformat(),
                "line_items": [
                    {
                        "description": line.description,
                        "amount": line.amount / 100,
                    }
                    for line in upcoming.lines.data
                ],
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting upcoming invoice: {str(e)}")
            return None


# Convenience functions for API endpoints
def create_portal_session(
    db: Session,
    user_id: UUID,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to create portal session.
    
    Args:
        db: Database session
        user_id: User UUID
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with portal URL
    """
    manager = CustomerPortalManager(db)
    return manager.create_portal_session(user_id, **kwargs)


def get_subscription_details(db: Session, user_id: UUID) -> Dict[str, Any]:
    """Convenience function to get subscription details.
    
    Args:
        db: Database session
        user_id: User UUID
        
    Returns:
        Dictionary with subscription details
    """
    manager = SubscriptionManager(db)
    return manager.get_subscription_details(user_id)


def cancel_subscription(
    db: Session,
    user_id: UUID,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to cancel subscription.
    
    Args:
        db: Database session
        user_id: User UUID
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with cancellation result
    """
    manager = SubscriptionManager(db)
    return manager.cancel_subscription(user_id, **kwargs)


def reactivate_subscription(db: Session, user_id: UUID) -> Dict[str, Any]:
    """Convenience function to reactivate subscription.
    
    Args:
        db: Database session
        user_id: User UUID
        
    Returns:
        Dictionary with reactivation result
    """
    manager = SubscriptionManager(db)
    return manager.reactivate_subscription(user_id)
