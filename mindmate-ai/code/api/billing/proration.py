"""
Proration on Plan Changes
=========================
Handles plan upgrades, downgrades, and billing cycle changes with proration.
"""

import stripe
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID
import logging

from sqlalchemy.orm import Session
from sqlalchemy import and_

from .config import StripeConfig, SUBSCRIPTION_PLANS, get_price_id_for_plan, get_plan_by_id
from .models import (
    StripeCustomer, Subscription, SubscriptionEvent,
    SubscriptionStatusEnum, BillingCycleEnum
)


logger = logging.getLogger(__name__)


class PlanChangeError(Exception):
    """Custom exception for plan change errors."""
    pass


class ProrationManager:
    """Manager for proration and plan changes."""
    
    # Plan hierarchy for upgrade/downgrade detection
    PLAN_HIERARCHY = ["starter", "professional", "enterprise"]
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the proration manager.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
        stripe.api_key = self.config.secret_key
        stripe.api_version = self.config.api_version
    
    def preview_plan_change(
        self,
        user_id: UUID,
        new_plan_id: str,
        new_billing_cycle: Optional[str] = None,
        proration_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Preview a plan change with proration.
        
        Args:
            user_id: User UUID
            new_plan_id: New plan ID
            new_billing_cycle: New billing cycle (optional, keeps current if not specified)
            proration_date: Date for proration calculation (defaults to now)
            
        Returns:
            Dictionary with proration preview
            
        Raises:
            PlanChangeError: If preview cannot be generated
        """
        # Get current subscription
        subscription = self._get_active_subscription(user_id)
        
        if not subscription:
            raise PlanChangeError("No active subscription found")
        
        # Validate new plan
        if new_plan_id not in SUBSCRIPTION_PLANS:
            raise PlanChangeError(f"Invalid plan ID: {new_plan_id}")
        
        # Determine billing cycle
        if not new_billing_cycle:
            new_billing_cycle = subscription.billing_cycle.value
        
        # Get price ID
        new_price_id = get_price_id_for_plan(new_plan_id, new_billing_cycle)
        if not new_price_id:
            raise PlanChangeError(f"Price not configured for plan {new_plan_id}")
        
        # Determine proration date
        if not proration_date:
            proration_date = datetime.utcnow()
        
        try:
            # Create preview invoice
            preview = stripe.Invoice.upcoming(
                customer=subscription.customer.stripe_customer_id,
                subscription=subscription.stripe_subscription_id,
                subscription_items=[{
                    "id": self._get_subscription_item_id(subscription),
                    "price": new_price_id,
                }],
                subscription_proration_date=int(proration_date.timestamp()),
            )
            
            # Calculate proration details
            current_plan = get_plan_by_id(subscription.plan_id)
            new_plan = get_plan_by_id(new_plan_id)
            
            is_upgrade = self._is_upgrade(subscription.plan_id, new_plan_id)
            is_downgrade = self._is_downgrade(subscription.plan_id, new_plan_id)
            
            return {
                "current_plan": {
                    "id": subscription.plan_id,
                    "name": current_plan["name"] if current_plan else subscription.plan_id,
                    "billing_cycle": subscription.billing_cycle.value,
                },
                "new_plan": {
                    "id": new_plan_id,
                    "name": new_plan["name"] if new_plan else new_plan_id,
                    "billing_cycle": new_billing_cycle,
                },
                "change_type": "upgrade" if is_upgrade else ("downgrade" if is_downgrade else "same"),
                "proration": {
                    "proration_date": proration_date.isoformat(),
                    "amount_due": preview.amount_due / 100,
                    "amount_remaining": preview.amount_remaining / 100,
                    "subtotal": preview.subtotal / 100,
                    "tax": preview.tax / 100 if preview.tax else 0,
                    "currency": preview.currency,
                },
                "period": {
                    "start": datetime.fromtimestamp(preview.period_start).isoformat(),
                    "end": datetime.fromtimestamp(preview.period_end).isoformat(),
                },
                "line_items": [
                    {
                        "description": line.description,
                        "amount": line.amount / 100,
                        "currency": line.currency,
                        "period_start": datetime.fromtimestamp(line.period.start).isoformat() if line.period else None,
                        "period_end": datetime.fromtimestamp(line.period.end).isoformat() if line.period else None,
                    }
                    for line in preview.lines.data
                ],
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error previewing plan change: {str(e)}")
            raise PlanChangeError(f"Failed to preview plan change: {str(e)}")
    
    def change_plan(
        self,
        user_id: UUID,
        new_plan_id: str,
        new_billing_cycle: Optional[str] = None,
        proration_behavior: Optional[str] = None,
        effective_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Change subscription plan with proration.
        
        Args:
            user_id: User UUID
            new_plan_id: New plan ID
            new_billing_cycle: New billing cycle (optional)
            proration_behavior: Proration behavior override
            effective_date: When the change takes effect (defaults to immediately)
            
        Returns:
            Dictionary with change result
            
        Raises:
            PlanChangeError: If plan change fails
        """
        # Get current subscription
        subscription = self._get_active_subscription(user_id)
        
        if not subscription:
            raise PlanChangeError("No active subscription found")
        
        # Validate new plan
        if new_plan_id not in SUBSCRIPTION_PLANS:
            raise PlanChangeError(f"Invalid plan ID: {new_plan_id}")
        
        # Can't change to same plan
        if new_plan_id == subscription.plan_id and not new_billing_cycle:
            raise PlanChangeError("Cannot change to the same plan")
        
        # Determine billing cycle
        if not new_billing_cycle:
            new_billing_cycle = subscription.billing_cycle.value
        
        # Get price ID
        new_price_id = get_price_id_for_plan(new_plan_id, new_billing_cycle)
        if not new_price_id:
            raise PlanChangeError(f"Price not configured for plan {new_plan_id}")
        
        # Determine proration behavior
        proration_behavior = proration_behavior or self.config.proration_behavior
        
        # Determine if this is an upgrade or downgrade
        is_upgrade = self._is_upgrade(subscription.plan_id, new_plan_id)
        is_downgrade = self._is_downgrade(subscription.plan_id, new_plan_id)
        
        try:
            # Get subscription item ID
            item_id = self._get_subscription_item_id(subscription)
            
            # Prepare update parameters
            update_params = {
                "items": [{
                    "id": item_id,
                    "price": new_price_id,
                }],
                "proration_behavior": proration_behavior,
                "metadata": {
                    **subscription.metadata,
                    "previous_plan": subscription.plan_id,
                    "previous_billing_cycle": subscription.billing_cycle.value,
                    "plan_changed_at": datetime.utcnow().isoformat(),
                },
            }
            
            # Handle effective date
            if effective_date and effective_date > datetime.utcnow():
                # Schedule change for future
                update_params["billing_cycle_anchor"] = "unchanged"
                # Store pending change
                subscription.pending_plan_id = new_plan_id
                subscription.pending_billing_cycle = BillingCycleEnum(new_billing_cycle)
            
            # Update subscription in Stripe
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                **update_params,
            )
            
            # Store previous values for audit
            previous_values = {
                "plan_id": subscription.plan_id,
                "billing_cycle": subscription.billing_cycle.value,
            }
            
            # Update database record
            subscription.plan_id = new_plan_id
            subscription.billing_cycle = BillingCycleEnum(new_billing_cycle)
            subscription.metadata["plan_change_history"] = subscription.metadata.get("plan_change_history", []) + [{
                "from_plan": previous_values["plan_id"],
                "to_plan": new_plan_id,
                "changed_at": datetime.utcnow().isoformat(),
                "is_upgrade": is_upgrade,
                "is_downgrade": is_downgrade,
            }]
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="plan_changed",
                description=f"Plan changed from {previous_values['plan_id']} to {new_plan_id}",
                previous_values=previous_values,
                new_values={
                    "plan_id": new_plan_id,
                    "billing_cycle": new_billing_cycle,
                },
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(
                f"Plan changed for subscription {subscription.id}: "
                f"{previous_values['plan_id']} -> {new_plan_id}"
            )
            
            # Send notification email
            self._send_plan_change_email(
                subscription.customer,
                subscription,
                previous_values["plan_id"],
                new_plan_id,
                is_upgrade,
            )
            
            return {
                "subscription_id": str(subscription.id),
                "previous_plan": previous_values["plan_id"],
                "new_plan": new_plan_id,
                "billing_cycle": new_billing_cycle,
                "change_type": "upgrade" if is_upgrade else ("downgrade" if is_downgrade else "change"),
                "effective_immediately": effective_date is None or effective_date <= datetime.utcnow(),
                "proration_behavior": proration_behavior,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error changing plan: {str(e)}")
            raise PlanChangeError(f"Failed to change plan: {str(e)}")
    
    def change_billing_cycle(
        self,
        user_id: UUID,
        new_billing_cycle: str,
        proration_behavior: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Change billing cycle (monthly/yearly) with proration.
        
        Args:
            user_id: User UUID
            new_billing_cycle: New billing cycle ('monthly' or 'yearly')
            proration_behavior: Proration behavior override
            
        Returns:
            Dictionary with change result
        """
        # Get current subscription
        subscription = self._get_active_subscription(user_id)
        
        if not subscription:
            raise PlanChangeError("No active subscription found")
        
        # Validate billing cycle
        if new_billing_cycle not in ["monthly", "yearly"]:
            raise PlanChangeError(f"Invalid billing cycle: {new_billing_cycle}")
        
        # Can't change to same cycle
        if new_billing_cycle == subscription.billing_cycle.value:
            raise PlanChangeError("Already on this billing cycle")
        
        # Get price for new billing cycle
        new_price_id = get_price_id_for_plan(subscription.plan_id, new_billing_cycle)
        if not new_price_id:
            raise PlanChangeError(f"Price not configured for billing cycle {new_billing_cycle}")
        
        proration_behavior = proration_behavior or self.config.proration_behavior
        
        try:
            # Get subscription item ID
            item_id = self._get_subscription_item_id(subscription)
            
            # Update subscription
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[{
                    "id": item_id,
                    "price": new_price_id,
                }],
                proration_behavior=proration_behavior,
                billing_cycle_anchor="now" if new_billing_cycle == "yearly" else "unchanged",
            )
            
            # Store previous values
            previous_values = {
                "billing_cycle": subscription.billing_cycle.value,
            }
            
            # Update database record
            subscription.billing_cycle = BillingCycleEnum(new_billing_cycle)
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="billing_cycle_changed",
                description=f"Billing cycle changed from {previous_values['billing_cycle']} to {new_billing_cycle}",
                previous_values=previous_values,
                new_values={"billing_cycle": new_billing_cycle},
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(
                f"Billing cycle changed for subscription {subscription.id}: "
                f"{previous_values['billing_cycle']} -> {new_billing_cycle}"
            )
            
            return {
                "subscription_id": str(subscription.id),
                "previous_cycle": previous_values["billing_cycle"],
                "new_cycle": new_billing_cycle,
                "effective_date": datetime.utcnow().isoformat(),
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error changing billing cycle: {str(e)}")
            raise PlanChangeError(f"Failed to change billing cycle: {str(e)}")
    
    def schedule_plan_change(
        self,
        user_id: UUID,
        new_plan_id: str,
        effective_date: datetime,
        new_billing_cycle: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Schedule a plan change for a future date.
        
        Args:
            user_id: User UUID
            new_plan_id: New plan ID
            effective_date: When the change should take effect
            new_billing_cycle: Optional new billing cycle
            
        Returns:
            Dictionary with scheduled change details
        """
        subscription = self._get_active_subscription(user_id)
        
        if not subscription:
            raise PlanChangeError("No active subscription found")
        
        if new_plan_id not in SUBSCRIPTION_PLANS:
            raise PlanChangeError(f"Invalid plan ID: {new_plan_id}")
        
        if not new_billing_cycle:
            new_billing_cycle = subscription.billing_cycle.value
        
        new_price_id = get_price_id_for_plan(new_plan_id, new_billing_cycle)
        if not new_price_id:
            raise PlanChangeError(f"Price not configured for plan {new_plan_id}")
        
        try:
            # Create subscription schedule
            schedule = stripe.SubscriptionSchedule.create(
                from_subscription=subscription.stripe_subscription_id,
            )
            
            # Update schedule with new phase
            stripe.SubscriptionSchedule.modify(
                schedule.id,
                phases=[
                    {
                        "items": [{
                            "price": new_price_id,
                            "quantity": 1,
                        }],
                        "start_date": int(effective_date.timestamp()),
                    }
                ],
            )
            
            # Update database record
            subscription.schedule_id = schedule.id
            subscription.pending_plan_id = new_plan_id
            subscription.pending_billing_cycle = BillingCycleEnum(new_billing_cycle)
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="plan_change_scheduled",
                description=f"Plan change scheduled to {new_plan_id} on {effective_date.isoformat()}",
                new_values={
                    "scheduled_plan": new_plan_id,
                    "effective_date": effective_date.isoformat(),
                    "schedule_id": schedule.id,
                },
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(
                f"Plan change scheduled for subscription {subscription.id}: "
                f"to {new_plan_id} on {effective_date.isoformat()}"
            )
            
            return {
                "subscription_id": str(subscription.id),
                "schedule_id": schedule.id,
                "scheduled_plan": new_plan_id,
                "effective_date": effective_date.isoformat(),
                "status": "scheduled",
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error scheduling plan change: {str(e)}")
            raise PlanChangeError(f"Failed to schedule plan change: {str(e)}")
    
    def cancel_scheduled_change(self, user_id: UUID) -> Dict[str, Any]:
        """Cancel a scheduled plan change.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dictionary with cancellation result
        """
        subscription = self._get_active_subscription(user_id)
        
        if not subscription:
            raise PlanChangeError("No active subscription found")
        
        if not subscription.schedule_id:
            raise PlanChangeError("No scheduled change to cancel")
        
        try:
            # Cancel the schedule
            stripe.SubscriptionSchedule.cancel(subscription.schedule_id)
            
            # Update database record
            previous_schedule = subscription.schedule_id
            subscription.schedule_id = None
            subscription.pending_plan_id = None
            subscription.pending_billing_cycle = None
            
            # Log event
            event = SubscriptionEvent(
                subscription_id=subscription.id,
                event_type="scheduled_change_cancelled",
                description="Scheduled plan change cancelled",
                previous_values={"schedule_id": previous_schedule},
            )
            self.db.add(event)
            
            self.db.commit()
            
            logger.info(f"Scheduled change cancelled for subscription {subscription.id}")
            
            return {
                "subscription_id": str(subscription.id),
                "status": "cancelled",
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error cancelling scheduled change: {str(e)}")
            raise PlanChangeError(f"Failed to cancel scheduled change: {str(e)}")
    
    def get_proration_estimate(
        self,
        user_id: UUID,
        new_plan_id: str,
        new_billing_cycle: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get a quick proration estimate.
        
        Args:
            user_id: User UUID
            new_plan_id: New plan ID
            new_billing_cycle: Optional new billing cycle
            
        Returns:
            Dictionary with proration estimate
        """
        try:
            preview = self.preview_plan_change(user_id, new_plan_id, new_billing_cycle)
            
            return {
                "current_plan": preview["current_plan"],
                "new_plan": preview["new_plan"],
                "change_type": preview["change_type"],
                "estimated_cost": preview["proration"]["amount_due"],
                "currency": preview["proration"]["currency"],
                "period_end": preview["period"]["end"],
            }
            
        except PlanChangeError as e:
            return {
                "error": str(e),
                "can_change": False,
            }
    
    def _get_active_subscription(self, user_id: UUID) -> Optional[Subscription]:
        """Get active subscription for user."""
        customer = self.db.query(StripeCustomer).filter(
            StripeCustomer.user_id == user_id
        ).first()
        
        if not customer:
            return None
        
        return self.db.query(Subscription).filter(
            and_(
                Subscription.customer_id == customer.id,
                Subscription.status.in_([
                    SubscriptionStatusEnum.ACTIVE,
                    SubscriptionStatusEnum.TRIALING,
                ]),
            )
        ).first()
    
    def _get_subscription_item_id(self, subscription: Subscription) -> str:
        """Get the subscription item ID from Stripe."""
        try:
            stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
            if stripe_sub.items and stripe_sub.items.data:
                return stripe_sub.items.data[0].id
        except stripe.error.StripeError:
            pass
        
        # Fallback to stored metadata
        if subscription.metadata and "stripe_items" in subscription.metadata:
            items = subscription.metadata["stripe_items"]
            if items and len(items) > 0:
                return items[0].get("id", "")
        
        raise PlanChangeError("Could not retrieve subscription item ID")
    
    def _is_upgrade(self, current_plan_id: str, new_plan_id: str) -> bool:
        """Check if plan change is an upgrade."""
        try:
            current_index = self.PLAN_HIERARCHY.index(current_plan_id)
            new_index = self.PLAN_HIERARCHY.index(new_plan_id)
            return new_index > current_index
        except ValueError:
            return False
    
    def _is_downgrade(self, current_plan_id: str, new_plan_id: str) -> bool:
        """Check if plan change is a downgrade."""
        try:
            current_index = self.PLAN_HIERARCHY.index(current_plan_id)
            new_index = self.PLAN_HIERARCHY.index(new_plan_id)
            return new_index < current_index
        except ValueError:
            return False
    
    def _send_plan_change_email(
        self,
        customer: StripeCustomer,
        subscription: Subscription,
        old_plan: str,
        new_plan: str,
        is_upgrade: bool,
    ):
        """Send plan change notification email."""
        action = "upgraded" if is_upgrade else "downgraded"
        logger.info(
            f"Sending plan change email to {customer.email}: "
            f"{old_plan} -> {new_plan} ({action})"
        )
        # Implement email sending logic


# Convenience functions
def preview_plan_change(
    db: Session,
    user_id: UUID,
    new_plan_id: str,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to preview plan change.
    
    Args:
        db: Database session
        user_id: User UUID
        new_plan_id: New plan ID
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with proration preview
    """
    manager = ProrationManager(db)
    return manager.preview_plan_change(user_id, new_plan_id, **kwargs)


def change_plan(
    db: Session,
    user_id: UUID,
    new_plan_id: str,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to change plan.
    
    Args:
        db: Database session
        user_id: User UUID
        new_plan_id: New plan ID
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with change result
    """
    manager = ProrationManager(db)
    return manager.change_plan(user_id, new_plan_id, **kwargs)


def change_billing_cycle(
    db: Session,
    user_id: UUID,
    new_billing_cycle: str,
    **kwargs
) -> Dict[str, Any]:
    """Convenience function to change billing cycle.
    
    Args:
        db: Database session
        user_id: User UUID
        new_billing_cycle: New billing cycle
        **kwargs: Additional parameters
        
    Returns:
        Dictionary with change result
    """
    manager = ProrationManager(db)
    return manager.change_billing_cycle(user_id, new_billing_cycle, **kwargs)
