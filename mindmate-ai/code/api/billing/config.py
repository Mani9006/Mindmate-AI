"""
Stripe Configuration for MindMate AI
====================================
Centralized configuration for Stripe integration.
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class StripeConfig:
    """Stripe configuration settings."""
    
    # API Keys
    secret_key: str
    publishable_key: str
    webhook_secret: str
    
    # API Configuration
    api_version: str = "2024-06-20"
    
    # URLs
    success_url: str = "https://mindmate.ai/billing/success"
    cancel_url: str = "https://mindmate.ai/billing/cancel"
    portal_return_url: str = "https://mindmate.ai/settings/billing"
    
    # Trial Configuration
    trial_days: int = 14
    trial_period_days: int = 14
    
    # Proration Behavior
    proration_behavior: str = "create_prorations"
    
    # Collection Configuration
    payment_method_collection: str = "always"
    
    @classmethod
    def from_env(cls) -> "StripeConfig":
        """Load configuration from environment variables."""
        return cls(
            secret_key=os.getenv("STRIPE_SECRET_KEY", ""),
            publishable_key=os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
            webhook_secret=os.getenv("STRIPE_WEBHOOK_SECRET", ""),
            api_version=os.getenv("STRIPE_API_VERSION", "2024-06-20"),
            success_url=os.getenv("STRIPE_SUCCESS_URL", "https://mindmate.ai/billing/success"),
            cancel_url=os.getenv("STRIPE_CANCEL_URL", "https://mindmate.ai/billing/cancel"),
            portal_return_url=os.getenv("STRIPE_PORTAL_RETURN_URL", "https://mindmate.ai/settings/billing"),
            trial_days=int(os.getenv("STRIPE_TRIAL_DAYS", "14")),
            trial_period_days=int(os.getenv("STRIPE_TRIAL_PERIOD_DAYS", "14")),
            proration_behavior=os.getenv("STRIPE_PRORATION_BEHAVIOR", "create_prorations"),
            payment_method_collection=os.getenv("STRIPE_PAYMENT_METHOD_COLLECTION", "always"),
        )


# Subscription Plans Configuration
SUBSCRIPTION_PLANS = {
    "starter": {
        "id": "starter",
        "name": "Starter",
        "description": "Perfect for individuals getting started with AI therapy",
        "price_monthly": 999,  # $9.99 in cents
        "price_yearly": 9990,  # $99.90 in cents (17% discount)
        "features": [
            "5 therapy sessions per month",
            "Basic mood tracking",
            "Email support",
            "Session history (30 days)",
        ],
        "limits": {
            "sessions_per_month": 5,
            "storage_gb": 1,
            "support_level": "email",
        },
        "stripe_price_id_monthly": os.getenv("STRIPE_STARTER_PRICE_MONTHLY", ""),
        "stripe_price_id_yearly": os.getenv("STRIPE_STARTER_PRICE_YEARLY", ""),
    },
    "professional": {
        "id": "professional",
        "name": "Professional",
        "description": "For users seeking comprehensive mental health support",
        "price_monthly": 2999,  # $29.99 in cents
        "price_yearly": 29990,  # $299.90 in cents (17% discount)
        "features": [
            "Unlimited therapy sessions",
            "Advanced mood tracking & analytics",
            "Priority support",
            "Unlimited session history",
            "Custom therapy goals",
            "Progress reports",
        ],
        "limits": {
            "sessions_per_month": -1,  # Unlimited
            "storage_gb": 10,
            "support_level": "priority",
        },
        "stripe_price_id_monthly": os.getenv("STRIPE_PROFESSIONAL_PRICE_MONTHLY", ""),
        "stripe_price_id_yearly": os.getenv("STRIPE_PROFESSIONAL_PRICE_YEARLY", ""),
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "description": "For organizations and teams",
        "price_monthly": 9999,  # $99.99 in cents
        "price_yearly": 99990,  # $999.90 in cents (17% discount)
        "features": [
            "Everything in Professional",
            "Team management",
            "Admin dashboard",
            "SSO integration",
            "Dedicated account manager",
            "Custom AI training",
            "SLA guarantee",
            "API access",
        ],
        "limits": {
            "sessions_per_month": -1,  # Unlimited
            "storage_gb": 100,
            "support_level": "dedicated",
            "team_members": 10,
        },
        "stripe_price_id_monthly": os.getenv("STRIPE_ENTERPRISE_PRICE_MONTHLY", ""),
        "stripe_price_id_yearly": os.getenv("STRIPE_ENTERPRISE_PRICE_YEARLY", ""),
    },
}


# Subscription Status Constants
class SubscriptionStatus:
    """Stripe subscription status values."""
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    PAUSED = "paused"


# Payment Status Constants
class PaymentStatus:
    """Payment status values."""
    SUCCEEDED = "succeeded"
    PENDING = "pending"
    FAILED = "failed"
    CANCELED = "canceled"
    REQUIRES_ACTION = "requires_action"
    REQUIRES_CONFIRMATION = "requires_confirmation"


# Webhook Event Types
WEBHOOK_EVENTS = {
    # Subscription events
    "customer.subscription.created": "handle_subscription_created",
    "customer.subscription.updated": "handle_subscription_updated",
    "customer.subscription.deleted": "handle_subscription_deleted",
    "customer.subscription.paused": "handle_subscription_paused",
    "customer.subscription.resumed": "handle_subscription_resumed",
    "customer.subscription.trial_will_end": "handle_trial_will_end",
    
    # Payment events
    "invoice.payment_succeeded": "handle_invoice_payment_succeeded",
    "invoice.payment_failed": "handle_invoice_payment_failed",
    "invoice.paid": "handle_invoice_paid",
    "invoice.finalized": "handle_invoice_finalized",
    "invoice.upcoming": "handle_invoice_upcoming",
    
    # Checkout events
    "checkout.session.completed": "handle_checkout_session_completed",
    "checkout.session.async_payment_succeeded": "handle_checkout_async_payment_succeeded",
    "checkout.session.async_payment_failed": "handle_checkout_async_payment_failed",
    "checkout.session.expired": "handle_checkout_session_expired",
    
    # Customer events
    "customer.created": "handle_customer_created",
    "customer.updated": "handle_customer_updated",
    "customer.deleted": "handle_customer_deleted",
    
    # Payment method events
    "payment_method.attached": "handle_payment_method_attached",
    "payment_method.detached": "handle_payment_method_detached",
    
    # Charge events
    "charge.succeeded": "handle_charge_succeeded",
    "charge.failed": "handle_charge_failed",
    "charge.dispute.created": "handle_charge_dispute_created",
}


# Grace period configuration
GRACE_PERIOD_DAYS = 3

# Retry configuration for failed payments
PAYMENT_RETRY_DAYS = [3, 5, 7]  # Days after failed payment to retry

# Default currency
DEFAULT_CURRENCY = "usd"

# Tax configuration
TAX_CALCULATION_ENABLED = os.getenv("STRIPE_TAX_ENABLED", "false").lower() == "true"


def get_plan_by_id(plan_id: str) -> Optional[dict]:
    """Get subscription plan by ID."""
    return SUBSCRIPTION_PLANS.get(plan_id)


def get_plan_by_stripe_price_id(price_id: str) -> Optional[dict]:
    """Get subscription plan by Stripe price ID."""
    for plan in SUBSCRIPTION_PLANS.values():
        if plan["stripe_price_id_monthly"] == price_id or plan["stripe_price_id_yearly"] == price_id:
            return plan
    return None


def is_valid_plan(plan_id: str) -> bool:
    """Check if plan ID is valid."""
    return plan_id in SUBSCRIPTION_PLANS


def get_price_id_for_plan(plan_id: str, billing_cycle: str = "monthly") -> str:
    """Get Stripe price ID for a plan and billing cycle."""
    plan = get_plan_by_id(plan_id)
    if not plan:
        return ""
    
    if billing_cycle == "yearly":
        return plan.get("stripe_price_id_yearly", "")
    return plan.get("stripe_price_id_monthly", "")
