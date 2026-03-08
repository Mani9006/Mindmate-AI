"""
Billing Utilities and Helpers
=============================
Utility functions for billing operations.
"""

import stripe
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from decimal import Decimal
import logging

from .config import StripeConfig, SUBSCRIPTION_PLANS, get_plan_by_id


logger = logging.getLogger(__name__)


# ==================== Currency Utilities ====================

def cents_to_dollars(cents: int) -> Decimal:
    """Convert cents to dollars.
    
    Args:
        cents: Amount in cents
        
    Returns:
        Amount in dollars as Decimal
    """
    return Decimal(cents) / 100


def dollars_to_cents(dollars: float) -> int:
    """Convert dollars to cents.
    
    Args:
        dollars: Amount in dollars
        
    Returns:
        Amount in cents
    """
    return int(dollars * 100)


def format_currency(amount: int, currency: str = "usd") -> str:
    """Format amount as currency string.
    
    Args:
        amount: Amount in cents
        currency: Currency code
        
    Returns:
        Formatted currency string
    """
    dollars = cents_to_dollars(amount)
    
    currency_symbols = {
        "usd": "$",
        "eur": "€",
        "gbp": "£",
    }
    
    symbol = currency_symbols.get(currency.lower(), currency.upper())
    return f"{symbol}{dollars:.2f}"


# ==================== Plan Utilities ====================

def get_plan_price(plan_id: str, billing_cycle: str = "monthly") -> int:
    """Get plan price in cents.
    
    Args:
        plan_id: Plan ID
        billing_cycle: Billing cycle
        
    Returns:
        Price in cents
    """
    plan = get_plan_by_id(plan_id)
    if not plan:
        return 0
    
    if billing_cycle == "yearly":
        return plan.get("price_yearly", 0)
    return plan.get("price_monthly", 0)


def get_plan_display_price(plan_id: str, billing_cycle: str = "monthly") -> str:
    """Get formatted plan price for display.
    
    Args:
        plan_id: Plan ID
        billing_cycle: Billing cycle
        
    Returns:
        Formatted price string
    """
    price = get_plan_price(plan_id, billing_cycle)
    return format_currency(price)


def calculate_annual_savings(plan_id: str) -> Dict[str, Any]:
    """Calculate savings for annual billing.
    
    Args:
        plan_id: Plan ID
        
    Returns:
        Dictionary with savings information
    """
    plan = get_plan_by_id(plan_id)
    if not plan:
        return {}
    
    monthly_price = plan.get("price_monthly", 0)
    yearly_price = plan.get("price_yearly", 0)
    
    monthly_cost_annual = monthly_price * 12
    savings = monthly_cost_annual - yearly_price
    savings_percentage = (savings / monthly_cost_annual) * 100 if monthly_cost_annual > 0 else 0
    
    return {
        "monthly_price": monthly_price,
        "yearly_price": yearly_price,
        "monthly_cost_annual": monthly_cost_annual,
        "savings": savings,
        "savings_percentage": round(savings_percentage, 1),
        "savings_display": format_currency(savings),
    }


def compare_plans(plan_ids: List[str]) -> List[Dict[str, Any]]:
    """Compare multiple plans.
    
    Args:
        plan_ids: List of plan IDs to compare
        
    Returns:
        List of plan comparison data
    """
    comparison = []
    
    for plan_id in plan_ids:
        plan = get_plan_by_id(plan_id)
        if plan:
            comparison.append({
                "id": plan_id,
                "name": plan["name"],
                "description": plan["description"],
                "price_monthly": plan["price_monthly"],
                "price_monthly_display": format_currency(plan["price_monthly"]),
                "price_yearly": plan["price_yearly"],
                "price_yearly_display": format_currency(plan["price_yearly"]),
                "features": plan["features"],
                "limits": plan["limits"],
            })
    
    return comparison


# ==================== Date Utilities ====================

def get_period_dates(
    start_date: datetime,
    billing_cycle: str,
) -> Tuple[datetime, datetime]:
    """Calculate period start and end dates.
    
    Args:
        start_date: Period start date
        billing_cycle: Billing cycle
        
    Returns:
        Tuple of (period_start, period_end)
    """
    if billing_cycle == "yearly":
        period_end = start_date + timedelta(days=365)
    else:
        # Add one month (approximate)
        if start_date.month == 12:
            period_end = start_date.replace(year=start_date.year + 1, month=1)
        else:
            period_end = start_date.replace(month=start_date.month + 1)
    
    return start_date, period_end


def days_until_date(target_date: datetime) -> int:
    """Calculate days until target date.
    
    Args:
        target_date: Target date
        
    Returns:
        Days until target date (0 if in past)
    """
    now = datetime.utcnow()
    if target_date <= now:
        return 0
    
    delta = target_date - now
    return delta.days


def format_period(period_start: datetime, period_end: datetime) -> str:
    """Format billing period for display.
    
    Args:
        period_start: Period start date
        period_end: Period end date
        
    Returns:
        Formatted period string
    """
    return f"{period_start.strftime('%b %d, %Y')} - {period_end.strftime('%b %d, %Y')}"


# ==================== Validation Utilities ====================

def validate_promo_code(code: str) -> Dict[str, Any]:
    """Validate a promotion code.
    
    Args:
        code: Promotion code
        
    Returns:
        Dictionary with validation result
    """
    try:
        # Try to retrieve the promotion code from Stripe
        promo_codes = stripe.PromotionCode.list(code=code, active=True)
        
        if not promo_codes.data:
            return {
                "valid": False,
                "error": "Invalid or expired promotion code",
            }
        
        promo = promo_codes.data[0]
        coupon = promo.coupon
        
        return {
            "valid": True,
            "code": code,
            "promo_id": promo.id,
            "coupon_id": coupon.id,
            "discount": {
                "percent_off": coupon.percent_off,
                "amount_off": coupon.amount_off,
                "currency": coupon.currency,
            },
            "duration": coupon.duration,
            "duration_in_months": coupon.duration_in_months,
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error validating promo code: {str(e)}")
        return {
            "valid": False,
            "error": "Error validating promotion code",
        }


def validate_coupon(coupon_id: str) -> Dict[str, Any]:
    """Validate a coupon.
    
    Args:
        coupon_id: Coupon ID
        
    Returns:
        Dictionary with validation result
    """
    try:
        coupon = stripe.Coupon.retrieve(coupon_id)
        
        if not coupon.valid:
            return {
                "valid": False,
                "error": "Coupon is no longer valid",
            }
        
        return {
            "valid": True,
            "coupon_id": coupon.id,
            "discount": {
                "percent_off": coupon.percent_off,
                "amount_off": coupon.amount_off,
                "currency": coupon.currency,
            },
            "duration": coupon.duration,
            "duration_in_months": coupon.duration_in_months,
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error validating coupon: {str(e)}")
        return {
            "valid": False,
            "error": "Invalid coupon",
        }


# ==================== Invoice Utilities ====================

def format_invoice_line_item(line_item: Dict[str, Any]) -> str:
    """Format invoice line item for display.
    
    Args:
        line_item: Line item data
        
    Returns:
        Formatted line item string
    """
    description = line_item.get("description", "Item")
    amount = line_item.get("amount", 0)
    
    return f"{description}: {format_currency(int(amount * 100))}"


def calculate_proration_description(
    line_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Calculate proration description from line items.
    
    Args:
        line_items: List of invoice line items
        
    Returns:
        Dictionary with proration breakdown
    """
    unused_time = 0
    remaining_time = 0
    
    for item in line_items:
        description = item.get("description", "").lower()
        amount = item.get("amount", 0)
        
        if "unused" in description or "proration" in description:
            if amount < 0:
                unused_time += abs(amount)
            else:
                remaining_time += amount
    
    return {
        "unused_time_credit": unused_time,
        "remaining_time_charge": remaining_time,
        "net_proration": remaining_time - unused_time,
    }


# ==================== Feature Access Utilities ====================

def get_feature_access(plan_id: str, feature: str) -> Dict[str, Any]:
    """Get access level for a specific feature.
    
    Args:
        plan_id: Plan ID
        feature: Feature name
        
    Returns:
        Dictionary with feature access information
    """
    plan = get_plan_by_id(plan_id)
    
    if not plan:
        return {
            "has_access": False,
            "limit": 0,
        }
    
    limits = plan.get("limits", {})
    
    feature_map = {
        "sessions": "sessions_per_month",
        "storage": "storage_gb",
        "support": "support_level",
        "team_members": "team_members",
    }
    
    limit_key = feature_map.get(feature, feature)
    limit = limits.get(limit_key)
    
    return {
        "has_access": limit is not None and limit != 0,
        "limit": limit,
        "unlimited": limit == -1,
    }


def check_feature_access(plan_id: str, feature: str, usage: int = 0) -> bool:
    """Check if plan has access to feature within usage.
    
    Args:
        plan_id: Plan ID
        feature: Feature name
        usage: Current usage
        
    Returns:
        True if access is allowed
    """
    access = get_feature_access(plan_id, feature)
    
    if not access["has_access"]:
        return False
    
    if access["unlimited"]:
        return True
    
    return usage < access["limit"]


# ==================== Webhook Utilities ====================

def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
) -> stripe.Event:
    """Verify Stripe webhook signature.
    
    Args:
        payload: Raw request body
        signature: Stripe-Signature header
        secret: Webhook secret
        
    Returns:
        Verified Stripe event
        
    Raises:
        ValueError: If signature is invalid
    """
    return stripe.Webhook.construct_event(payload, signature, secret)


def parse_event_type(event: stripe.Event) -> Tuple[str, str]:
    """Parse event type into category and action.
    
    Args:
        event: Stripe event
        
    Returns:
        Tuple of (category, action)
    """
    parts = event.type.split(".")
    category = parts[0] if parts else "unknown"
    action = ".".join(parts[1:]) if len(parts) > 1 else "unknown"
    
    return category, action


# ==================== Logging Utilities ====================

def log_billing_event(
    event_type: str,
    user_id: Optional[str] = None,
    subscription_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """Log a billing event.
    
    Args:
        event_type: Type of billing event
        user_id: Optional user ID
        subscription_id: Optional subscription ID
        details: Optional event details
    """
    log_data = {
        "event_type": event_type,
        "user_id": user_id,
        "subscription_id": subscription_id,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    logger.info(f"Billing event: {log_data}")


def sanitize_stripe_object(obj: Any) -> Dict[str, Any]:
    """Sanitize Stripe object for logging.
    
    Args:
        obj: Stripe object
        
    Returns:
        Sanitized dictionary
    """
    if hasattr(obj, "to_dict"):
        return obj.to_dict()
    
    if isinstance(obj, dict):
        # Remove sensitive fields
        sensitive_fields = ["number", "cvc", "token", "password"]
        return {
            k: "***" if any(s in k.lower() for s in sensitive_fields) else v
            for k, v in obj.items()
        }
    
    return {"value": str(obj)}


# ==================== API Response Utilities ====================

def create_subscription_response(subscription: Any) -> Dict[str, Any]:
    """Create standardized subscription API response.
    
    Args:
        subscription: Subscription object
        
    Returns:
        Standardized response dictionary
    """
    return {
        "id": str(subscription.id) if hasattr(subscription, "id") else None,
        "status": subscription.status.value if hasattr(subscription, "status") else None,
        "plan_id": subscription.plan_id if hasattr(subscription, "plan_id") else None,
        "billing_cycle": subscription.billing_cycle.value if hasattr(subscription, "billing_cycle") else None,
        "current_period_start": subscription.current_period_start.isoformat() if hasattr(subscription, "current_period_start") and subscription.current_period_start else None,
        "current_period_end": subscription.current_period_end.isoformat() if hasattr(subscription, "current_period_end") and subscription.current_period_end else None,
        "is_active": subscription.is_active if hasattr(subscription, "is_active") else False,
        "is_trial": subscription.is_trial_active if hasattr(subscription, "is_trial_active") else False,
        "cancel_at_period_end": subscription.cancel_at_period_end if hasattr(subscription, "cancel_at_period_end") else False,
    }


def create_error_response(error: Exception, code: str = "billing_error") -> Dict[str, Any]:
    """Create standardized error response.
    
    Args:
        error: Exception
        code: Error code
        
    Returns:
        Standardized error response
    """
    return {
        "error": {
            "code": code,
            "message": str(error),
            "type": error.__class__.__name__,
        },
        "success": False,
    }


# ==================== Background Job Utilities ====================

def get_subscriptions_requiring_attention(db: Any) -> List[Dict[str, Any]]:
    """Get subscriptions that require attention.
    
    Args:
        db: Database session
        
    Returns:
        List of subscriptions requiring attention
    """
    from .models import Subscription, SubscriptionStatusEnum
    
    attention_needed = []
    
    # Past due subscriptions
    past_due = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatusEnum.PAST_DUE
    ).all()
    
    for sub in past_due:
        attention_needed.append({
            "subscription_id": str(sub.id),
            "user_id": str(sub.customer.user_id),
            "status": "past_due",
            "reason": "Payment failed",
            "action_required": "Update payment method",
        })
    
    # Trials ending soon
    from datetime import datetime, timedelta
    trial_threshold = datetime.utcnow() + timedelta(days=2)
    
    ending_trials = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatusEnum.TRIALING,
        Subscription.trial_end <= trial_threshold,
    ).all()
    
    for sub in ending_trials:
        attention_needed.append({
            "subscription_id": str(sub.id),
            "user_id": str(sub.customer.user_id),
            "status": "trial_ending",
            "reason": "Trial ending soon",
            "action_required": "Add payment method",
        })
    
    return attention_needed
