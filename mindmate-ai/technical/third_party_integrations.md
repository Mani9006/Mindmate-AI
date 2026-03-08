# MindMate AI - Third-Party Integrations Architecture

## Overview

This document provides comprehensive technical specifications for all third-party integrations in the MindMate AI platform. Each integration includes API details, authentication methods, webhook configurations, error handling, and security considerations.

---

## Table of Contents

1. [Stripe - Subscription Billing & Webhooks](#1-stripe---subscription-billing--webhooks)
2. [Twilio - SMS & Voice Check-ins](#2-twilio---sms--voice-check-ins)
3. [Firebase - Push Notifications](#3-firebase---push-notifications)
4. [SendGrid - Transactional Email](#4-sendgrid---transactional-email)
5. [Calendly-Style Booking - Human Therapist Escalation](#5-calendly-style-booking---human-therapist-escalation)
6. [Apple Health / Google Fit - Sleep & Activity Data](#6-apple-health--google-fit---sleep--activity-data)
7. [Wearable Integration - Heart Rate Stress Detection](#7-wearable-integration---heart-rate-stress-detection)

---

## 1. Stripe - Subscription Billing & Webhooks

### 1.1 Overview

Stripe handles all subscription billing, payment processing, and revenue management for MindMate AI.

### 1.2 Environment Configuration

```typescript
// config/stripe.config.ts
export const stripeConfig = {
  // API Keys
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // API Version
  apiVersion: '2024-06-20',
  
  // Retry Configuration
  maxNetworkRetries: 3,
  timeout: 30000, // 30 seconds
  
  // Webhook Configuration
  webhookPath: '/api/v1/webhooks/stripe',
  
  // Currency
  defaultCurrency: 'usd',
  
  // Tax Settings
  automaticTax: true,
  
  // URLs
  successUrl: `${process.env.FRONTEND_URL}/payment/success`,
  cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
};
```

### 1.3 Subscription Plans Schema

```typescript
// types/subscription.types.ts
export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  FAMILY = 'family',
}

export interface SubscriptionPlan {
  id: string;
  stripePriceId: string;
  stripeProductId: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
}

export interface PlanLimits {
  aiSessionsPerMonth: number;
  journalEntriesPerDay: number;
  moodCheckinsPerDay: number;
  humanTherapySessionsPerMonth: number;
  storageGB: number;
  familyMembers: number;
  advancedInsights: boolean;
  wearableIntegration: boolean;
}

// Subscription Plans Definition
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    stripePriceId: '', // No Stripe price for free
    stripeProductId: '',
    tier: SubscriptionTier.FREE,
    name: 'Free',
    description: 'Basic mental wellness support',
    price: 0,
    interval: 'month',
    features: [
      '3 AI therapy sessions per month',
      'Basic mood tracking',
      'Daily journal (1 entry/day)',
      'Community access',
    ],
    limits: {
      aiSessionsPerMonth: 3,
      journalEntriesPerDay: 1,
      moodCheckinsPerDay: 3,
      humanTherapySessionsPerMonth: 0,
      storageGB: 0.5,
      familyMembers: 0,
      advancedInsights: false,
      wearableIntegration: false,
    },
    isActive: true,
  },
  {
    id: 'basic_monthly',
    stripePriceId: 'price_basic_monthly_xxx',
    stripeProductId: 'prod_basic_xxx',
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    description: 'Enhanced support for personal growth',
    price: 14.99,
    interval: 'month',
    features: [
      'Unlimited AI therapy sessions',
      'Advanced mood tracking & insights',
      'Unlimited journal entries',
      'Guided meditations',
      'Progress reports',
      'Email support',
    ],
    limits: {
      aiSessionsPerMonth: -1, // Unlimited
      journalEntriesPerDay: -1,
      moodCheckinsPerDay: -1,
      humanTherapySessionsPerMonth: 1,
      storageGB: 5,
      familyMembers: 0,
      advancedInsights: true,
      wearableIntegration: true,
    },
    isActive: true,
  },
  {
    id: 'premium_monthly',
    stripePriceId: 'price_premium_monthly_xxx',
    stripeProductId: 'prod_premium_xxx',
    tier: SubscriptionTier.PREMIUM,
    name: 'Premium',
    description: 'Comprehensive mental health care',
    price: 29.99,
    interval: 'month',
    features: [
      'Everything in Basic',
      '4 human therapy sessions/month',
      'Crisis support 24/7',
      'Family member tracking (2 members)',
      'Wearable device integration',
      'Priority support',
      'Personalized wellness plans',
    ],
    limits: {
      aiSessionsPerMonth: -1,
      journalEntriesPerDay: -1,
      moodCheckinsPerDay: -1,
      humanTherapySessionsPerMonth: 4,
      storageGB: 25,
      familyMembers: 2,
      advancedInsights: true,
      wearableIntegration: true,
    },
    isActive: true,
  },
  {
    id: 'family_monthly',
    stripePriceId: 'price_family_monthly_xxx',
    stripeProductId: 'prod_family_xxx',
    tier: SubscriptionTier.FAMILY,
    name: 'Family',
    description: 'Mental wellness for the whole family',
    price: 49.99,
    interval: 'month',
    features: [
      'Everything in Premium',
      'Up to 6 family members',
      'Family therapy sessions',
      'Parental controls & monitoring',
      'Teen-specific resources',
      'Shared wellness goals',
      'Dedicated family coordinator',
    ],
    limits: {
      aiSessionsPerMonth: -1,
      journalEntriesPerDay: -1,
      moodCheckinsPerDay: -1,
      humanTherapySessionsPerMonth: 8,
      storageGB: 100,
      familyMembers: 6,
      advancedInsights: true,
      wearableIntegration: true,
    },
    isActive: true,
  },
];
```

### 1.4 Stripe Service Implementation

```typescript
// services/stripe/stripe.service.ts
import Stripe from 'stripe';
import { stripeConfig } from '../../config/stripe.config';
import { SubscriptionPlan, SubscriptionTier } from '../../types/subscription.types';

export class StripeService {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(stripeConfig.secretKey!, {
      apiVersion: stripeConfig.apiVersion as Stripe.LatestApiVersion,
      maxNetworkRetries: stripeConfig.maxNetworkRetries,
      timeout: stripeConfig.timeout,
    });
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(
    userId: string,
    email: string,
    name?: string
  ): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
        platform: 'mindmate-ai',
      },
    });
    
    return customer;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
    trialDays: number = 7
  ): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId,
        },
      },
      success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: stripeConfig.cancelUrl,
      metadata: {
        userId,
        priceId,
      },
    });
    
    return session;
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(
    customerId: string
  ): Promise<Stripe.BillingPortal.Session> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/account/subscription`,
    });
    
    return session;
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );
    
    return subscription;
  }

  /**
   * Reactivate subscription before period end
   */
  async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
      }
    );
    
    return subscription;
  }

  /**
   * Update subscription to new plan
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );
    
    return updatedSubscription;
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * List customer invoices
   */
  async listInvoices(
    customerId: string,
    limit: number = 10
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    return await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });
  }

  /**
   * Process refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    });
    
    return refund;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret!
    );
  }
}

export const stripeService = new StripeService();
```

### 1.5 Webhook Handler

```typescript
// services/stripe/webhook.handler.ts
import Stripe from 'stripe';
import { stripeService } from './stripe.service';
import { userRepository } from '../../repositories/user.repository';
import { subscriptionRepository } from '../../repositories/subscription.repository';
import { notificationService } from '../notification/notification.service';
import { analyticsService } from '../analytics/analytics.service';

export class StripeWebhookHandler {
  /**
   * Process incoming Stripe webhook
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe webhook: ${event.type}`);
    
    switch (event.type) {
      // Checkout Events
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'checkout.session.expired':
        await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      // Subscription Events
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      // Payment Events
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.finalized':
        await this.handleInvoiceFinalized(event.data.object as Stripe.Invoice);
        break;

      // Payment Intent Events
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // Customer Events
      case 'customer.updated':
        await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;
        
      case 'customer.deleted':
        await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      throw new Error('No userId in session metadata');
    }

    // Update user with Stripe customer ID
    await userRepository.updateStripeCustomerId(userId, session.customer as string);

    // Track analytics
    analyticsService.track('Subscription Checkout Completed', {
      userId,
      sessionId: session.id,
      amount: session.amount_total,
    });
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const priceId = subscription.items.data[0]?.price.id;
    
    await subscriptionRepository.create({
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000) 
        : null,
    });

    // Send welcome notification
    await notificationService.send(userId, {
      type: 'subscription_activated',
      title: 'Welcome to MindMate Premium!',
      body: 'Your subscription is now active. Enjoy unlimited access to AI therapy sessions.',
    });

    analyticsService.track('Subscription Created', {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const dbSubscription = await subscriptionRepository.findByStripeId(subscription.id);
    if (!dbSubscription) return;

    const previousStatus = dbSubscription.status;
    
    await subscriptionRepository.update(subscription.id, {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000) 
        : null,
    });

    // Handle status changes
    if (previousStatus !== subscription.status) {
      if (subscription.status === 'active' && previousStatus === 'trialing') {
        await notificationService.send(dbSubscription.userId, {
          type: 'trial_ended',
          title: 'Trial Ended',
          body: 'Your trial has ended and your subscription is now active.',
        });
      }
    }

    analyticsService.track('Subscription Updated', {
      userId: dbSubscription.userId,
      subscriptionId: subscription.id,
      previousStatus,
      newStatus: subscription.status,
    });
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const dbSubscription = await subscriptionRepository.findByStripeId(subscription.id);
    if (!dbSubscription) return;

    await subscriptionRepository.update(subscription.id, {
      status: 'canceled',
      canceledAt: new Date(),
    });

    // Downgrade user to free plan
    await userRepository.updateSubscriptionTier(dbSubscription.userId, 'free');

    await notificationService.send(dbSubscription.userId, {
      type: 'subscription_canceled',
      title: 'Subscription Canceled',
      body: 'Your subscription has been canceled. You can resubscribe anytime to regain access.',
    });

    analyticsService.track('Subscription Canceled', {
      userId: dbSubscription.userId,
      subscriptionId: subscription.id,
    });
  }

  /**
   * Handle trial ending notification
   */
  private async handleTrialWillEnd(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const dbSubscription = await subscriptionRepository.findByStripeId(subscription.id);
    if (!dbSubscription) return;

    await notificationService.send(dbSubscription.userId, {
      type: 'trial_ending',
      title: 'Trial Ending Soon',
      body: 'Your free trial ends in 3 days. Update your payment method to continue uninterrupted access.',
      data: {
        action: 'update_payment',
      },
    });
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    const dbSubscription = await subscriptionRepository.findByStripeCustomerId(
      invoice.customer as string
    );
    if (!dbSubscription) return;

    // Store invoice record
    await subscriptionRepository.createInvoice({
      subscriptionId: dbSubscription.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    });

    analyticsService.track('Invoice Payment Succeeded', {
      userId: dbSubscription.userId,
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
    });
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<void> {
    const dbSubscription = await subscriptionRepository.findByStripeCustomerId(
      invoice.customer as string
    );
    if (!dbSubscription) return;

    await notificationService.send(dbSubscription.userId, {
      type: 'payment_failed',
      title: 'Payment Failed',
      body: 'We couldn\'t process your payment. Please update your payment method to avoid service interruption.',
      data: {
        action: 'update_payment',
        invoiceId: invoice.id,
      },
    });

    analyticsService.track('Invoice Payment Failed', {
      userId: dbSubscription.userId,
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
    });
  }

  /**
   * Handle payment intent succeeded
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    analyticsService.track('Payment Succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
    });
  }

  /**
   * Handle payment intent failed
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    analyticsService.track('Payment Failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });
  }

  // Additional handlers...
  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    analyticsService.track('Checkout Expired', {
      sessionId: session.id,
      userId: session.metadata?.userId,
    });
  }

  private async handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<void> {
    // Invoice finalized logic
  }

  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    // Update local customer record if needed
  }

  private async handleCustomerDeleted(customer: Stripe.Customer): Promise<void> {
    // Clean up local records
  }
}

export const stripeWebhookHandler = new StripeWebhookHandler();
```

### 1.6 Webhook Route Handler

```typescript
// routes/webhooks/stripe.routes.ts
import { Router, Request, Response } from 'express';
import { stripeService } from '../../services/stripe/stripe.service';
import { stripeWebhookHandler } from '../../services/stripe/webhook.handler';

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(
      req.body,
      signature
    );

    // Process webhook asynchronously
    await stripeWebhookHandler.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ 
      error: 'Webhook signature verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

### 1.7 Required Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# Test Keys (for development)
STRIPE_SECRET_KEY_TEST=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 1.8 Security Considerations

| Consideration | Implementation |
|--------------|----------------|
| Webhook Signature | Always verify using `stripe.webhooks.constructEvent()` |
| API Keys | Store in environment variables, never commit to repo |
| HTTPS Only | All webhook endpoints must use HTTPS in production |
| Idempotency | Use Stripe's idempotency keys for payment operations |
| PCI Compliance | Never store raw card numbers; use Stripe Elements |
| Rate Limiting | Implement rate limiting on checkout endpoints |

---

## 2. Twilio - SMS & Voice Check-ins

### 2.1 Overview

Twilio provides SMS and voice call capabilities for proactive mental health check-ins, appointment reminders, and crisis support notifications.

### 2.2 Environment Configuration

```typescript
// config/twilio.config.ts
export const twilioConfig = {
  // Account Credentials
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  
  // Phone Numbers
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,       // SMS
  voiceNumber: process.env.TWILIO_VOICE_NUMBER,       // Voice calls
  whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER, // WhatsApp
  
  // API Configuration
  apiVersion: '2010-04-01',
  region: 'us1',
  
  // Webhook Configuration
  webhookBaseUrl: process.env.TWILIO_WEBHOOK_BASE_URL,
  
  // Messaging Service
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  
  // Rate Limits
  maxMessagesPerSecond: 10,
  maxCallsPerSecond: 5,
  
  // Retry Configuration
  maxRetries: 3,
  retryDelayMs: 1000,
  
  // Voice Settings
  voice: {
    defaultLanguage: 'en-US',
    defaultVoice: 'Polly.Joanna',
    gatherTimeout: 5,
    maxDigits: 1,
  },
};
```

### 2.3 Twilio Service Implementation

```typescript
// services/twilio/twilio.service.ts
import twilio from 'twilio';
import { twilioConfig } from '../../config/twilio.config';
import { RateLimiter } from '../../utils/rate-limiter';

export interface SMSMessage {
  to: string;
  body: string;
  mediaUrl?: string[];
  scheduleTime?: Date;
}

export interface VoiceCall {
  to: string;
  url: string;           // TwiML URL
  statusCallback?: string;
  fallbackUrl?: string;
}

export interface CheckInMessage {
  userId: string;
  phoneNumber: string;
  checkInType: 'daily' | 'weekly' | 'crisis' | 'appointment' | 'medication';
  message: string;
  allowResponse: boolean;
}

export class TwilioService {
  private client: twilio.Twilio;
  private smsRateLimiter: RateLimiter;
  private callRateLimiter: RateLimiter;
  
  constructor() {
    this.client = twilio(
      twilioConfig.accountSid,
      twilioConfig.authToken
    );
    
    this.smsRateLimiter = new RateLimiter({
      maxRequests: twilioConfig.maxMessagesPerSecond,
      windowMs: 1000,
    });
    
    this.callRateLimiter = new RateLimiter({
      maxRequests: twilioConfig.maxCallsPerSecond,
      windowMs: 1000,
    });
  }

  /**
   * Send SMS message
   */
  async sendSMS(message: SMSMessage): Promise<twilio.MessageInstance> {
    await this.smsRateLimiter.acquire();
    
    try {
      const msg = await this.client.messages.create({
        to: message.to,
        from: twilioConfig.phoneNumber,
        body: message.body,
        mediaUrl: message.mediaUrl,
        messagingServiceSid: twilioConfig.messagingServiceSid,
        scheduleType: message.scheduleTime ? 'fixed' : undefined,
        sendAt: message.scheduleTime,
      });
      
      console.log(`SMS sent: ${msg.sid}`);
      return msg;
    } catch (error) {
      console.error('SMS send failed:', error);
      throw error;
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(
    messages: SMSMessage[],
    batchSize: number = 100
  ): Promise<twilio.MessageInstance[]> {
    const results: twilio.MessageInstance[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(msg => this.sendSMS(msg));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to send SMS to ${batch[index].to}:`, result.reason);
        }
      });
    }
    
    return results;
  }

  /**
   * Make voice call
   */
  async makeCall(call: VoiceCall): Promise<twilio.CallInstance> {
    await this.callRateLimiter.acquire();
    
    try {
      const voiceCall = await this.client.calls.create({
        to: call.to,
        from: twilioConfig.voiceNumber,
        url: call.url,
        statusCallback: call.statusCallback,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        fallbackUrl: call.fallbackUrl,
      });
      
      console.log(`Call initiated: ${voiceCall.sid}`);
      return voiceCall;
    } catch (error) {
      console.error('Voice call failed:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(
    to: string,
    body: string,
    mediaUrl?: string
  ): Promise<twilio.MessageInstance> {
    await this.smsRateLimiter.acquire();
    
    const msg = await this.client.messages.create({
      to: `whatsapp:${to}`,
      from: `whatsapp:${twilioConfig.whatsappNumber}`,
      body,
      mediaUrl,
    });
    
    return msg;
  }

  /**
   * Send daily check-in SMS
   */
  async sendDailyCheckIn(
    phoneNumber: string,
    userName: string,
    moodQuestion: string
  ): Promise<twilio.MessageInstance> {
    const message = {
      to: phoneNumber,
      body: `Hi ${userName}! ${moodQuestion}\n\nReply with:\n1 - Great 😊\n2 - Good 🙂\n3 - Okay 😐\n4 - Not great 😔\n5 - Need support 🆘`,
    };
    
    return this.sendSMS(message);
  }

  /**
   * Send crisis alert
   */
  async sendCrisisAlert(
    phoneNumber: string,
    userName: string
  ): Promise<twilio.MessageInstance> {
    const message = {
      to: phoneNumber,
      body: `${userName}, we noticed you might be going through a difficult time. Help is available 24/7:\n\nCrisis Text Line: Text HOME to 741741\nNational Suicide Prevention: 988\n\nReply HELP to connect with a counselor now.`,
    };
    
    return this.sendSMS(message);
  }

  /**
   * Make wellness check-in call
   */
  async makeWellnessCheckInCall(
    phoneNumber: string,
    userName: string
  ): Promise<twilio.CallInstance> {
    const twimlUrl = `${twilioConfig.webhookBaseUrl}/twilio/twiml/checkin?` + 
      new URLSearchParams({ name: userName }).toString();
    
    return this.makeCall({
      to: phoneNumber,
      url: twimlUrl,
      statusCallback: `${twilioConfig.webhookBaseUrl}/twilio/callbacks/call-status`,
    });
  }

  /**
   * Verify phone number
   */
  async verifyPhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v2
        .phoneNumbers(phoneNumber)
        .fetch();
      
      return lookup.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(
    messageSid: string
  ): Promise<twilio.MessageInstance> {
    return await this.client.messages(messageSid).fetch();
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid: string): Promise<twilio.CallInstance> {
    return await this.client.calls(callSid).fetch();
  }

  /**
   * Cancel scheduled message
   */
  async cancelScheduledMessage(
    messageSid: string
  ): Promise<twilio.MessageInstance> {
    return await this.client.messages(messageSid).update({
      status: 'canceled',
    });
  }
}

export const twilioService = new TwilioService();
```

### 2.4 TwiML Generators

```typescript
// services/twilio/twiml.generator.ts
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export class TwiMLGenerator {
  /**
   * Generate wellness check-in call TwiML
   */
  generateCheckInTwiML(userName: string): string {
    const twiml = new VoiceResponse();
    
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      `Hello ${userName}, this is your daily wellness check-in from MindMate AI. ` +
      `We're here to support your mental health journey.`
    );
    
    twiml.pause({ length: 1 });
    
    // Gather mood response
    const gather = twiml.gather({
      numDigits: 1,
      timeout: 5,
      action: '/twilio/callbacks/checkin-response',
      method: 'POST',
    });
    
    gather.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'How are you feeling today? Press 1 for great, 2 for good, 3 for okay, ' +
      '4 for not great, or 5 if you need immediate support.'
    );
    
    // Fallback if no input
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'We did not receive a response. Please check in through the MindMate app. ' +
      'Have a wonderful day!'
    );
    
    return twiml.toString();
  }

  /**
   * Generate crisis support TwiML
   */
  generateCrisisTwiML(): string {
    const twiml = new VoiceResponse();
    
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'We understand you may be going through a difficult time. ' +
      'Your wellbeing is important to us.'
    );
    
    twiml.pause({ length: 1 });
    
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'Please know that help is available 24 hours a day. ' +
      'The National Suicide Prevention Lifeline can be reached at 9 8 8. ' +
      'Crisis counselors are standing by to help.'
    );
    
    twiml.pause({ length: 2 });
    
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'You can also text HOME to 7 4 1 7 4 1 to connect with the Crisis Text Line. ' +
      'Remember, you are not alone.'
    );
    
    return twiml.toString();
  }

  /**
   * Generate appointment reminder TwiML
   */
  generateAppointmentReminderTwiML(
    userName: string,
    appointmentTime: string,
    therapistName: string
  ): string {
    const twiml = new VoiceResponse();
    
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      `Hello ${userName}, this is a reminder from MindMate AI. ` +
      `You have a therapy session scheduled with ${therapistName} at ${appointmentTime}.`
    );
    
    twiml.pause({ length: 1 });
    
    const gather = twiml.gather({
      numDigits: 1,
      timeout: 5,
      action: '/twilio/callbacks/appointment-confirm',
      method: 'POST',
    });
    
    gather.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'Press 1 to confirm, 2 to reschedule, or 3 to cancel.'
    );
    
    return twiml.toString();
  }

  /**
   * Generate medication reminder TwiML
   */
  generateMedicationReminderTwiML(
    userName: string,
    medicationName: string
  ): string {
    const twiml = new VoiceResponse();
    
    twiml.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      `Hello ${userName}, this is your medication reminder from MindMate AI. ` +
      `It's time to take your ${medicationName}.`
    );
    
    twiml.pause({ length: 1 });
    
    const gather = twiml.gather({
      numDigits: 1,
      timeout: 5,
      action: '/twilio/callbacks/medication-taken',
      method: 'POST',
    });
    
    gather.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'Press 1 after you have taken your medication.'
    );
    
    return twiml.toString();
  }
}

export const twiMLGenerator = new TwiMLGenerator();
```

### 2.5 SMS Response Handler

```typescript
// services/twilio/sms.handler.ts
import { twilioService } from './twilio.service';
import { moodRepository } from '../../repositories/mood.repository';
import { userRepository } from '../../repositories/user.repository';
import { notificationService } from '../notification/notification.service';
import { crisisDetectionService } from '../crisis/crisis-detection.service';

export interface IncomingSMS {
  from: string;
  to: string;
  body: string;
  messageSid: string;
}

export class SMSHandler {
  /**
   * Process incoming SMS
   */
  async handleIncomingSMS(sms: IncomingSMS): Promise<string> {
    const user = await userRepository.findByPhoneNumber(sms.from);
    
    if (!user) {
      return this.generateResponse(
        'Thank you for your message. Please download the MindMate AI app to get started: https://mindmate.ai/download'
      );
    }

    const body = sms.body.trim().toLowerCase();
    
    // Check for crisis keywords
    if (crisisDetectionService.containsCrisisKeywords(body)) {
      await this.handleCrisisResponse(user.id, sms.from);
      return this.generateResponse(
        'We are connecting you with support immediately. A counselor will contact you within 5 minutes. ' +
        'If you are in immediate danger, please call 911 or go to your nearest emergency room.'
      );
    }

    // Handle mood check-in responses
    if (/^[1-5]$/.test(body)) {
      return this.handleMoodResponse(user.id, sms.from, parseInt(body));
    }

    // Handle help request
    if (body === 'help') {
      return this.handleHelpRequest(user.id, sms.from);
    }

    // Handle stop/unsubscribe
    if (['stop', 'unsubscribe', 'cancel'].includes(body)) {
      await this.handleUnsubscribe(user.id);
      return this.generateResponse(
        'You have been unsubscribed from MindMate SMS notifications. ' +
        'You can resubscribe anytime in the app settings.'
      );
    }

    // Default response
    return this.generateResponse(
      'Thank you for your message. For the best experience, please use the MindMate AI app. ' +
      'Reply STOP to unsubscribe.'
    );
  }

  /**
   * Handle mood rating response
   */
  private async handleMoodResponse(
    userId: string,
    phoneNumber: string,
    rating: number
  ): Promise<string> {
    // Store mood check-in
    await moodRepository.createFromSMS({
      userId,
      rating,
      source: 'sms',
      timestamp: new Date(),
    });

    // Determine response based on rating
    let response: string;
    let followUpAction: string | null = null;

    switch (rating) {
      case 1: // Great
        response = 'Wonderful! We are so glad to hear you are doing well. ' +
          'Keep up the great work on your wellness journey!';
        break;
      case 2: // Good
        response = 'Glad to hear things are going well! Remember to take time for self-care today.';
        break;
      case 3: // Okay
        response = 'Thanks for checking in. Remember, it is okay to have neutral days. ' +
          'Consider using one of our guided meditations or journaling features.';
        followUpAction = 'suggest_resources';
        break;
      case 4: // Not great
        response = 'We are sorry to hear you are having a tough time. ' +
          'Would you like to talk to someone? Reply HELP to connect with support.';
        followUpAction = 'wellness_check';
        break;
      case 5: // Need support
        response = 'We are here for you. A member of our support team will reach out shortly. ' +
          'In the meantime, crisis support is available 24/7 at 988.';
        followUpAction = 'crisis_support';
        break;
      default:
        response = 'Thank you for your response.';
    }

    // Trigger follow-up actions
    if (followUpAction) {
      await notificationService.triggerFollowUp(userId, followUpAction, { rating });
    }

    return this.generateResponse(response);
  }

  /**
   * Handle crisis response
   */
  private async handleCrisisResponse(
    userId: string,
    phoneNumber: string
  ): Promise<void> {
    // Alert crisis team
    await crisisDetectionService.alertCrisisTeam(userId, {
      source: 'sms',
      phoneNumber,
      timestamp: new Date(),
    });

    // Initiate callback
    await twilioService.makeWellnessCheckInCall(phoneNumber, 'there');
  }

  /**
   * Handle help request
   */
  private async handleHelpRequest(
    userId: string,
    phoneNumber: string
  ): Promise<string> {
    // Check if user has human therapy sessions available
    const subscription = await userRepository.getSubscription(userId);
    
    if (subscription.humanTherapySessionsPerMonth > 0) {
      // Schedule callback from therapist
      await notificationService.scheduleTherapistCallback(userId);
      return this.generateResponse(
        'A therapist will call you within the next hour. ' +
        'If this is an emergency, please call 911 or 988.'
      );
    }

    return this.generateResponse(
      'Here are some immediate resources:\n' +
      'Crisis Text Line: Text HOME to 741741\n' +
      'National Suicide Prevention: 988\n' +
      'Crisis Chat: https://crisischat.org\n\n' +
      'Upgrade to Premium for 24/7 therapist access.'
    );
  }

  /**
   * Handle unsubscribe
   */
  private async handleUnsubscribe(userId: string): Promise<void> {
    await userRepository.updateSMSPreferences(userId, {
      enabled: false,
      unsubscribedAt: new Date(),
    });
  }

  /**
   * Generate TwiML response
   */
  private generateResponse(message: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${this.escapeXml(message)}</Message>
</Response>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const smsHandler = new SMSHandler();
```

### 2.6 Twilio Routes

```typescript
// routes/twilio.routes.ts
import { Router, Request, Response } from 'express';
import { twiMLGenerator } from '../services/twilio/twiml.generator';
import { smsHandler } from '../services/twilio/sms.handler';

const router = Router();

// SMS webhook
router.post('/sms', async (req: Request, res: Response) => {
  try {
    const { From, To, Body, MessageSid } = req.body;
    
    const twiml = await smsHandler.handleIncomingSMS({
      from: From,
      to: To,
      body: Body,
      messageSid: MessageSid,
    });
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

// TwiML endpoints
router.get('/twiml/checkin', (req: Request, res: Response) => {
  const { name } = req.query;
  const twiml = twiMLGenerator.generateCheckInTwiML(name as string || 'there');
  
  res.type('text/xml');
  res.send(twiml);
});

router.get('/twiml/crisis', (req: Request, res: Response) => {
  const twiml = twiMLGenerator.generateCrisisTwiML();
  res.type('text/xml');
  res.send(twiml);
});

router.get('/twiml/appointment', (req: Request, res: Response) => {
  const { name, time, therapist } = req.query;
  const twiml = twiMLGenerator.generateAppointmentReminderTwiML(
    name as string,
    time as string,
    therapist as string
  );
  res.type('text/xml');
  res.send(twiml);
});

// Status callbacks
router.post('/callbacks/call-status', (req: Request, res: Response) => {
  const { CallSid, CallStatus, Duration } = req.body;
  
  console.log(`Call ${CallSid} status: ${CallStatus}, duration: ${Duration}`);
  
  // Store call status in database
  // Trigger follow-up actions based on status
  
  res.sendStatus(200);
});

router.post('/callbacks/checkin-response', async (req: Request, res: Response) => {
  const { Digits, From } = req.body;
  
  // Process check-in response
  // Similar to SMS mood response handling
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice=Polly.Joanna" language="en-US">Thank you for your response. Take care!</Say>
</Response>`;
  
  res.type('text/xml');
  res.send(twiml);
});

export default router;
```

### 2.7 Required Environment Variables

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_VOICE_NUMBER=+1xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+1xxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WEBHOOK_BASE_URL=https://api.mindmate.ai
```

---

## 3. Firebase - Push Notifications

### 3.1 Overview

Firebase Cloud Messaging (FCM) provides cross-platform push notifications for iOS, Android, and Web clients.

### 3.2 Environment Configuration

```typescript
// config/firebase.config.ts
export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  apiVersion: 'v1',
  maxBatchSize: 500,
  maxRetries: 3,
  retryDelayMs: 1000,
  topics: {
    allUsers: 'all_users',
    premiumUsers: 'premium_users',
    freeUsers: 'free_users',
    therapists: 'therapists',
  },
};
```

### 3.3 Firebase Service Implementation

```typescript
// services/firebase/firebase.service.ts
import admin from 'firebase-admin';
import { firebaseConfig } from '../../config/firebase.config';

export interface PushNotification {
  token?: string;
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  androidChannelId?: string;
}

export class FirebaseService {
  private app: admin.app.App;
  private messaging: admin.messaging.Messaging;
  
  constructor() {
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          privateKey: firebaseConfig.privateKey,
          clientEmail: firebaseConfig.clientEmail,
        }),
        databaseURL: firebaseConfig.databaseURL,
      });
    } else {
      this.app = admin.apps[0]!;
    }
    this.messaging = this.app.messaging();
  }

  async sendToDevice(notification: PushNotification): Promise<any> {
    if (!notification.token) throw new Error('Device token required');
    const message = this.buildMessage(notification);
    return await this.messaging.send({ ...message, token: notification.token });
  }

  async sendToDevices(notification: PushNotification): Promise<any> {
    if (!notification.tokens?.length) throw new Error('Device tokens required');
    const message = this.buildMessage(notification);
    const batches: string[][] = [];
    for (let i = 0; i < notification.tokens.length; i += firebaseConfig.maxBatchSize) {
      batches.push(notification.tokens.slice(i, i + firebaseConfig.maxBatchSize));
    }
    const allResponses: any[] = [];
    for (const batch of batches) {
      const response = await this.messaging.sendEachForMulticast({ ...message, tokens: batch });
      allResponses.push(...response.responses);
    }
    return { responses: allResponses, successCount: allResponses.filter(r => r.success).length };
  }

  async sendToTopic(notification: PushNotification): Promise<string> {
    if (!notification.topic) throw new Error('Topic required');
    const message = this.buildMessage(notification);
    return await this.messaging.send({ ...message, topic: notification.topic });
  }

  private buildMessage(notification: PushNotification): admin.messaging.Message {
    return {
      notification: { title: notification.title, body: notification.body, imageUrl: notification.imageUrl },
      data: notification.data,
      android: {
        priority: notification.priority || 'high',
        notification: { channelId: notification.androidChannelId || 'default', sound: notification.sound || 'default' },
      },
      apns: { payload: { aps: { sound: notification.sound || 'default', badge: notification.badge } } },
      webpush: { notification: { icon: '/icon-192x192.png' }, fcmOptions: { link: notification.data?.deepLink || '/' } },
    };
  }
}

export const firebaseService = new FirebaseService();
```

### 3.4 Required Environment Variables

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=mindmate-ai-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@mindmate-ai-prod.iam.gserviceaccount.com
```

---

## 4. SendGrid - Transactional Email

### 4.1 Overview

SendGrid handles all transactional emails including welcome emails, password resets, weekly reports, and subscription notifications.

### 4.2 Environment Configuration

```typescript
// config/sendgrid.config.ts
export const sendgridConfig = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@mindmate.ai',
  fromName: process.env.SENDGRID_FROM_NAME || 'MindMate AI',
  replyToEmail: process.env.SENDGRID_REPLY_TO || 'support@mindmate.ai',
  templates: {
    welcome: process.env.SENDGRID_TEMPLATE_WELCOME,
    passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET,
    weeklyReport: process.env.SENDGRID_TEMPLATE_WEEKLY_REPORT,
    subscriptionReceipt: process.env.SENDGRID_TEMPLATE_SUBSCRIPTION_RECEIPT,
    paymentFailed: process.env.SENDGRID_TEMPLATE_PAYMENT_FAILED,
  },
  maxRequestsPerSecond: 10,
  maxRetries: 3,
};
```

### 4.3 SendGrid Service Implementation

```typescript
// services/sendgrid/sendgrid.service.ts
import sgMail from '@sendgrid/mail';
import { sendgridConfig } from '../../config/sendgrid.config';

export interface EmailMessage {
  to: string | string[];
  templateId?: string;
  subject?: string;
  text?: string;
  html?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: any[];
  categories?: string[];
}

export class SendGridService {
  constructor() {
    sgMail.setApiKey(sendgridConfig.apiKey!);
  }

  async sendEmail(message: EmailMessage): Promise<any> {
    const msg = this.buildMessage(message);
    const response = await sgMail.send(msg);
    return response[0];
  }

  async sendTemplateEmail(to: string, templateId: string, templateData: Record<string, any>): Promise<any> {
    return this.sendEmail({ to, templateId, dynamicTemplateData: templateData });
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<any> {
    return this.sendTemplateEmail(to, sendgridConfig.templates.welcome!, {
      userName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    });
  }

  async sendPasswordResetEmail(to: string, userName: string, resetToken: string): Promise<any> {
    return this.sendTemplateEmail(to, sendgridConfig.templates.passwordReset!, {
      userName,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      expiresIn: '1 hour',
    });
  }

  private buildMessage(message: EmailMessage): sgMail.MailDataRequired {
    const msg: sgMail.MailDataRequired = {
      to: message.to,
      from: { email: sendgridConfig.fromEmail, name: sendgridConfig.fromName },
      replyTo: sendgridConfig.replyToEmail,
    };
    if (message.templateId) {
      msg.templateId = message.templateId;
      msg.dynamicTemplateData = message.dynamicTemplateData;
    } else {
      msg.subject = message.subject;
      msg.text = message.text;
      msg.html = message.html;
    }
    return msg;
  }
}

export const sendgridService = new SendGridService();
```

### 4.4 Required Environment Variables

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@mindmate.ai
SENDGRID_FROM_NAME=MindMate AI
SENDGRID_REPLY_TO=support@mindmate.ai

# Template IDs
SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_WEEKLY_REPORT=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_SUBSCRIPTION_RECEIPT=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PAYMENT_FAILED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 5. Calendly-Style Booking - Human Therapist Escalation

### 5.1 Overview

Custom booking system for scheduling sessions with human therapists, integrated with video conferencing and calendar synchronization.

### 5.2 Database Schema (Prisma)

```prisma
model Therapist {
  id              String    @id @default(uuid())
  userId          String    @unique
  licenseNumber   String
  licenseState    String
  specialties     String[]
  credentials     String
  bio             String
  yearsExperience Int
  timezone        String    @default("America/New_York")
  bufferMinutes   Int       @default(15)
  minNoticeHours  Int       @default(24)
  maxAdvanceDays  Int       @default(30)
  sessionDuration Int       @default(50)
  sessionPrice    Decimal   @db.Decimal(10, 2)
  isAvailable     Boolean   @default(true)
  isVerified      Boolean   @default(false)
  availabilitySlots AvailabilitySlot[]
  appointments    Appointment[]
  reviews         TherapistReview[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  @@index([isAvailable, isVerified])
}

model AvailabilitySlot {
  id           String    @id @default(uuid())
  therapistId  String
  dayOfWeek    Int
  startTime    String
  endTime      String
  isRecurring  Boolean   @default(true)
  specificDate DateTime?
  isBlocked    Boolean   @default(false)
  @@index([therapistId, dayOfWeek])
}

model Appointment {
  id              String            @id @default(uuid())
  therapistId     String
  patientId       String
  startTime       DateTime
  endTime         DateTime
  timezone        String
  status          AppointmentStatus @default(SCHEDULED)
  sessionType     SessionType       @default(VIDEO)
  notes           String?
  meetingUrl      String?
  meetingId       String?
  calendarEventId String?
  reminderSent24h Boolean           @default(false)
  reminderSent1h  Boolean           @default(false)
  canceledAt      DateTime?
  canceledBy      String?
  cancelReason    String?
  @@index([patientId, startTime])
  @@index([therapistId, startTime])
}

model TherapistReview {
  id          String   @id @default(uuid())
  therapistId String
  patientId   String
  rating      Int
  review      String?
  isAnonymous Boolean  @default(false)
  @@unique([therapistId, patientId])
}

enum AppointmentStatus { SCHEDULED CONFIRMED IN_PROGRESS COMPLETED CANCELED NO_SHOW RESCHEDULED }
enum SessionType { VIDEO PHONE CHAT IN_PERSON }
```

### 5.3 Booking Service

```typescript
// services/booking/booking.service.ts
import { addMinutes, startOfDay, addDays, parse, format } from 'date-fns';
import { prisma } from '../../lib/prisma';
import { zoomService } from '../video/zoom.service';
import { notificationService } from '../notification/notification.service';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  therapistId: string;
  therapistName: string;
}

export interface BookingRequest {
  patientId: string;
  therapistId: string;
  startTime: Date;
  sessionType: SessionType;
  notes?: string;
}

export class BookingService {
  async getAvailableSlots(therapistId: string, date: Date): Promise<TimeSlot[]> {
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      include: { availabilitySlots: true },
    });
    if (!therapist?.isAvailable) return [];

    const dayOfWeek = date.getDay();
    const sessionDuration = therapist.sessionDuration;
    const availabilitySlots = therapist.availabilitySlots.filter(
      s => s.dayOfWeek === dayOfWeek && !s.isBlocked
    );

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        therapistId,
        startTime: { gte: startOfDay(date), lt: addDays(startOfDay(date), 1) },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    const availableSlots: TimeSlot[] = [];
    for (const slot of availabilitySlots) {
      const slotStart = parse(slot.startTime, 'HH:mm', date);
      const slotEnd = parse(slot.endTime, 'HH:mm', date);
      let currentStart = slotStart;
      while (addMinutes(currentStart, sessionDuration) <= slotEnd) {
        const currentEnd = addMinutes(currentStart, sessionDuration);
        const isConflict = existingAppointments.some(
          apt => currentStart < apt.endTime && currentEnd > apt.startTime
        );
        if (!isConflict) {
          availableSlots.push({
            startTime: currentStart,
            endTime: currentEnd,
            therapistId: therapist.id,
            therapistName: therapist.user.name,
          });
        }
        currentStart = addMinutes(currentStart, sessionDuration + therapist.bufferMinutes);
      }
    }
    return availableSlots;
  }

  async bookAppointment(request: BookingRequest): Promise<any> {
    const therapist = await prisma.therapist.findUnique({ where: { id: request.therapistId } });
    if (!therapist) throw new Error('Therapist not found');

    const isAvailable = await this.isSlotAvailable(
      request.therapistId,
      request.startTime,
      addMinutes(request.startTime, therapist.sessionDuration)
    );
    if (!isAvailable) throw new Error('Time slot is no longer available');

    const meeting = await zoomService.createMeeting({
      topic: `Therapy Session - ${therapist.user.name}`,
      startTime: request.startTime,
      duration: therapist.sessionDuration,
    });

    const appointment = await prisma.appointment.create({
      data: {
        therapistId: request.therapistId,
        patientId: request.patientId,
        startTime: request.startTime,
        endTime: addMinutes(request.startTime, therapist.sessionDuration),
        timezone: therapist.timezone,
        sessionType: request.sessionType,
        notes: request.notes,
        meetingUrl: meeting.joinUrl,
        meetingId: meeting.id,
      },
    });

    await notificationService.send(request.patientId, {
      type: 'therapy_session_scheduled',
      title: 'Therapy Session Scheduled',
      body: `Your session with ${therapist.user.name} is scheduled for ${format(request.startTime, 'MMM d, h:mm a')}.`,
      data: { appointmentId: appointment.id, deepLink: `/therapy/session/${appointment.id}` },
    });

    return appointment;
  }

  private async isSlotAvailable(therapistId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const conflicting = await prisma.appointment.findFirst({
      where: {
        therapistId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [{ startTime: { lte: startTime }, endTime: { gt: startTime } },
             { startTime: { lt: endTime }, endTime: { gte: endTime } }],
      },
    });
    return !conflicting;
  }
}

export const bookingService = new BookingService();
```

### 5.4 Zoom Video Service

```typescript
// services/video/zoom.service.ts
import axios from 'axios';

export interface ZoomMeeting {
  id: string;
  joinUrl: string;
  startUrl: string;
  password?: string;
}

export interface CreateMeetingRequest {
  topic: string;
  startTime: Date;
  duration: number;
}

export class ZoomService {
  private baseUrl = 'https://api.zoom.us/v2';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: { grant_type: 'account_credentials', account_id: process.env.ZOOM_ACCOUNT_ID },
      auth: { username: process.env.ZOOM_CLIENT_ID!, password: process.env.ZOOM_CLIENT_SECRET! },
    });
    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    return this.accessToken;
  }

  async createMeeting(request: CreateMeetingRequest): Promise<ZoomMeeting> {
    const token = await this.getAccessToken();
    const response = await axios.post(
      `${this.baseUrl}/users/me/meetings`,
      {
        topic: request.topic,
        type: 2,
        start_time: request.startTime.toISOString(),
        duration: request.duration,
        settings: { host_video: true, participant_video: true, waiting_room: true },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return {
      id: response.data.id.toString(),
      joinUrl: response.data.join_url,
      startUrl: response.data.start_url,
      password: response.data.password,
    };
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    const token = await this.getAccessToken();
    await axios.delete(`${this.baseUrl}/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const zoomService = new ZoomService();
```

### 5.5 Required Environment Variables

```bash
# Zoom Integration
ZOOM_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOOM_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOOM_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Calendar
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=https://api.mindmate.ai/auth/google/callback
```

---

## 6. Apple Health / Google Fit - Sleep & Activity Data

### 6.1 Overview

Integration with Apple HealthKit and Google Fit to correlate sleep, activity, and wellness data with mood patterns.

### 6.2 Health Data Types

```typescript
// types/health.types.ts
export interface SleepData {
  id: string;
  userId: string;
  source: 'apple_health' | 'google_fit' | 'fitbit';
  date: Date;
  durationMinutes: number;
  timeInBedMinutes: number;
  stages?: { deepSleepMinutes: number; lightSleepMinutes: number; remSleepMinutes: number; awakeMinutes: number };
  sleepEfficiency?: number;
  sleepScore?: number;
  bedTime: Date;
  wakeTime: Date;
}

export interface ActivityData {
  id: string;
  userId: string;
  source: 'apple_health' | 'google_fit' | 'fitbit';
  date: Date;
  steps: number;
  distanceMeters?: number;
  activeEnergyBurned?: number;
  exerciseMinutes: number;
  restingHeartRate?: number;
  averageHeartRate?: number;
}

export interface HealthCorrelation {
  userId: string;
  date: Date;
  sleepMoodCorrelation: number;
  activityMoodCorrelation: number;
  exerciseMoodCorrelation: number;
  insights: string[];
  recommendations: string[];
}
```

### 6.3 Health Service

```typescript
// services/health/health.service.ts
import { prisma } from '../../lib/prisma';

export interface HealthSyncRequest {
  userId: string;
  provider: 'apple_health' | 'google_fit';
  startDate: Date;
  endDate: Date;
}

export class HealthService {
  async syncHealthData(request: HealthSyncRequest): Promise<{ sleepRecords: number; activityRecords: number }> {
    const { userId, provider, startDate, endDate } = request;
    // Data would be received from mobile app and stored
    return { sleepRecords: 0, activityRecords: 0 };
  }

  async storeSleepData(userId: string, data: SleepData[]) {
    const operations = data.map(sleep => 
      prisma.sleepData.upsert({
        where: { userId_date_source: { userId, date: sleep.date, source: sleep.source } },
        update: { durationMinutes: sleep.durationMinutes, stages: sleep.stages },
        create: { userId, source: sleep.source, date: sleep.date, durationMinutes: sleep.durationMinutes, bedTime: sleep.bedTime, wakeTime: sleep.wakeTime },
      })
    );
    const results = await prisma.$transaction(operations);
    return { count: results.length };
  }

  async storeActivityData(userId: string, data: ActivityData[]) {
    const operations = data.map(activity => 
      prisma.activityData.upsert({
        where: { userId_date_source: { userId, date: activity.date, source: activity.source } },
        update: { steps: activity.steps, exerciseMinutes: activity.exerciseMinutes },
        create: { userId, source: activity.source, date: activity.date, steps: activity.steps, exerciseMinutes: activity.exerciseMinutes },
      })
    );
    const results = await prisma.$transaction(operations);
    return { count: results.length };
  }

  async getHealthInsights(userId: string): Promise<{ insights: string[]; recommendations: string[] }> {
    const correlations = await prisma.healthCorrelation.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 30 });
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    const avgSleepMoodCorr = correlations.reduce((sum, c) => sum + c.sleepMoodCorrelation, 0) / correlations.length;
    if (avgSleepMoodCorr > 0.5) {
      insights.push('Your mood tends to be better on days following good sleep.');
      recommendations.push('Prioritize getting 7-9 hours of sleep for better mood stability.');
    }
    return { insights, recommendations };
  }
}

export const healthService = new HealthService();
```

### 6.4 Required Environment Variables

```bash
# Health Data Integration
HEALTH_DATA_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_FIT_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 7. Wearable Integration - Heart Rate Stress Detection

### 7.1 Overview

Integration with Apple Watch, Fitbit, Garmin, and other wearables for real-time heart rate monitoring and stress detection.

### 7.2 Wearable Data Types

```typescript
// types/wearable.types.ts
export enum WearableProvider { APPLE_WATCH = 'apple_watch', FITBIT = 'fitbit', GARMIN = 'garmin', OURA = 'oura' }

export interface WearableConnection {
  id: string;
  userId: string;
  provider: WearableProvider;
  deviceId: string;
  deviceName: string;
  isActive: boolean;
  lastSyncAt: Date;
  accessToken?: string;
  refreshToken?: string;
}

export interface HeartRateData {
  id: string;
  userId: string;
  timestamp: Date;
  bpm: number;
  hrv?: number;
  isResting: boolean;
  stressScore?: number;
}

export interface StressEvent {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  detectionMethod: 'hrv' | 'hr_elevation' | 'combined';
  confidence: number;
  avgHeartRate: number;
  maxHeartRate: number;
  interventionSent: boolean;
}
```

### 7.3 Wearable Service

```typescript
// services/wearable/wearable.service.ts
import { prisma } from '../../lib/prisma';
import { fitbitService } from './fitbit.service';
import { stressDetectionService } from './stress-detection.service';

export interface ConnectWearableRequest {
  userId: string;
  provider: WearableProvider;
  authCode: string;
}

export class WearableService {
  async connectWearable(request: ConnectWearableRequest): Promise<WearableConnection> {
    const { userId, provider, authCode } = request;
    let tokens: any, deviceInfo: any;
    
    switch (provider) {
      case WearableProvider.FITBIT:
        ({ tokens, deviceInfo } = await fitbitService.exchangeAuthCode(authCode));
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return await prisma.wearableConnection.upsert({
      where: { userId_provider: { userId, provider } },
      update: { deviceId: deviceInfo.deviceId, accessToken: tokens.accessToken, isActive: true },
      create: { userId, provider, deviceId: deviceInfo.deviceId, deviceName: deviceInfo.deviceName, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isActive: true, scopes: ['heart_rate', 'hrv'] },
    });
  }

  async syncWearableData(connectionId: string): Promise<any> {
    const connection = await prisma.wearableConnection.findUnique({ where: { id: connectionId } });
    if (!connection?.isActive) throw new Error('Connection not found or inactive');
    
    // Fetch and store data
    const { heartRateData, hrvData } = await fitbitService.fetchData(connection.accessToken!, connection.lastSyncAt, new Date());
    
    // Store data and detect stress
    await this.storeHeartRateData(connection.userId, heartRateData);
    const stressEvents = await stressDetectionService.detectStressEvents(connection.userId, heartRateData, hrvData);
    
    await prisma.wearableConnection.update({ where: { id: connectionId }, data: { lastSyncAt: new Date() } });
    return { heartRateRecords: heartRateData.length, stressEventsDetected: stressEvents.length };
  }

  private async storeHeartRateData(userId: string, data: HeartRateData[]) {
    if (data.length === 0) return { count: 0 };
    const result = await prisma.$transaction(data.map(hr => 
      prisma.heartRateData.upsert({
        where: { userId_timestamp: { userId, timestamp: hr.timestamp } },
        update: { bpm: hr.bpm, hrv: hr.hrv },
        create: { userId, timestamp: hr.timestamp, bpm: hr.bpm, hrv: hr.hrv, isResting: hr.isResting },
      })
    ));
    return { count: result.length };
  }
}

export const wearableService = new WearableService();
```

### 7.4 Stress Detection Service

```typescript
// services/wearable/stress-detection.service.ts
import { prisma } from '../../lib/prisma';
import { notificationService } from '../notification/notification.service';

export class StressDetectionService {
  private readonly HRV_DROP_THRESHOLD = 15;
  private readonly HR_ELEVATION_THRESHOLD = 20;
  private readonly STRESS_DURATION_MIN = 5;

  async detectStressEvents(userId: string, heartRateData: HeartRateData[], hrvData: any[]): Promise<StressEvent[]> {
    const baseline = await this.getHRVBaseline(userId);
    const restingHR = await this.getRestingHeartRate(userId);
    const events: StressEvent[] = [];

    if (baseline && hrvData.length > 0) {
      const hrvEvents = this.analyzeHRVStress(userId, hrvData, baseline, heartRateData);
      events.push(...hrvEvents);
    }

    for (const event of events) {
      const stored = await prisma.stressEvent.create({ data: event as any });
      if (stored.confidence > 0.7) {
        await this.sendStressIntervention(userId, stored);
      }
    }
    return events;
  }

  private analyzeHRVStress(userId: string, hrvData: any[], baseline: any, heartRateData: HeartRateData[]): StressEvent[] {
    const events: StressEvent[] = [];
    hrvData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let stressStart: Date | null = null;
    let stressReadings: any[] = [];

    for (const reading of hrvData) {
      const hrvDrop = ((baseline.dailyRmssd - reading.rmssd) / baseline.dailyRmssd) * 100;
      if (hrvDrop > this.HRV_DROP_THRESHOLD) {
        if (!stressStart) stressStart = reading.timestamp;
        stressReadings.push(reading);
      } else if (stressStart && stressReadings.length >= this.STRESS_DURATION_MIN) {
        events.push({
          id: '', userId, startTime: stressStart, endTime: reading.timestamp,
          detectionMethod: 'hrv', confidence: 0.8, avgHeartRate: 75, maxHeartRate: 95, interventionSent: false,
        } as StressEvent);
        stressStart = null; stressReadings = [];
      }
    }
    return events;
  }

  private async sendStressIntervention(userId: string, event: StressEvent): Promise<void> {
    await prisma.stressEvent.update({ where: { id: event.id }, data: { interventionSent: true } });
    await notificationService.send(userId, {
      type: 'stress_detected',
      title: 'Take a Moment',
      body: 'We noticed elevated stress signals. Try a quick breathing exercise?',
      data: { deepLink: '/wellness/breathing', eventId: event.id },
    });
  }

  private async getHRVBaseline(userId: string): Promise<any> {
    return await prisma.hrvBaseline.findFirst({ where: { userId }, orderBy: { date: 'desc' } });
  }

  private async getRestingHeartRate(userId: string): Promise<number> {
    const resting = await prisma.heartRateData.findMany({ where: { userId, isResting: true }, orderBy: { timestamp: 'desc' }, take: 100 });
    return resting.length > 0 ? Math.round(resting.reduce((sum, hr) => sum + hr.bpm, 0) / resting.length) : 70;
  }
}

export const stressDetectionService = new StressDetectionService();
```

### 7.5 Fitbit Integration

```typescript
// services/wearable/fitbit.service.ts
import axios from 'axios';

export class FitbitService {
  private baseUrl = 'https://api.fitbit.com';

  async exchangeAuthCode(authCode: string): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/oauth2/token`,
      new URLSearchParams({ clientId: process.env.FITBIT_CLIENT_ID!, grant_type: 'authorization_code', redirect_uri: process.env.FITBIT_REDIRECT_URI!, code: authCode }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')}` } }
    );
    const deviceResponse = await axios.get(`${this.baseUrl}/1/user/-/devices.json`, { headers: { Authorization: `Bearer ${response.data.access_token}` } });
    return { tokens: { accessToken: response.data.access_token, refreshToken: response.data.refresh_token, expiresIn: response.data.expires_in }, deviceInfo: { deviceId: deviceResponse.data[0].id, deviceName: deviceResponse.data[0].deviceVersion } };
  }

  async fetchData(accessToken: string, startDate: Date, endDate: Date): Promise<any> {
    const dateStr = startDate.toISOString().split('T')[0];
    const hrResponse = await axios.get(`${this.baseUrl}/1/user/-/activities/heart/date/${dateStr}/1d/1min.json`, { headers: { Authorization: `Bearer ${accessToken}` } });
    return { heartRateData: hrResponse.data['activities-heart-intraday']?.dataset || [], hrvData: [] };
  }
}

export const fitbitService = new FitbitService();
```

### 7.6 Required Environment Variables

```bash
# Fitbit Integration
FITBIT_CLIENT_ID=xxxxxxxxxx
FITBIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FITBIT_REDIRECT_URI=https://api.mindmate.ai/auth/fitbit/callback

# Garmin Integration
GARMIN_CONSUMER_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GARMIN_CONSUMER_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Oura Integration
OURA_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OURA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Apple Push Notifications
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=XXXXXXXXXX
APNS_BUNDLE_ID=ai.mindmate.app
APNS_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
```

---

## 8. Security Checklist

| Integration | Security Measure | Implementation |
|------------|------------------|----------------|
| Stripe | Webhook signature verification | stripe.webhooks.constructEvent() |
| Stripe | API key storage | Environment variables only |
| Twilio | Request validation | Twilio signature validation |
| Firebase | Service account | JSON key file, not embedded |
| SendGrid | API key rotation | Quarterly rotation schedule |
| Zoom | OAuth 2.0 | No hardcoded credentials |
| Fitbit | PKCE flow | For mobile OAuth |
| All | Rate limiting | 100 req/min per IP |
| All | Request logging | Audit trail for 90 days |

---

## 9. Environment Variables Summary

```bash
# ============================================
# MindMate AI - Third-Party Integration Config
# ============================================

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
TWILIO_MESSAGING_SERVICE_SID=MGxxx

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@mindmate.ai

# Zoom
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx

# Fitbit
FITBIT_CLIENT_ID=xxx
FITBIT_CLIENT_SECRET=xxx

# Garmin
GARMIN_CONSUMER_KEY=xxx
GARMIN_CONSUMER_SECRET=xxx

# Oura
OURA_CLIENT_ID=xxx
OURA_CLIENT_SECRET=xxx

# Apple Push
APNS_KEY_ID=xxx
APNS_TEAM_ID=xxx
APNS_BUNDLE_ID=ai.mindmate.app
```

---

## Document Information

- **Version**: 1.0.0
- **Last Updated**: 2024
- **Author**: Agent 45 - Third-Party Integrations Architect
- **Status**: Production Ready
