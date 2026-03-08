# MindMate AI Billing Module

Complete Stripe integration for subscription management in MindMate AI.

## Features

- **Subscription Creation Flow**: Checkout sessions for new subscriptions
- **Webhook Handler**: Comprehensive handling of all Stripe events
- **Subscription Status Enforcement**: Middleware for access control
- **Customer Portal**: Self-service subscription management
- **Trial Period Handling**: Trial start, extension, and conversion
- **Proration on Plan Changes**: Upgrade/downgrade with proper billing

## Installation

```bash
pip install stripe sqlalchemy pydantic fastapi
```

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
STRIPE_API_VERSION=2024-06-20
STRIPE_SUCCESS_URL=https://mindmate.ai/billing/success
STRIPE_CANCEL_URL=https://mindmate.ai/billing/cancel
STRIPE_PORTAL_RETURN_URL=https://mindmate.ai/settings/billing
STRIPE_TRIAL_DAYS=14
STRIPE_PRORATION_BEHAVIOR=create_prorations

# Plan Price IDs
STRIPE_STARTER_PRICE_MONTHLY=price_...
STRIPE_STARTER_PRICE_YEARLY=price_...
STRIPE_PROFESSIONAL_PRICE_MONTHLY=price_...
STRIPE_PROFESSIONAL_PRICE_YEARLY=price_...
STRIPE_ENTERPRISE_PRICE_MONTHLY=price_...
STRIPE_ENTERPRISE_PRICE_YEARLY=price_...
```

## Quick Start

### 1. Initialize the Module

```python
from api.billing import StripeConfig

# Load configuration from environment
config = StripeConfig.from_env()
```

### 2. Create a Checkout Session

```python
from api.billing import create_checkout_session
from sqlalchemy.orm import Session

async def subscribe_user(db: Session, user_id: UUID):
    result = create_checkout_session(
        db=db,
        user_id=user_id,
        plan_id="professional",
        billing_cycle="monthly",
    )
    return result["checkout_url"]
```

### 3. Setup Webhook Handler

```python
from api.billing import process_webhook
from fastapi import Request

@router.post("/webhook")
async def webhook(request: Request, db: Session):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    result = process_webhook(
        db=db,
        payload=payload,
        signature=signature,
    )
    return result
```

### 4. Add Middleware

```python
from api.billing import SubscriptionMiddleware

app.add_middleware(
    SubscriptionMiddleware,
    db_session_factory=get_db,
)
```

### 5. Protect Routes

```python
from api.billing import require_subscription, require_plan

@router.get("/therapy-session")
async def start_session(
    subscription = Depends(require_subscription()),
):
    # Only accessible with active subscription
    pass

@router.get("/advanced-feature")
async def advanced_feature(
    subscription = Depends(require_plan("professional")),
):
    # Only accessible with professional plan or higher
    pass
```

## API Endpoints

### Plans
- `GET /billing/plans` - List all plans
- `GET /billing/plans/compare` - Compare plans

### Checkout
- `POST /billing/checkout` - Create checkout session
- `GET /billing/checkout/success` - Success callback
- `GET /billing/checkout/cancel` - Cancel callback

### Subscription
- `GET /billing/subscription` - Get subscription details
- `GET /billing/subscription/check` - Check session availability
- `POST /billing/subscription/cancel` - Cancel subscription
- `POST /billing/subscription/reactivate` - Reactivate subscription

### Plan Changes
- `POST /billing/subscription/change/preview` - Preview plan change
- `POST /billing/subscription/change` - Change plan
- `POST /billing/subscription/billing-cycle` - Change billing cycle

### Trial
- `GET /billing/trial/status` - Get trial status
- `POST /billing/trial/start` - Start trial
- `POST /billing/trial/end-early` - End trial early

### Portal
- `POST /billing/portal` - Create portal session
- `GET /billing/portal` - Redirect to portal

### Invoices
- `GET /billing/invoices` - Get invoice history
- `GET /billing/invoices/upcoming` - Get upcoming invoice

### Payment Methods
- `GET /billing/payment-methods` - List payment methods
- `DELETE /billing/payment-methods/{id}` - Delete payment method

### Webhooks
- `POST /billing/webhook` - Stripe webhook endpoint

## Database Models

The module uses SQLAlchemy models for data persistence:

- `StripeCustomer` - Links app users to Stripe customers
- `Subscription` - Subscription records
- `PaymentMethod` - Stored payment methods
- `Invoice` - Invoice history
- `SubscriptionEvent` - Audit log for subscription events
- `CheckoutSession` - Checkout session records
- `UsageRecord` - Resource usage tracking

## Webhook Events Handled

### Subscription Events
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `customer.subscription.trial_will_end`

### Payment Events
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.paid`
- `invoice.finalized`

### Checkout Events
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

### Customer Events
- `customer.created`
- `customer.updated`
- `customer.deleted`

### Payment Method Events
- `payment_method.attached`
- `payment_method.detached`

## Subscription Plans

### Starter ($9.99/month)
- 5 therapy sessions per month
- Basic mood tracking
- Email support
- 30-day session history

### Professional ($29.99/month)
- Unlimited therapy sessions
- Advanced mood tracking & analytics
- Priority support
- Unlimited session history
- Custom therapy goals
- Progress reports

### Enterprise ($99.99/month)
- Everything in Professional
- Team management
- Admin dashboard
- SSO integration
- Dedicated account manager
- Custom AI training
- SLA guarantee
- API access

## Testing

### Test Cards

Use these Stripe test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Require 3D Secure**: `4000 0025 0000 3155`

### Test Webhooks Locally

```bash
stripe listen --forward-to localhost:8000/billing/webhook
```

## Error Handling

The module defines custom exceptions:

- `CheckoutError` - Checkout session creation failed
- `WebhookError` - Webhook processing failed
- `WebhookSignatureError` - Invalid webhook signature
- `PortalError` - Portal operation failed
- `TrialError` - Trial operation failed
- `PlanChangeError` - Plan change failed
- `SubscriptionRequiredError` - No active subscription
- `PlanUpgradeRequiredError` - Plan upgrade needed
- `UsageLimitExceededError` - Usage limit reached

## License

MIT License - MindMate AI
