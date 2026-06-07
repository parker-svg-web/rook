import { v4 as uuid } from 'uuid';
import { getDb } from '../models/database';

/**
 * Billing Engine
 * 
 * Handles:
 * - Monthly subscription billing
 * - Overage calculation
 * - Invoice generation
 */

/**
 * Generate monthly bill for a subscription
 */
export function generateMonthlyBill(subscriptionId: string): {
  success: boolean;
  billing_record_id?: string;
  error?: string;
} {
  const db = getDb();

  const billTx = db.transaction(() => {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
    if (!sub) return { success: false, error: 'Subscription not found' };

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(sub.plan_id) as any;
    if (!plan) return { success: false, error: 'Plan not found' };

    // Calculate base fee
    const base_fee = plan.monthly_fee;

    // Calculate overage
    const overage_credits = Math.max(0, sub.credits_pool_used - plan.pool_credits);
    const overage_fee = Math.round(overage_credits * plan.overage_rate * 100) / 100;

    const total = base_fee + overage_fee;

    // Determine billing period
    const periodStart = sub.billing_cycle_start || new Date().toISOString().split('T')[0];
    const periodEnd = sub.billing_cycle_end || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    // Create billing record
    const billingId = uuid();
    db.prepare(`
      INSERT INTO billing_records (id, subscription_id, user_id, amount, base_fee, overage_fee, credits_used, status, period_start, period_end, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(billingId, sub.id, sub.user_id, total, base_fee, overage_fee, sub.credits_pool_used, periodStart, periodEnd, dueDate);

    // Reset usage counters for new cycle
    db.prepare(`
      UPDATE subscriptions 
      SET credits_pool_used = 0, 
          billing_cycle_start = datetime('now', 'start of month'),
          billing_cycle_end = datetime('now', 'start of month', '+1 month', '-1 second'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(subscriptionId);

    // Reset per-API usage counters
    db.prepare('UPDATE subscription_apis SET credits_used = 0 WHERE subscription_id = ?').run(subscriptionId);

    return { success: true, billing_record_id: billingId };
  });

  return billTx();
}

/**
 * Mark a billing record as paid
 */
export function markAsPaid(billingRecordId: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE billing_records SET status = 'paid', paid_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `).run(billingRecordId);
  return result.changes > 0;
}

/**
 * Get billing history for a subscription
 */
export function getBillingHistory(subscriptionId: string, limit = 12) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM billing_records
    WHERE subscription_id = ?
    ORDER BY period_start DESC
    LIMIT ?
  `).all(subscriptionId, limit);
}

/**
 * Get upcoming billing estimate
 */
export function getUpcomingBillingEstimate(subscriptionId: string): {
  base_fee: number;
  projected_overage_fee: number;
  estimated_total: number;
  days_remaining: number;
} | null {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
  if (!sub) return null;

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(sub.plan_id) as any;
  if (!plan) return null;

  // Calculate days remaining in billing cycle
  const cycleEnd = sub.billing_cycle_end ? new Date(sub.billing_cycle_end) : new Date(Date.now() + 30 * 86400000);
  const now = new Date();
  const days_remaining = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / 86400000));

  // Estimate projected usage
  const days_elapsed = Math.max(1, 30 - days_remaining);
  const projected_usage = days_elapsed > 0
    ? Math.round((sub.credits_pool_used / days_elapsed) * 30)
    : sub.credits_pool_used;

  const overage_credits = Math.max(0, projected_usage - plan.pool_credits);
  const projected_overage_fee = Math.round(overage_credits * plan.overage_rate * 100) / 100;

  return {
    base_fee: plan.monthly_fee,
    projected_overage_fee,
    estimated_total: plan.monthly_fee + projected_overage_fee,
    days_remaining,
  };
}