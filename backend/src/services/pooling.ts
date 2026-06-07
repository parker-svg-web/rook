import { v4 as uuid } from 'uuid';
import { getDb } from '../models/database';

/**
 * Credit Pooling Engine
 * 
 * Manages the pooled credit system:
 * - Track credit consumption across multiple APIs
 * - Auto-refill when pool drops below threshold
 * - Calculate overage fees
 * - Generate alerts for low credit scenarios
 */

interface PoolStatus {
  subscription_id: string;
  pool_total: number;
  pool_used: number;
  pool_available: number;
  utilization_pct: number;
  auto_refill: boolean;
  refill_threshold: number;
  needs_refill: boolean;
  refill_amount: number;
}

/**
 * Get the current pool status for a subscription
 */
export function getPoolStatus(subscriptionId: string): PoolStatus | null {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
  if (!sub) return null;

  const pool_available = sub.credits_pool_total - sub.credits_pool_used;
  const utilization_pct = sub.credits_pool_total > 0
    ? Math.round((sub.credits_pool_used / sub.credits_pool_total) * 10000) / 100
    : 0;

  // Determine if auto-refill is needed
  const threshold_pct = sub.refill_threshold;
  const needs_refill = sub.auto_refill === 1 && utilization_pct >= (100 - threshold_pct);
  const refill_amount = needs_refill ? Math.round(sub.credits_pool_total * 0.5) : 0;

  return {
    subscription_id: sub.id,
    pool_total: sub.credits_pool_total,
    pool_used: sub.credits_pool_used,
    pool_available,
    utilization_pct,
    auto_refill: sub.auto_refill === 1,
    refill_threshold: sub.refill_threshold,
    needs_refill,
    refill_amount,
  };
}

/**
 * Record API usage against a subscription pool
 */
export function recordUsage(params: {
  subscription_id: string;
  provider_id: string;
  credits_used: number;
  request_count?: number;
  cost_usd?: number;
}): { success: boolean; pool_remaining: number; overage: boolean; error?: string } {
  const db = getDb();

  // Start a transaction
  const recordUsageTx = db.transaction(() => {
    // Get subscription
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(params.subscription_id) as any;
    if (!sub) {
      throw new Error('Subscription not found');
    }
    if (sub.status !== 'active') {
      throw new Error('Subscription is not active');
    }

    // Get subscription API link
    const subApi = db.prepare(
      'SELECT * FROM subscription_apis WHERE subscription_id = ? AND provider_id = ?'
    ).get(params.subscription_id, params.provider_id) as any;
    if (!subApi) {
      throw new Error('API provider not linked to this subscription');
    }

    // Check if we have enough credits in the pool
    const pool_remaining = (sub.credits_pool_total - sub.credits_pool_used) - params.credits_used;
    const overage = pool_remaining < 0;

    // If overage, only use remaining credits, mark rest for billing
    const usable_credits = overage
      ? (sub.credits_pool_total - sub.credits_pool_used)
      : params.credits_used;

    const effective_credits = Math.max(0, usable_credits);

    // Update the subscription pool
    db.prepare(
      'UPDATE subscriptions SET credits_pool_used = credits_pool_used + ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(effective_credits, params.subscription_id);

    // Update the per-API usage
    db.prepare(
      'UPDATE subscription_apis SET credits_used = credits_used + ? WHERE id = ?'
    ).run(effective_credits, subApi.id);

    // Record the usage log
    db.prepare(`
      INSERT INTO usage_logs (id, subscription_id, provider_id, credits_used, request_count, cost_usd, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      uuid(),
      params.subscription_id,
      params.provider_id,
      effective_credits,
      params.request_count || 1,
      params.cost_usd || null,
    );

    // Trigger low-credits alert if pool is running low
    const new_remaining = sub.credits_pool_total - (sub.credits_pool_used + effective_credits);
    const utilization_pct = sub.credits_pool_total > 0
      ? ((sub.credits_pool_used + effective_credits) / sub.credits_pool_total) * 100
      : 0;

    if (utilization_pct >= (100 - sub.refill_threshold) && sub.auto_refill === 1) {
      // Check if we already triggered a low-credits alert recently
      const recentAlert = db.prepare(`
        SELECT id FROM alerts 
        WHERE subscription_id = ? AND type = 'low_credits' AND is_triggered = 1 AND acknowledged = 0
      `).get(params.subscription_id) as any;

      if (!recentAlert) {
        db.prepare(`
          INSERT INTO alerts (id, subscription_id, type, threshold, message, is_triggered, triggered_at)
          VALUES (?, ?, 'low_credits', ?, ?, 1, datetime('now'))
        `).run(
          uuid(),
          params.subscription_id,
          sub.refill_threshold,
          `Pool at ${Math.round(utilization_pct)}% utilization. Auto-refill triggered.`,
        );
      }
    }

    return {
      success: true,
      pool_remaining: Math.max(0, new_remaining),
      overage,
    };
  });

  try {
    const result = recordUsageTx();
    return result;
  } catch (err: any) {
    return { success: false, pool_remaining: 0, overage: false, error: err.message };
  }
}

/**
 * Auto-refill the credit pool
 */
export function autoRefill(subscriptionId: string): { success: boolean; refill_amount: number; refill_cost: number } {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
  if (!sub || sub.auto_refill !== 1) {
    return { success: false, refill_amount: 0, refill_cost: 0 };
  }

  const pool_available = sub.credits_pool_total - sub.credits_pool_used;
  const utilization_pct = sub.credits_pool_total > 0
    ? (sub.credits_pool_used / sub.credits_pool_total) * 100
    : 0;

  // Only refill if utilization is above threshold
  if (utilization_pct < (100 - sub.refill_threshold)) {
    return { success: false, refill_amount: 0, refill_cost: 0 };
  }

  // Refill 50% of the original pool
  const refill_amount = Math.round(sub.credits_pool_total * 0.5);

  // Get the plan to determine cost
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(sub.plan_id) as any;
  const cost_per_credit = plan ? (plan.monthly_fee / plan.pool_credits) : 0.01;
  const refill_cost = Math.round(refill_amount * cost_per_credit * 100) / 100;

  // Update the pool
  db.prepare(`
    UPDATE subscriptions 
    SET credits_pool_total = credits_pool_total + ?, credits_pool_used = 0, updated_at = datetime('now')
    WHERE id = ?
  `).run(refill_amount, subscriptionId);

  // Record the refill alert
  db.prepare(`
    INSERT INTO alerts (id, subscription_id, type, message, is_triggered, triggered_at)
    VALUES (?, ?, 'refill', ?, 1, datetime('now'))
  `).run(
    uuid(),
    subscriptionId,
    `Auto-refill: ${refill_amount.toLocaleString()} credits added (est. cost $${refill_cost.toFixed(2)})`,
  );

  return { success: true, refill_amount, refill_cost };
}

/**
 * Calculate billing for a period
 */
export function calculateBill(subscriptionId: string): {
  base_fee: number;
  overage_fee: number;
  total: number;
  credits_used: number;
} | null {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
  if (!sub) return null;

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(sub.plan_id) as any;
  if (!plan) return null;

  const credits_used = sub.credits_pool_used;
  const base_fee = plan.monthly_fee;
  const overage_credits = Math.max(0, credits_used - plan.pool_credits);
  const overage_fee = Math.round(overage_credits * plan.overage_rate * 100) / 100;
  const total = base_fee + overage_fee;

  return { base_fee, overage_fee, total, credits_used };
}