"""
MindMate AI Billing Module
==========================
Complete Stripe integration for subscription management.

This module provides:
- Subscription creation flow (checkout sessions)
- Webhook handling for all Stripe events
- Subscription status enforcement middleware
- Customer portal integration
- Trial period handling
- Proration on plan changes

Usage:
    from api.billing import (
        create_checkout_session,
        process_webhook,
        get_subscription_details,
        cancel_subscription,
        start_trial,
        change_plan,
    )
"""

# Configuration
from .config import (
    StripeConfig,
    SUBSCRIPTION_PLANS,
    SubscriptionStatus,
    PaymentStatus,
    WEBHOOK_EVENTS,
    get_plan_by_id,
    get_plan_by_stripe_price_id,
    is_valid_plan,
    get_price_id_for_plan,
)

# Models
from .models import (
    Base,
    StripeCustomer,
    Subscription,
    PaymentMethod,
    Invoice,
    SubscriptionEvent,
    CheckoutSession,
    UsageRecord,
    SubscriptionStatusEnum,
    BillingCycleEnum,
    PaymentStatusEnum,
)

# Checkout and Subscription Creation
from .checkout import (
    CheckoutSessionManager,
    SubscriptionManager,
    create_checkout_session,
    create_subscription_direct,
    CheckoutError,
    SubscriptionCreationError,
)

# Webhook Handling
from .webhooks import (
    WebhookHandler,
    WebhookError,
    WebhookSignatureError,
    process_webhook,
)

# Middleware and Access Control
from .middleware import (
    SubscriptionEnforcer,
    SubscriptionMiddleware,
    SubscriptionRequiredError,
    PlanUpgradeRequiredError,
    UsageLimitExceededError,
    require_subscription,
    require_plan,
    check_session_limit,
    get_subscription_info,
    require_active_subscription,
    track_usage,
)

# Customer Portal
from .portal import (
    CustomerPortalManager,
    create_portal_session,
    get_subscription_details,
    cancel_subscription,
    reactivate_subscription,
    PortalError,
)

# Trial Management
from .trial import (
    TrialManager,
    start_trial,
    get_trial_status,
    end_trial_early,
    TrialError,
)

# Proration and Plan Changes
from .proration import (
    ProrationManager,
    preview_plan_change,
    change_plan,
    change_billing_cycle,
    PlanChangeError,
)

# Utilities
from .utils import (
    cents_to_dollars,
    dollars_to_cents,
    format_currency,
    get_plan_price,
    get_plan_display_price,
    calculate_annual_savings,
    compare_plans,
    get_period_dates,
    days_until_date,
    format_period,
    validate_promo_code,
    validate_coupon,
    get_feature_access,
    check_feature_access,
    verify_webhook_signature,
    create_subscription_response,
    create_error_response,
)


__version__ = "1.0.0"
__all__ = [
    # Configuration
    "StripeConfig",
    "SUBSCRIPTION_PLANS",
    "SubscriptionStatus",
    "PaymentStatus",
    "WEBHOOK_EVENTS",
    "get_plan_by_id",
    "get_plan_by_stripe_price_id",
    "is_valid_plan",
    "get_price_id_for_plan",
    
    # Models
    "Base",
    "StripeCustomer",
    "Subscription",
    "PaymentMethod",
    "Invoice",
    "SubscriptionEvent",
    "CheckoutSession",
    "UsageRecord",
    "SubscriptionStatusEnum",
    "BillingCycleEnum",
    "PaymentStatusEnum",
    
    # Checkout
    "CheckoutSessionManager",
    "SubscriptionManager",
    "create_checkout_session",
    "create_subscription_direct",
    "CheckoutError",
    "SubscriptionCreationError",
    
    # Webhooks
    "WebhookHandler",
    "WebhookError",
    "WebhookSignatureError",
    "process_webhook",
    
    # Middleware
    "SubscriptionEnforcer",
    "SubscriptionMiddleware",
    "SubscriptionRequiredError",
    "PlanUpgradeRequiredError",
    "UsageLimitExceededError",
    "require_subscription",
    "require_plan",
    "check_session_limit",
    "get_subscription_info",
    "require_active_subscription",
    "track_usage",
    
    # Portal
    "CustomerPortalManager",
    "create_portal_session",
    "get_subscription_details",
    "cancel_subscription",
    "reactivate_subscription",
    "PortalError",
    
    # Trial
    "TrialManager",
    "start_trial",
    "get_trial_status",
    "end_trial_early",
    "TrialError",
    
    # Proration
    "ProrationManager",
    "preview_plan_change",
    "change_plan",
    "change_billing_cycle",
    "PlanChangeError",
    
    # Utilities
    "cents_to_dollars",
    "dollars_to_cents",
    "format_currency",
    "get_plan_price",
    "get_plan_display_price",
    "calculate_annual_savings",
    "compare_plans",
    "get_period_dates",
    "days_until_date",
    "format_period",
    "validate_promo_code",
    "validate_coupon",
    "get_feature_access",
    "check_feature_access",
    "verify_webhook_signature",
    "create_subscription_response",
    "create_error_response",
]
