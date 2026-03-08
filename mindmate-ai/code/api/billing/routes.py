"""
FastAPI Routes for Billing
==========================
API endpoints for billing operations.
"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .config import StripeConfig, SUBSCRIPTION_PLANS
from .checkout import create_checkout_session, CheckoutError
from .webhooks import process_webhook, WebhookError, WebhookSignatureError
from .portal import (
    create_portal_session,
    get_subscription_details,
    cancel_subscription,
    reactivate_subscription,
    PortalError,
)
from .trial import start_trial, get_trial_status, end_trial_early, TrialError
from .proration import preview_plan_change, change_plan, change_billing_cycle, PlanChangeError
from .middleware import (
    require_subscription,
    check_session_limit,
    get_subscription_info,
    SubscriptionEnforcer,
)
from .utils import compare_plans, calculate_annual_savings, format_currency


# Router setup
router = APIRouter(prefix="/billing", tags=["billing"])

# Dependencies (these would be provided by your app)
def get_db():
    """Get database session."""
    # Implement based on your database setup
    pass


def get_current_user_id(request: Request) -> UUID:
    """Get current user ID from request."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return UUID(user_id)


# ==================== Pydantic Models ====================

class CheckoutSessionRequest(BaseModel):
    """Request model for creating checkout session."""
    plan_id: str = Field(..., description="Plan ID (starter, professional, enterprise)")
    billing_cycle: str = Field(default="monthly", description="Billing cycle (monthly/yearly)")
    success_url: Optional[str] = Field(None, description="Custom success URL")
    cancel_url: Optional[str] = Field(None, description="Custom cancel URL")
    coupon_code: Optional[str] = Field(None, description="Coupon code")


class PlanChangeRequest(BaseModel):
    """Request model for plan change."""
    plan_id: str = Field(..., description="New plan ID")
    billing_cycle: Optional[str] = Field(None, description="New billing cycle")
    proration_behavior: Optional[str] = Field(None, description="Proration behavior")


class CancelSubscriptionRequest(BaseModel):
    """Request model for canceling subscription."""
    at_period_end: bool = Field(default=True, description="Cancel at period end")
    reason: Optional[str] = Field(None, description="Cancellation reason")
    feedback: Optional[str] = Field(None, description="Additional feedback")


class TrialStartRequest(BaseModel):
    """Request model for starting trial."""
    plan_id: str = Field(..., description="Plan ID for trial")
    billing_cycle: str = Field(default="monthly", description="Billing cycle after trial")


# ==================== Plan Routes ====================

@router.get("/plans")
def list_plans():
    """List all available subscription plans."""
    plans = []
    
    for plan_id, plan in SUBSCRIPTION_PLANS.items():
        savings = calculate_annual_savings(plan_id)
        
        plans.append({
            "id": plan_id,
            "name": plan["name"],
            "description": plan["description"],
            "pricing": {
                "monthly": {
                    "amount": plan["price_monthly"],
                    "display": format_currency(plan["price_monthly"]),
                },
                "yearly": {
                    "amount": plan["price_yearly"],
                    "display": format_currency(plan["price_yearly"]),
                },
                "annual_savings": savings,
            },
            "features": plan["features"],
            "limits": plan["limits"],
        })
    
    return {"plans": plans}


@router.get("/plans/compare")
def compare_subscription_plans():
    """Compare all subscription plans."""
    plan_ids = list(SUBSCRIPTION_PLANS.keys())
    comparison = compare_plans(plan_ids)
    
    return {"comparison": comparison}


# ==================== Checkout Routes ====================

@router.post("/checkout")
def create_subscription_checkout(
    request: CheckoutSessionRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a checkout session for subscription."""
    try:
        result = create_checkout_session(
            db=db,
            user_id=user_id,
            plan_id=request.plan_id,
            billing_cycle=request.billing_cycle,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            coupon_code=request.coupon_code,
        )
        
        return {
            "success": True,
            "checkout_url": result["checkout_url"],
            "session_id": result["session_id"],
        }
        
    except CheckoutError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/checkout/success")
def checkout_success(
    session_id: Optional[str] = None,
):
    """Handle successful checkout."""
    return {
        "success": True,
        "message": "Subscription created successfully",
        "session_id": session_id,
    }


@router.get("/checkout/cancel")
def checkout_cancel(
    session_id: Optional[str] = None,
):
    """Handle canceled checkout."""
    return {
        "success": False,
        "message": "Checkout was canceled",
        "session_id": session_id,
    }


# ==================== Subscription Routes ====================

@router.get("/subscription")
def get_current_subscription(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get current user's subscription details."""
    details = get_subscription_details(db, user_id)
    return details


@router.get("/subscription/check")
def check_subscription_status(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Check if user can start a therapy session."""
    enforcer = SubscriptionEnforcer(db)
    result = enforcer.check_session_availability(user_id)
    
    if not result["can_start"]:
        raise HTTPException(status_code=403, detail=result["message"])
    
    return result


@router.post("/subscription/cancel")
def cancel_user_subscription(
    request: CancelSubscriptionRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Cancel user's subscription."""
    try:
        result = cancel_subscription(
            db=db,
            user_id=user_id,
            at_period_end=request.at_period_end,
            reason=request.reason,
            feedback=request.feedback,
        )
        
        return result
        
    except PortalError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscription/reactivate")
def reactivate_user_subscription(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Reactivate a subscription scheduled for cancellation."""
    try:
        result = reactivate_subscription(db, user_id)
        return result
        
    except PortalError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Plan Change Routes ====================

@router.post("/subscription/change/preview")
def preview_subscription_change(
    request: PlanChangeRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Preview a plan change with proration."""
    try:
        preview = preview_plan_change(
            db=db,
            user_id=user_id,
            new_plan_id=request.plan_id,
            new_billing_cycle=request.billing_cycle,
        )
        
        return preview
        
    except PlanChangeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscription/change")
def change_subscription_plan(
    request: PlanChangeRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Change subscription plan."""
    try:
        result = change_plan(
            db=db,
            user_id=user_id,
            new_plan_id=request.plan_id,
            new_billing_cycle=request.billing_cycle,
            proration_behavior=request.proration_behavior,
        )
        
        return result
        
    except PlanChangeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscription/billing-cycle")
def change_subscription_billing_cycle(
    billing_cycle: str,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Change subscription billing cycle."""
    try:
        result = change_billing_cycle(
            db=db,
            user_id=user_id,
            new_billing_cycle=billing_cycle,
        )
        
        return result
        
    except PlanChangeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Trial Routes ====================

@router.get("/trial/status")
def get_user_trial_status(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's trial status."""
    status = get_trial_status(db, user_id)
    return status


@router.post("/trial/start")
def start_user_trial(
    request: TrialStartRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Start a trial subscription."""
    try:
        result = start_trial(
            db=db,
            user_id=user_id,
            plan_id=request.plan_id,
            billing_cycle=request.billing_cycle,
        )
        
        return result
        
    except TrialError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/trial/end-early")
def end_trial_early_endpoint(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """End trial early and convert to paid subscription."""
    try:
        result = end_trial_early(
            db=db,
            user_id=user_id,
            charge_immediately=True,
        )
        
        return result
        
    except TrialError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Customer Portal Routes ====================

@router.post("/portal")
def create_customer_portal(
    return_url: Optional[str] = None,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create customer portal session."""
    try:
        result = create_portal_session(
            db=db,
            user_id=user_id,
            return_url=return_url,
        )
        
        return {
            "success": True,
            "portal_url": result["portal_url"],
            "session_id": result["session_id"],
        }
        
    except PortalError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/portal")
def redirect_to_customer_portal(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Redirect to customer portal."""
    try:
        result = create_portal_session(db, user_id)
        return RedirectResponse(url=result["portal_url"])
        
    except PortalError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Invoice Routes ====================

@router.get("/invoices")
def get_user_invoices(
    limit: int = 10,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's invoice history."""
    from .portal import SubscriptionManager
    
    manager = SubscriptionManager(db)
    invoices = manager.get_invoices(user_id, limit)
    
    return {"invoices": invoices}


@router.get("/invoices/upcoming")
def get_upcoming_invoice(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get upcoming invoice preview."""
    from .portal import SubscriptionManager
    
    manager = SubscriptionManager(db)
    invoice = manager.get_upcoming_invoice(user_id)
    
    if not invoice:
        return {"upcoming_invoice": None}
    
    return {"upcoming_invoice": invoice}


# ==================== Payment Method Routes ====================

@router.get("/payment-methods")
def get_user_payment_methods(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's payment methods."""
    from .portal import SubscriptionManager
    
    manager = SubscriptionManager(db)
    methods = manager.get_payment_methods(user_id)
    
    return {"payment_methods": methods}


@router.delete("/payment-methods/{payment_method_id}")
def delete_user_payment_method(
    payment_method_id: str,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a payment method."""
    from .portal import SubscriptionManager
    
    manager = SubscriptionManager(db)
    
    try:
        result = manager.delete_payment_method(user_id, payment_method_id)
        return result
        
    except PortalError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Webhook Routes ====================

@router.post("/webhook")
def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Handle Stripe webhook events."""
    # Get signature from header
    signature = request.headers.get("stripe-signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    # Read payload
    payload = request.body()
    
    try:
        result = process_webhook(
            db=db,
            payload=payload,
            signature=signature,
        )
        
        return result
        
    except WebhookSignatureError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except WebhookError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Admin Routes ====================

@router.get("/admin/trials-ending")
def get_trials_ending_soon(
    days: int = 3,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get trials ending soon (admin only)."""
    from .trial import TrialManager
    
    # TODO: Add admin check
    
    manager = TrialManager(db)
    trials = manager.get_trials_ending_soon(days)
    
    return {"trials": trials}


@router.post("/admin/process-expired-trials")
def process_expired_trials_endpoint(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Process all expired trials (admin only)."""
    from .trial import TrialManager
    
    # TODO: Add admin check
    
    manager = TrialManager(db)
    result = manager.process_expired_trials()
    
    return result


# ==================== Health Check ====================

@router.get("/health")
def billing_health_check():
    """Check billing system health."""
    config = StripeConfig.from_env()
    
    return {
        "status": "healthy",
        "stripe_configured": bool(config.secret_key),
        "webhook_configured": bool(config.webhook_secret),
    }
