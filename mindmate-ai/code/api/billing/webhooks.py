"""
Stripe Webhook Handler
======================
Handles all Stripe webhook events for subscriptions and billing.
"""

import stripe
import json
import hmac
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from uuid import UUID
import logging

from sqlalchemy.orm import Session

from .config import StripeConfig, WEBHOOK_EVENTS, GRACE_PERIOD_DAYS
from .models import (
    StripeCustomer, Subscription, PaymentMethod, Invoice, 
    SubscriptionEvent, CheckoutSession, UsageRecord,
    SubscriptionStatusEnum, BillingCycleEnum, PaymentStatusEnum
)


logger = logging.getLogger(__name__)


class WebhookError(Exception):
    """Custom exception for webhook errors."""
    pass


class WebhookSignatureError(Exception):
    """Custom exception for webhook signature verification errors."""
    pass


class WebhookHandler:
    """Handler for Stripe webhook events."""
    
    def __init__(self, db: Session, config: Optional[StripeConfig] = None):
        """Initialize the webhook handler.
        
        Args:
            db: SQLAlchemy database session
            config: Stripe configuration
        """
        self.db = db
        self.config = config or StripeConfig.from_env()
        stripe.api_key = self.config.secret_key
        stripe.api_version = self.config.api_version
        
        # Event handler mapping
        self.event_handlers = {
            # Subscription events
            "customer.subscription.created": self.handle_subscription_created,
            "customer.subscription.updated": self.handle_subscription_updated,
            "customer.subscription.deleted": self.handle_subscription_deleted,
            "customer.subscription.paused": self.handle_subscription_paused,
            "customer.subscription.resumed": self.handle_subscription_resumed,
            "customer.subscription.trial_will_end": self.handle_trial_will_end,
            
            # Payment events
            "invoice.payment_succeeded": self.handle_invoice_payment_succeeded,
            "invoice.payment_failed": self.handle_invoice_payment_failed,
            "invoice.paid": self.handle_invoice_paid,
            "invoice.finalized": self.handle_invoice_finalized,
            
            # Checkout events
            "checkout.session.completed": self.handle_checkout_session_completed,
            "checkout.session.async_payment_succeeded": self.handle_checkout_async_payment_succeeded,
            "checkout.session.async_payment_failed": self.handle_checkout_async_payment_failed,
            "checkout.session.expired": self.handle_checkout_session_expired,
            
            # Customer events
            "customer.created": self.handle_customer_created,
            "customer.updated": self.handle_customer_updated,
            "customer.deleted": self.handle_customer_deleted,
            
            # Payment method events
            "payment_method.attached": self.handle_payment_method_attached,
            "payment_method.detached": self.handle_payment_method_detached,
            
            # Charge events
            "charge.succeeded": self.handle_charge_succeeded,
            "charge.failed": self.handle_charge_failed,
        }
    
    def verify_signature(
        self, 
        payload: bytes, 
        signature: str, 
        secret: Optional[str] = None
    ) -> stripe.Event:
        """Verify Stripe webhook signature.
        
        Args:
            payload: Raw request body
            signature: Stripe-Signature header value
            secret: Webhook secret (uses config if not provided)
            
        Returns:
            Verified Stripe event object
            
        Raises:
            WebhookSignatureError: If signature verification fails
        """
        secret = secret or self.config.webhook_secret
        
        if not secret:
            raise WebhookSignatureError("Webhook secret not configured")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            raise WebhookSignatureError(f"Invalid payload: {str(e)}")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            raise WebhookSignatureError(f"Invalid signature: {str(e)}")
    
    def handle_event(self, event: stripe.Event) -> Dict[str, Any]:
        """Handle a Stripe webhook event.
        
        Args:
            event: Stripe event object
            
        Returns:
            Dictionary with handling result
        """
        event_type = event.type
        event_id = event.id
        
        logger.info(f"Processing webhook event: {event_type} (ID: {event_id})")
        
        # Get handler for event type
        handler = self.event_handlers.get(event_type)
        
        if not handler:
            logger.warning(f"No handler for event type: {event_type}")
            return {
                "status": "ignored",
                "event_type": event_type,
                "message": "No handler for this event type",
            }
        
        try:
            # Call the handler
            result = handler(event.data.object)
            
            logger.info(f"Successfully handled event: {event_type}")
            
            return {
                "status": "success",
                "event_type": event_type,
                "event_id": event_id,
                "result": result,
            }
            
        except Exception as e:
            logger.error(f"Error handling event {event_type}: {str(e)}")
            raise WebhookError(f"Failed to handle event: {str(e)}")
    
    # ==================== Subscription Event Handlers ====================
    
    def handle_subscription_created(self, subscription: stripe.Subscription) -> Dict[str, Any]:
        """Handle customer.subscription.created event.
        
        Args:
            subscription: Stripe subscription object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Subscription created: {subscription.id}")
        
        # Get customer
        customer = self._get_customer_by_stripe_id(subscription.customer)
        if not customer:
            logger.error(f"Customer not found for subscription {subscription.id}")
            return {"status": "error", "message": "Customer not found"}
        
        # Extract plan info from subscription items
        plan_id, billing_cycle = self._extract_plan_info(subscription)
        
        # Parse dates
        trial_start = None
        trial_end = None
        if subscription.trial_start:
            trial_start = datetime.fromtimestamp(subscription.trial_start)
        if subscription.trial_end:
            trial_end = datetime.fromtimestamp(subscription.trial_end)
        
        # Create subscription record
        sub_record = Subscription(
            customer_id=customer.id,
            stripe_subscription_id=subscription.id,
            plan_id=plan_id or "unknown",
            billing_cycle=BillingCycleEnum(billing_cycle) if billing_cycle else BillingCycleEnum.MONTHLY,
            status=SubscriptionStatusEnum(subscription.status),
            trial_start=trial_start,
            trial_end=trial_end,
            current_period_start=datetime.fromtimestamp(subscription.current_period_start),
            current_period_end=datetime.fromtimestamp(subscription.current_period_end),
            cancel_at_period_end=subscription.cancel_at_period_end,
            default_payment_method_id=subscription.default_payment_method,
            metadata={
                "stripe_items": [
                    {"id": item.id, "price": item.price.id if item.price else None}
                    for item in subscription.items.data
                ]
            },
        )
        
        self.db.add(sub_record)
        
        # Log event
        self._log_subscription_event(
            subscription=sub_record,
            event_type="subscription_created",
            stripe_event_id=subscription.id,
            description=f"Subscription created with plan {plan_id}",
        )
        
        self.db.commit()
        
        # Send welcome email for trial
        if subscription.status == "trialing":
            self._send_trial_started_email(customer, sub_record)
        
        return {"subscription_id": str(sub_record.id), "plan_id": plan_id}
    
    def handle_subscription_updated(self, subscription: stripe.Subscription) -> Dict[str, Any]:
        """Handle customer.subscription.updated event.
        
        Args:
            subscription: Stripe subscription object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Subscription updated: {subscription.id}")
        
        # Get existing subscription
        sub_record = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if not sub_record:
            logger.warning(f"Subscription not found for update: {subscription.id}")
            # Create it if it doesn't exist
            return self.handle_subscription_created(subscription)
        
        # Store previous values for audit
        previous_values = {
            "status": sub_record.status.value,
            "plan_id": sub_record.plan_id,
            "cancel_at_period_end": sub_record.cancel_at_period_end,
        }
        
        # Extract plan info
        plan_id, billing_cycle = self._extract_plan_info(subscription)
        
        # Update subscription
        if plan_id:
            sub_record.plan_id = plan_id
        if billing_cycle:
            sub_record.billing_cycle = BillingCycleEnum(billing_cycle)
        
        sub_record.status = SubscriptionStatusEnum(subscription.status)
        sub_record.cancel_at_period_end = subscription.cancel_at_period_end
        sub_record.current_period_start = datetime.fromtimestamp(subscription.current_period_start)
        sub_record.current_period_end = datetime.fromtimestamp(subscription.current_period_end)
        sub_record.default_payment_method_id = subscription.default_payment_method
        
        # Handle cancellation
        if subscription.canceled_at and not sub_record.canceled_at:
            sub_record.canceled_at = datetime.fromtimestamp(subscription.canceled_at)
            
        # Handle trial end
        if subscription.trial_end:
            sub_record.trial_end = datetime.fromtimestamp(subscription.trial_end)
        
        # Log event
        new_values = {
            "status": sub_record.status.value,
            "plan_id": sub_record.plan_id,
            "cancel_at_period_end": sub_record.cancel_at_period_end,
        }
        
        self._log_subscription_event(
            subscription=sub_record,
            event_type="subscription_updated",
            stripe_event_id=subscription.id,
            previous_values=previous_values,
            new_values=new_values,
            description=f"Subscription updated: {previous_values['status']} -> {new_values['status']}",
        )
        
        self.db.commit()
        
        # Handle status change notifications
        if previous_values["status"] != new_values["status"]:
            self._handle_status_change(sub_record, previous_values["status"], new_values["status"])
        
        return {"subscription_id": str(sub_record.id), "status": sub_record.status.value}
    
    def handle_subscription_deleted(self, subscription: stripe.Subscription) -> Dict[str, Any]:
        """Handle customer.subscription.deleted event.
        
        Args:
            subscription: Stripe subscription object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Subscription deleted: {subscription.id}")
        
        # Get subscription
        sub_record = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if not sub_record:
            logger.warning(f"Subscription not found for deletion: {subscription.id}")
            return {"status": "warning", "message": "Subscription not found"}
        
        # Store previous status
        previous_status = sub_record.status.value
        
        # Update subscription
        sub_record.status = SubscriptionStatusEnum.CANCELED
        sub_record.ended_at = datetime.utcnow()
        sub_record.cancel_at_period_end = True
        
        # Log event
        self._log_subscription_event(
            subscription=sub_record,
            event_type="subscription_deleted",
            stripe_event_id=subscription.id,
            previous_values={"status": previous_status},
            new_values={"status": "canceled"},
            description="Subscription canceled/deleted",
        )
        
        self.db.commit()
        
        # Send cancellation email
        self._send_subscription_canceled_email(sub_record.customer, sub_record)
        
        return {"subscription_id": str(sub_record.id)}
    
    def handle_subscription_paused(self, subscription: stripe.Subscription) -> Dict[str, Any]:
        """Handle customer.subscription.paused event.
        
        Args:
            subscription: Stripe subscription object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Subscription paused: {subscription.id}")
        
        sub_record = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if sub_record:
            previous_status = sub_record.status.value
            sub_record.status = SubscriptionStatusEnum.PAUSED
            
            self._log_subscription_event(
                subscription=sub_record,
                event_type="subscription_paused",
                previous_values={"status": previous_status},
                new_values={"status": "paused"},
            )
            
            self.db.commit()
        
        return {"subscription_id": str(sub_record.id) if sub_record else None}
    
    def handle_subscription_resumed(self, subscription: stripe.Subscription) -> Dict[str, Any]:
        """Handle customer.subscription.resumed event.
        
        Args:
            subscription: Stripe subscription object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Subscription resumed: {subscription.id}")
        
        sub_record = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if sub_record:
            previous_status = sub_record.status.value
            sub_record.status = SubscriptionStatusEnum(subscription.status)
            
            self._log_subscription_event(
                subscription=sub_record,
                event_type="subscription_resumed",
                previous_values={"status": previous_status},
                new_values={"status": subscription.status},
            )
            
            self.db.commit()
        
        return {"subscription_id": str(sub_record.id) if sub_record else None}
    
    def handle_trial_will_end(self, subscription: stripe.Subscription) -> Dict[str, Any]:
        """Handle customer.subscription.trial_will_end event.
        
        Sent 3 days before trial ends.
        
        Args:
            subscription: Stripe subscription object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Trial ending soon for subscription: {subscription.id}")
        
        sub_record = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if sub_record:
            # Send trial ending reminder email
            self._send_trial_ending_email(sub_record.customer, sub_record)
            
            self._log_subscription_event(
                subscription=sub_record,
                event_type="trial_will_end",
                description="Trial period ending in 3 days",
            )
            
            self.db.commit()
        
        return {"subscription_id": str(sub_record.id) if sub_record else None}
    
    # ==================== Payment Event Handlers ====================
    
    def handle_invoice_payment_succeeded(self, invoice: stripe.Invoice) -> Dict[str, Any]:
        """Handle invoice.payment_succeeded event.
        
        Args:
            invoice: Stripe invoice object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Invoice payment succeeded: {invoice.id}")
        
        # Update or create invoice record
        self._sync_invoice(invoice, PaymentStatusEnum.SUCCEEDED)
        
        # Update subscription if applicable
        if invoice.subscription:
            sub_record = self.db.query(Subscription).filter(
                Subscription.stripe_subscription_id == invoice.subscription
            ).first()
            
            if sub_record:
                # Reset session usage for new period
                sub_record.sessions_used_this_period = 0
                
                self._log_subscription_event(
                    subscription=sub_record,
                    event_type="payment_succeeded",
                    description=f"Payment succeeded for invoice {invoice.id}",
                )
                
                self.db.commit()
        
        return {"invoice_id": invoice.id}
    
    def handle_invoice_payment_failed(self, invoice: stripe.Invoice) -> Dict[str, Any]:
        """Handle invoice.payment_failed event.
        
        Args:
            invoice: Stripe invoice object
            
        Returns:
            Dictionary with handling result
        """
        logger.warning(f"Invoice payment failed: {invoice.id}")
        
        # Update invoice record
        self._sync_invoice(invoice, PaymentStatusEnum.FAILED)
        
        # Update subscription status
        if invoice.subscription:
            sub_record = self.db.query(Subscription).filter(
                Subscription.stripe_subscription_id == invoice.subscription
            ).first()
            
            if sub_record:
                # Mark as past_due (Stripe will handle the actual status change)
                self._log_subscription_event(
                    subscription=sub_record,
                    event_type="payment_failed",
                    description=f"Payment failed for invoice {invoice.id}",
                )
                
                self.db.commit()
                
                # Send payment failed email
                self._send_payment_failed_email(sub_record.customer, sub_record, invoice)
        
        return {"invoice_id": invoice.id}
    
    def handle_invoice_paid(self, invoice: stripe.Invoice) -> Dict[str, Any]:
        """Handle invoice.paid event.
        
        Args:
            invoice: Stripe invoice object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Invoice paid: {invoice.id}")
        
        self._sync_invoice(invoice, PaymentStatusEnum.SUCCEEDED)
        
        return {"invoice_id": invoice.id}
    
    def handle_invoice_finalized(self, invoice: stripe.Invoice) -> Dict[str, Any]:
        """Handle invoice.finalized event.
        
        Args:
            invoice: Stripe invoice object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Invoice finalized: {invoice.id}")
        
        self._sync_invoice(invoice)
        
        return {"invoice_id": invoice.id}
    
    # ==================== Checkout Event Handlers ====================
    
    def handle_checkout_session_completed(self, session: stripe.checkout.Session) -> Dict[str, Any]:
        """Handle checkout.session.completed event.
        
        Args:
            session: Stripe checkout session object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Checkout session completed: {session.id}")
        
        # Update checkout session record
        checkout_record = self.db.query(CheckoutSession).filter(
            CheckoutSession.stripe_session_id == session.id
        ).first()
        
        if checkout_record:
            checkout_record.status = "completed"
            checkout_record.completed_at = datetime.utcnow()
            
            # Update customer if subscription was created
            if session.subscription:
                checkout_record.metadata["stripe_subscription_id"] = session.subscription
            
            self.db.commit()
        
        # If this was a subscription checkout, the subscription webhook will handle it
        # But we can send a welcome email here
        if session.customer and session.subscription:
            customer = self._get_customer_by_stripe_id(session.customer)
            if customer:
                self._send_welcome_email(customer)
        
        return {"session_id": session.id}
    
    def handle_checkout_async_payment_succeeded(self, session: stripe.checkout.Session) -> Dict[str, Any]:
        """Handle checkout.session.async_payment_succeeded event.
        
        Args:
            session: Stripe checkout session object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Async payment succeeded for checkout: {session.id}")
        return {"session_id": session.id, "status": "async_payment_succeeded"}
    
    def handle_checkout_async_payment_failed(self, session: stripe.checkout.Session) -> Dict[str, Any]:
        """Handle checkout.session.async_payment_failed event.
        
        Args:
            session: Stripe checkout session object
            
        Returns:
            Dictionary with handling result
        """
        logger.warning(f"Async payment failed for checkout: {session.id}")
        
        # Update checkout session record
        checkout_record = self.db.query(CheckoutSession).filter(
            CheckoutSession.stripe_session_id == session.id
        ).first()
        
        if checkout_record:
            checkout_record.status = "payment_failed"
            self.db.commit()
        
        return {"session_id": session.id, "status": "async_payment_failed"}
    
    def handle_checkout_session_expired(self, session: stripe.checkout.Session) -> Dict[str, Any]:
        """Handle checkout.session.expired event.
        
        Args:
            session: Stripe checkout session object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Checkout session expired: {session.id}")
        
        # Update checkout session record
        checkout_record = self.db.query(CheckoutSession).filter(
            CheckoutSession.stripe_session_id == session.id
        ).first()
        
        if checkout_record:
            checkout_record.status = "expired"
            self.db.commit()
        
        return {"session_id": session.id}
    
    # ==================== Customer Event Handlers ====================
    
    def handle_customer_created(self, customer: stripe.Customer) -> Dict[str, Any]:
        """Handle customer.created event.
        
        Args:
            customer: Stripe customer object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Customer created: {customer.id}")
        
        # Customer is typically created through our API, but handle webhook just in case
        existing = self.db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer.id
        ).first()
        
        if not existing:
            # Extract user_id from metadata if available
            user_id = None
            if customer.metadata and "user_id" in customer.metadata:
                try:
                    user_id = UUID(customer.metadata["user_id"])
                except ValueError:
                    pass
            
            if user_id:
                new_customer = StripeCustomer(
                    user_id=user_id,
                    stripe_customer_id=customer.id,
                    email=customer.email,
                    name=customer.name,
                    phone=customer.phone,
                )
                self.db.add(new_customer)
                self.db.commit()
        
        return {"customer_id": customer.id}
    
    def handle_customer_updated(self, customer: stripe.Customer) -> Dict[str, Any]:
        """Handle customer.updated event.
        
        Args:
            customer: Stripe customer object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Customer updated: {customer.id}")
        
        existing = self.db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer.id
        ).first()
        
        if existing:
            existing.email = customer.email
            existing.name = customer.name
            existing.phone = customer.phone
            existing.default_payment_method_id = customer.invoice_settings.default_payment_method if customer.invoice_settings else None
            
            # Update address if available
            if customer.address:
                existing.address_line1 = customer.address.line1
                existing.address_line2 = customer.address.line2
                existing.address_city = customer.address.city
                existing.address_state = customer.address.state
                existing.address_postal_code = customer.address.postal_code
                existing.address_country = customer.address.country
            
            self.db.commit()
        
        return {"customer_id": customer.id}
    
    def handle_customer_deleted(self, customer: stripe.Customer) -> Dict[str, Any]:
        """Handle customer.deleted event.
        
        Args:
            customer: Stripe customer object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Customer deleted: {customer.id}")
        
        existing = self.db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == customer.id
        ).first()
        
        if existing:
            # Note: We might want to keep the record for audit purposes
            # and just mark it as deleted
            self.db.delete(existing)
            self.db.commit()
        
        return {"customer_id": customer.id}
    
    # ==================== Payment Method Event Handlers ====================
    
    def handle_payment_method_attached(self, payment_method: stripe.PaymentMethod) -> Dict[str, Any]:
        """Handle payment_method.attached event.
        
        Args:
            payment_method: Stripe payment method object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Payment method attached: {payment_method.id}")
        
        customer = self._get_customer_by_stripe_id(payment_method.customer)
        
        if customer:
            # Check if already exists
            existing = self.db.query(PaymentMethod).filter(
                PaymentMethod.stripe_payment_method_id == payment_method.id
            ).first()
            
            if not existing:
                pm_record = PaymentMethod(
                    customer_id=customer.id,
                    stripe_payment_method_id=payment_method.id,
                    type=payment_method.type,
                    card_brand=payment_method.card.brand if payment_method.card else None,
                    card_last4=payment_method.card.last4 if payment_method.card else None,
                    card_exp_month=payment_method.card.exp_month if payment_method.card else None,
                    card_exp_year=payment_method.card.exp_year if payment_method.card else None,
                    billing_email=payment_method.billing_details.email if payment_method.billing_details else None,
                    billing_name=payment_method.billing_details.name if payment_method.billing_details else None,
                    billing_phone=payment_method.billing_details.phone if payment_method.billing_details else None,
                )
                self.db.add(pm_record)
                self.db.commit()
        
        return {"payment_method_id": payment_method.id}
    
    def handle_payment_method_detached(self, payment_method: stripe.PaymentMethod) -> Dict[str, Any]:
        """Handle payment_method.detached event.
        
        Args:
            payment_method: Stripe payment method object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Payment method detached: {payment_method.id}")
        
        existing = self.db.query(PaymentMethod).filter(
            PaymentMethod.stripe_payment_method_id == payment_method.id
        ).first()
        
        if existing:
            self.db.delete(existing)
            self.db.commit()
        
        return {"payment_method_id": payment_method.id}
    
    # ==================== Charge Event Handlers ====================
    
    def handle_charge_succeeded(self, charge: stripe.Charge) -> Dict[str, Any]:
        """Handle charge.succeeded event.
        
        Args:
            charge: Stripe charge object
            
        Returns:
            Dictionary with handling result
        """
        logger.info(f"Charge succeeded: {charge.id}")
        return {"charge_id": charge.id, "amount": charge.amount}
    
    def handle_charge_failed(self, charge: stripe.Charge) -> Dict[str, Any]:
        """Handle charge.failed event.
        
        Args:
            charge: Stripe charge object
            
        Returns:
            Dictionary with handling result
        """
        logger.warning(f"Charge failed: {charge.id}, reason: {charge.failure_message}")
        return {"charge_id": charge.id, "failure_message": charge.failure_message}
    
    # ==================== Helper Methods ====================
    
    def _get_customer_by_stripe_id(self, stripe_customer_id: str) -> Optional[StripeCustomer]:
        """Get customer by Stripe customer ID."""
        return self.db.query(StripeCustomer).filter(
            StripeCustomer.stripe_customer_id == stripe_customer_id
        ).first()
    
    def _extract_plan_info(self, subscription: stripe.Subscription) -> tuple:
        """Extract plan ID and billing cycle from subscription."""
        from .config import get_plan_by_stripe_price_id
        
        plan_id = None
        billing_cycle = None
        
        if subscription.items and subscription.items.data:
            for item in subscription.items.data:
                if item.price:
                    plan = get_plan_by_stripe_price_id(item.price.id)
                    if plan:
                        plan_id = plan["id"]
                        # Determine billing cycle from price
                        if item.price.recurring:
                            interval = item.price.recurring.interval
                            billing_cycle = "yearly" if interval == "year" else "monthly"
                        break
        
        return plan_id, billing_cycle
    
    def _sync_invoice(
        self, 
        invoice: stripe.Invoice, 
        status: Optional[PaymentStatusEnum] = None
    ) -> Invoice:
        """Sync invoice with database."""
        
        existing = self.db.query(Invoice).filter(
            Invoice.stripe_invoice_id == invoice.id
        ).first()
        
        # Get customer
        customer = self._get_customer_by_stripe_id(invoice.customer) if invoice.customer else None
        
        # Get subscription
        subscription = None
        if invoice.subscription:
            subscription = self.db.query(Subscription).filter(
                Subscription.stripe_subscription_id == invoice.subscription
            ).first()
        
        # Parse dates
        due_date = None
        if invoice.due_date:
            due_date = datetime.fromtimestamp(invoice.due_date)
        
        paid_at = None
        if invoice.status_transitions and invoice.status_transitions.paid_at:
            paid_at = datetime.fromtimestamp(invoice.status_transitions.paid_at)
        
        # Determine status
        if status:
            payment_status = status
        else:
            status_map = {
                "draft": PaymentStatusEnum.PENDING,
                "open": PaymentStatusEnum.PENDING,
                "paid": PaymentStatusEnum.SUCCEEDED,
                "uncollectible": PaymentStatusEnum.FAILED,
                "void": PaymentStatusEnum.CANCELED,
            }
            payment_status = status_map.get(invoice.status, PaymentStatusEnum.PENDING)
        
        # Build line items
        line_items = []
        if invoice.lines and invoice.lines.data:
            for line in invoice.lines.data:
                line_items.append({
                    "description": line.description,
                    "amount": line.amount,
                    "currency": line.currency,
                    "period_start": line.period.start if line.period else None,
                    "period_end": line.period.end if line.period else None,
                    "plan_id": line.plan.id if line.plan else None,
                    "price_id": line.price.id if line.price else None,
                })
        
        if existing:
            existing.amount_due = invoice.amount_due / 100  # Convert cents to dollars
            existing.amount_paid = invoice.amount_paid / 100
            existing.amount_remaining = invoice.amount_remaining / 100
            existing.status = payment_status
            existing.due_date = due_date
            existing.paid_at = paid_at
            existing.invoice_pdf = invoice.invoice_pdf
            existing.hosted_invoice_url = invoice.hosted_invoice_url
            existing.line_items = line_items
        else:
            existing = Invoice(
                customer_id=customer.id if customer else None,
                subscription_id=subscription.id if subscription else None,
                stripe_invoice_id=invoice.id,
                number=invoice.number,
                description=invoice.description,
                amount_due=invoice.amount_due / 100,
                amount_paid=invoice.amount_paid / 100,
                amount_remaining=invoice.amount_remaining / 100,
                currency=invoice.currency,
                status=payment_status,
                due_date=due_date,
                paid_at=paid_at,
                invoice_pdf=invoice.invoice_pdf,
                hosted_invoice_url=invoice.hosted_invoice_url,
                line_items=line_items,
            )
            self.db.add(existing)
        
        self.db.commit()
        return existing
    
    def _log_subscription_event(
        self,
        subscription: Subscription,
        event_type: str,
        stripe_event_id: Optional[str] = None,
        previous_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        description: Optional[str] = None,
    ) -> SubscriptionEvent:
        """Log a subscription event."""
        event = SubscriptionEvent(
            subscription_id=subscription.id,
            event_type=event_type,
            stripe_event_id=stripe_event_id,
            previous_values=previous_values or {},
            new_values=new_values or {},
            description=description,
        )
        self.db.add(event)
        return event
    
    def _handle_status_change(
        self, 
        subscription: Subscription, 
        old_status: str, 
        new_status: str
    ):
        """Handle subscription status change notifications."""
        
        if new_status == "active" and old_status == "trialing":
            # Trial converted to paid
            self._send_trial_converted_email(subscription.customer, subscription)
        elif new_status == "past_due":
            # Payment is past due
            self._send_past_due_email(subscription.customer, subscription)
        elif new_status == "unpaid":
            # Subscription is unpaid
            self._send_subscription_unpaid_email(subscription.customer, subscription)
    
    # ==================== Email Notification Methods ====================
    
    def _send_welcome_email(self, customer: StripeCustomer):
        """Send welcome email to new subscriber."""
        # Implement email sending logic
        logger.info(f"Sending welcome email to {customer.email}")
    
    def _send_trial_started_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send trial started email."""
        logger.info(f"Sending trial started email to {customer.email}")
    
    def _send_trial_ending_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send trial ending reminder email."""
        logger.info(f"Sending trial ending email to {customer.email}")
    
    def _send_trial_converted_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send trial converted to paid email."""
        logger.info(f"Sending trial converted email to {customer.email}")
    
    def _send_payment_failed_email(
        self, 
        customer: StripeCustomer, 
        subscription: Subscription,
        invoice: stripe.Invoice
    ):
        """Send payment failed email."""
        logger.info(f"Sending payment failed email to {customer.email}")
    
    def _send_past_due_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send past due notification email."""
        logger.info(f"Sending past due email to {customer.email}")
    
    def _send_subscription_unpaid_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send subscription unpaid email."""
        logger.info(f"Sending subscription unpaid email to {customer.email}")
    
    def _send_subscription_canceled_email(self, customer: StripeCustomer, subscription: Subscription):
        """Send subscription canceled email."""
        logger.info(f"Sending subscription canceled email to {customer.email}")


# Convenience function for webhook endpoint
def process_webhook(
    db: Session,
    payload: bytes,
    signature: str,
    config: Optional[StripeConfig] = None
) -> Dict[str, Any]:
    """Process a Stripe webhook.
    
    Args:
        db: Database session
        payload: Raw request body
        signature: Stripe-Signature header
        config: Optional Stripe configuration
        
    Returns:
        Dictionary with processing result
    """
    handler = WebhookHandler(db, config)
    
    # Verify signature
    event = handler.verify_signature(payload, signature)
    
    # Handle event
    return handler.handle_event(event)
