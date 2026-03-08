"""
Database Models for Stripe Billing
==================================
SQLAlchemy models for subscription and billing data.
"""

from datetime import datetime, timedelta
from enum import Enum as PyEnum
from typing import Optional, List
import uuid

from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, ForeignKey, 
    Text, Numeric, Enum, Index, JSON, event
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func


Base = declarative_base()


class SubscriptionStatusEnum(str, PyEnum):
    """Subscription status enumeration."""
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    PAUSED = "paused"


class BillingCycleEnum(str, PyEnum):
    """Billing cycle enumeration."""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PaymentStatusEnum(str, PyEnum):
    """Payment status enumeration."""
    SUCCEEDED = "succeeded"
    PENDING = "pending"
    FAILED = "failed"
    CANCELED = "canceled"


class StripeCustomer(Base):
    """Stripe customer record linked to application user."""
    
    __tablename__ = "stripe_customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), 
                     unique=True, nullable=False, index=True)
    stripe_customer_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Customer details
    email = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Default payment method
    default_payment_method_id = Column(String(255), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    address_city = Column(String(100), nullable=True)
    address_state = Column(String(100), nullable=True)
    address_postal_code = Column(String(20), nullable=True)
    address_country = Column(String(2), nullable=True)
    
    # Metadata
    metadata = Column(JSONB, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="customer", 
                                  cascade="all, delete-orphan")
    payment_methods = relationship("PaymentMethod", back_populates="customer",
                                   cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="customer",
                            cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<StripeCustomer(user_id={self.user_id}, stripe_id={self.stripe_customer_id})>"


class Subscription(Base):
    """Stripe subscription record."""
    
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("stripe_customers.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Plan details
    plan_id = Column(String(50), nullable=False, index=True)
    billing_cycle = Column(Enum(BillingCycleEnum), nullable=False)
    
    # Status
    status = Column(Enum(SubscriptionStatusEnum), nullable=False, index=True)
    
    # Trial information
    trial_start = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    trial_ended_early = Column(Boolean, default=False)
    
    # Current period
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Cancellation
    cancel_at_period_end = Column(Boolean, default=False)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Schedule changes
    schedule_id = Column(String(255), nullable=True)
    pending_plan_id = Column(String(50), nullable=True)
    pending_billing_cycle = Column(Enum(BillingCycleEnum), nullable=True)
    
    # Payment
    latest_invoice_id = Column(String(255), nullable=True)
    default_payment_method_id = Column(String(255), nullable=True)
    
    # Usage tracking
    sessions_used_this_period = Column(Integer, default=0)
    storage_used_mb = Column(Integer, default=0)
    
    # Metadata
    metadata = Column(JSONB, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    customer = relationship("StripeCustomer", back_populates="subscriptions")
    invoices = relationship("Invoice", back_populates="subscription")
    events = relationship("SubscriptionEvent", back_populates="subscription",
                          cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_subscriptions_status_plan', 'status', 'plan_id'),
        Index('ix_subscriptions_customer_status', 'customer_id', 'status'),
    )
    
    def __repr__(self):
        return f"<Subscription(stripe_id={self.stripe_subscription_id}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if subscription is active."""
        return self.status in [
            SubscriptionStatusEnum.TRIALING,
            SubscriptionStatusEnum.ACTIVE
        ]
    
    @property
    def is_trial_active(self) -> bool:
        """Check if trial is currently active."""
        if self.status != SubscriptionStatusEnum.TRIALING:
            return False
        if self.trial_end and self.trial_end > datetime.utcnow():
            return True
        return False
    
    @property
    def days_until_trial_ends(self) -> Optional[int]:
        """Get days until trial ends."""
        if not self.trial_end:
            return None
        delta = self.trial_end - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def is_past_due(self) -> bool:
        """Check if subscription is past due."""
        return self.status == SubscriptionStatusEnum.PAST_DUE
    
    @property
    def is_canceled(self) -> bool:
        """Check if subscription is canceled."""
        return self.status == SubscriptionStatusEnum.CANCELED
    
    @property
    def will_cancel_at_period_end(self) -> bool:
        """Check if subscription will cancel at period end."""
        return self.cancel_at_period_end
    
    @property
    def has_payment_failed(self) -> bool:
        """Check if latest payment failed."""
        return self.status in [
            SubscriptionStatusEnum.PAST_DUE,
            SubscriptionStatusEnum.UNPAID
        ]
    
    def get_sessions_remaining(self) -> int:
        """Get remaining sessions for current period."""
        from .config import get_plan_by_id
        
        plan = get_plan_by_id(self.plan_id)
        if not plan:
            return 0
        
        limit = plan["limits"]["sessions_per_month"]
        if limit == -1:  # Unlimited
            return -1
        
        return max(0, limit - self.sessions_used_this_period)
    
    def can_use_session(self) -> bool:
        """Check if user can use a therapy session."""
        if not self.is_active:
            return False
        
        remaining = self.get_sessions_remaining()
        return remaining == -1 or remaining > 0
    
    def increment_session_usage(self) -> bool:
        """Increment session usage counter."""
        if not self.can_use_session():
            return False
        
        self.sessions_used_this_period += 1
        return True


class PaymentMethod(Base):
    """Stored payment method for customer."""
    
    __tablename__ = "payment_methods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("stripe_customers.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    stripe_payment_method_id = Column(String(255), unique=True, nullable=False)
    
    # Payment method details
    type = Column(String(50), nullable=False)
    card_brand = Column(String(50), nullable=True)
    card_last4 = Column(String(4), nullable=True)
    card_exp_month = Column(Integer, nullable=True)
    card_exp_year = Column(Integer, nullable=True)
    
    # Billing details
    billing_email = Column(String(255), nullable=True)
    billing_name = Column(String(255), nullable=True)
    billing_phone = Column(String(50), nullable=True)
    
    # Status
    is_default = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    customer = relationship("StripeCustomer", back_populates="payment_methods")
    
    def __repr__(self):
        return f"<PaymentMethod(type={self.type}, last4={self.card_last4})>"
    
    @property
    def display_label(self) -> str:
        """Get display label for payment method."""
        if self.type == "card" and self.card_brand:
            return f"{self.card_brand.title()} ending in {self.card_last4}"
        return self.type


class Invoice(Base):
    """Stripe invoice record."""
    
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("stripe_customers.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="SET NULL"),
                             nullable=True, index=True)
    stripe_invoice_id = Column(String(255), unique=True, nullable=False)
    
    # Invoice details
    number = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    # Amounts
    amount_due = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), default=0)
    amount_remaining = Column(Numeric(10, 2), default=0)
    currency = Column(String(3), default="usd")
    
    # Status
    status = Column(Enum(PaymentStatusEnum), nullable=False)
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # PDF and hosted invoice
    invoice_pdf = Column(Text, nullable=True)
    hosted_invoice_url = Column(Text, nullable=True)
    
    # Line items (stored as JSON)
    line_items = Column(JSONB, default=list)
    
    # Metadata
    metadata = Column(JSONB, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("StripeCustomer", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")
    
    def __repr__(self):
        return f"<Invoice(number={self.number}, amount={self.amount_due})>"


class SubscriptionEvent(Base):
    """Audit log for subscription events."""
    
    __tablename__ = "subscription_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"),
                             nullable=False, index=True)
    
    # Event details
    event_type = Column(String(100), nullable=False, index=True)
    stripe_event_id = Column(String(255), nullable=True)
    
    # Data
    previous_values = Column(JSONB, default=dict)
    new_values = Column(JSONB, default=dict)
    
    # Description
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subscription = relationship("Subscription", back_populates="events")
    
    def __repr__(self):
        return f"<SubscriptionEvent(type={self.event_type})>"


class CheckoutSession(Base):
    """Stripe checkout session record."""
    
    __tablename__ = "checkout_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("stripe_customers.id", ondelete="CASCADE"),
                         nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    stripe_session_id = Column(String(255), unique=True, nullable=False)
    
    # Session details
    mode = Column(String(50), default="subscription")
    plan_id = Column(String(50), nullable=False)
    billing_cycle = Column(Enum(BillingCycleEnum), nullable=False)
    
    # URLs
    success_url = Column(Text, nullable=False)
    cancel_url = Column(Text, nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default="pending")
    
    # Trial
    trial_enabled = Column(Boolean, default=True)
    
    # Metadata
    metadata = Column(JSONB, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<CheckoutSession(stripe_id={self.stripe_session_id}, status={self.status})>"


class UsageRecord(Base):
    """Track resource usage for subscriptions."""
    
    __tablename__ = "usage_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"),
                             nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    
    # Usage details
    resource_type = Column(String(50), nullable=False, index=True)  # session, storage, api_call
    quantity = Column(Integer, nullable=False, default=1)
    
    # Context
    session_id = Column(UUID(as_uuid=True), nullable=True)  # Link to therapy session if applicable
    metadata = Column(JSONB, default=dict)
    
    # Timestamps
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Indexes
    __table_args__ = (
        Index('ix_usage_records_subscription_type', 'subscription_id', 'resource_type'),
        Index('ix_usage_records_user_period', 'user_id', 'recorded_at'),
    )
    
    def __repr__(self):
        return f"<UsageRecord(type={self.resource_type}, quantity={self.quantity})>"


# Event listeners for automatic timestamp updates
@event.listens_for(Subscription, 'before_update')
def subscription_before_update(mapper, connection, target):
    """Update timestamp before subscription update."""
    target.updated_at = datetime.utcnow()


@event.listens_for(StripeCustomer, 'before_update')
def customer_before_update(mapper, connection, target):
    """Update timestamp before customer update."""
    target.updated_at = datetime.utcnow()
