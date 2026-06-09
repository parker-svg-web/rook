// ============================================================
// Stripe Billing Integration
// Handles subscription lifecycle, billing, webhooks, overage
// ============================================================

import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { getDb } from '../models/database';
import { recordUsage } from './pooling';

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_missing';
const stripe = new Stripe(stripeKey, { apiVersion: '2025-03-31' as any });

// Plan-to-Price mapping (set via env or create in Stripe dashboard)
const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual',
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || 'price_growth_monthly',
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || 'price_growth_annual',
  },
};

const OVERAGE_PRICE_ID = process.env.STRIPE_OVERAGE_PRICE_ID || 'price_overage';

export interface CreateSubscriptionParams {
  userId: string;
  email: string;
  companyName: string;
  planSlug: string;
  annual?: boolean;
  paymentMethodId?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  stripeSubscriptionId?: string;
  stripeClientSecret?: string;
  error?: string;
}

/**
 * Create a Stripe customer and subscription
 */
export async function createBillingSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
  const db = getDb();

  try {
    // 1. Get or create Stripe customer
    const existingCustomer = db.prepare(
      "SELECT stripe_customer_id FROM users WHERE id = ? AND stripe_customer_id IS NOT NULL"
    ).get(params.userId) as any;

    let stripeCustomerId = existingCustomer?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.companyName,
        metadata: { rook_user_id: params.userId },
      });
      stripeCustomerId = customer.id;
      db.run('UPDATE users SET stripe_customer_id = ? WHERE id = ?', stripeCustomerId, params.userId);
    }

    // 2. Get the plan
    const plan = db.prepare("SELECT * FROM plans WHERE slug = ?").get(params.planSlug) as any;
    if (!plan) {
      return { success: false, error: `Plan '${params.planSlug}' not found` };
    }

    // 3. Get the price IDs
    const priceConfig = PRICE_IDS[params.planSlug];
    if (!priceConfig) {
      return { success: false, error: `No price configured for plan '${params.planSlug}'` };
    }

    const priceId = params.annual ? priceConfig.annual : priceConfig.monthly;
    const billingInterval = params.annual ? 'year' : 'month';

    // 4. Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        { price: priceId, quantity: 1 },
        { price: OVERAGE_PRICE_ID }, // Metered overage
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        rook_user_id: params.userId,
        plan_slug: params.planSlug,
        billing_interval: billingInterval,
      },
      expand: ['latest_invoice.payment_intent'],
      ...(params.paymentMethodId ? { default_payment_method: params.paymentMethodId } : {}),
    });

    // 5. Create local subscription record
    const subId = uuid();
    const now = new Date();
    const cycleStart = now.toISOString();
    const cycleEnd = params.annual
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString()
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

    const monthlyFee = params.annual ? plan.monthly_fee * 12 * 0.8 : plan.monthly_fee; // 20% annual discount
    const poolCredits = params.annual ? plan.pool_credits * 12 : plan.pool_credits;

    // Cancel any existing subscriptions
    db.run("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'", params.userId);

    db.run(`
      INSERT INTO subscriptions (id, user_id, plan_id, status, credits_pool_total, credits_pool_used, billing_cycle_start, billing_cycle_end, auto_refill)
      VALUES (?, ?, ?, 'active', ?, 0, ?, ?, 1)
    `, subId, params.userId, plan.id, poolCredits, cycleStart, cycleEnd);

    // Store stripe subscription ID for webhook matching
    db.run(`
      INSERT INTO billing_records (id, subscription_id, user_id, amount, base_fee, status, period_start, period_end, due_date)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
    `, uuid(), subId, params.userId, monthlyFee, cycleStart, cycleEnd, cycleEnd);

    db.save();

    // 6. Return client secret for payment confirmation
    const latestInvoice = subscription.latest_invoice as any;
    const paymentIntent = latestInvoice?.payment_intent as any;

    return {
      success: true,
      subscriptionId: subId,
      stripeSubscriptionId: subscription.id,
      stripeClientSecret: paymentIntent?.client_secret,
    };
  } catch (err: any) {
    console.error('[stripe] createSubscription error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(userId: string, atPeriodEnd = true): Promise<SubscriptionResult> {
  const db = getDb();

  try {
    const user = db.prepare("SELECT stripe_customer_id FROM users WHERE id = ?").get(userId) as any;
    if (!user?.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' };
    }

    const sub = db.prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
    ).get(userId) as any;
    if (!sub) {
      return { success: false, error: 'No active subscription' };
    }

    // Find the Stripe subscription
    const stripeSubs = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
      status: 'active',
    });

    if (stripeSubs.data.length > 0) {
      await stripe.subscriptions.update(stripeSubs.data[0].id, {
        cancel_at_period_end: atPeriodEnd,
      });
    }

    if (!atPeriodEnd) {
      // Immediate cancellation
      db.run("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?", sub.id);
    }

    db.save();
    return { success: true, subscriptionId: sub.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Change plan tier
 */
export async function changePlan(userId: string, newPlanSlug: string): Promise<SubscriptionResult> {
  const db = getDb();
  try {
    const user = db.prepare("SELECT stripe_customer_id FROM users WHERE id = ?").get(userId) as any;
    if (!user?.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' };
    }

    const plan = db.prepare("SELECT * FROM plans WHERE slug = ?").get(newPlanSlug) as any;
    if (!plan) return { success: false, error: 'Plan not found' };

    const priceConfig = PRICE_IDS[newPlanSlug];
    if (!priceConfig) return { success: false, error: 'Price not configured' };

    const stripeSubs = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
      status: 'active',
    });

    if (stripeSubs.data.length > 0) {
      await stripe.subscriptions.update(stripeSubs.data[0].id, {
        items: [{
          id: stripeSubs.data[0].items.data[0].id,
          price: priceConfig.monthly,
          quantity: 1,
        }],
        proration_behavior: 'always_invoice',
        metadata: { plan_slug: newPlanSlug },
      });
    }

    // Update local subscription
    const sub = db.prepare(
      "SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
    ).get(userId) as any;

    if (sub) {
      db.run('UPDATE subscriptions SET plan_id = ?, credits_pool_total = ?, updated_at = datetime(\'now\') WHERE id = ?',
        plan.id, plan.pool_credits, sub.id);
    }

    db.save();
    return { success: true, subscriptionId: sub?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Generate overage invoice at end of billing cycle
 */
export async function generateOverageInvoice(subscriptionId: string): Promise<any> {
  const db = getDb();

  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
  if (!sub) return { error: 'Subscription not found' };

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(sub.plan_id) as any;
  if (!plan) return { error: 'Plan not found' };

  const overageCredits = Math.max(0, sub.credits_pool_used - plan.pool_credits);
  if (overageCredits <= 0) return { message: 'No overage to bill' };

  const overageFee = Math.round(overageCredits * plan.overage_rate * 100) / 100;

  try {
    const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(sub.user_id) as any;

    await (stripe.invoiceItems.create as any)({
      customer: user.stripe_customer_id,
      price_data: {
        currency: 'usd',
        product: OVERAGE_PRICE_ID,
        unit_amount: Math.round(plan.overage_rate * 100), // cents
        recurring: { interval: 'month', interval_count: 1 },
      },
      quantity: overageCredits,
      description: `${overageCredits.toLocaleString()} overage credits (${plan.name} plan)`,
    });

    const invoice = await stripe.invoices.create({
      customer: user.stripe_customer_id,
      auto_advance: true,
      collection_method: 'charge_automatically',
      metadata: {
        subscription_id: subscriptionId,
        type: 'overage',
        credits: overageCredits.toString(),
      },
    });

    return { success: true, invoice_id: invoice.id, amount: overageFee, credits: overageCredits };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(event: any): Promise<void> {
  const db = getDb();

  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object as any;
      const subId = invoice.metadata?.subscription_id;
      if (subId) {
        db.run("UPDATE billing_records SET status = 'paid', paid_at = datetime('now') WHERE subscription_id = ? AND status = 'pending'", subId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const failedInvoice = event.data.object as any;
      const failedSubId = failedInvoice.metadata?.subscription_id;
      if (failedSubId) {
        db.run("UPDATE subscriptions SET status = 'past_due' WHERE id = ?", failedSubId);
        db.run("UPDATE billing_records SET status = 'failed' WHERE subscription_id = ? AND status = 'pending'", failedSubId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object as any;
      const userId = stripeSub.metadata?.rook_user_id;
      if (userId && stripeSub.status === 'past_due') {
        db.run("UPDATE subscriptions SET status = 'past_due' WHERE user_id = ? AND status = 'active'", userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const deletedSub = event.data.object as any;
      const delUserId = deletedSub.metadata?.rook_user_id;
      if (delUserId) {
        db.run("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'", delUserId);
      }
      break;
    }
  }

  db.save();
}

/**
 * Create Stripe Customer Portal session for self-service billing
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<string | null> {
  const db = getDb();
  const user = db.prepare("SELECT stripe_customer_id FROM users WHERE id = ?").get(userId) as any;
  if (!user?.stripe_customer_id) return null;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl,
    });
    return session.url;
  } catch {
    return null;
  }
}