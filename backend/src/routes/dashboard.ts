import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard - Full dashboard summary
router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.userId;

  // Get user info
  const user = db.prepare('SELECT id, email, company_name FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get subscription with plan details
  const subscription = db.prepare(`
    SELECT 
      s.id, s.status, s.credits_pool_total, s.credits_pool_used,
      s.billing_cycle_start, s.billing_cycle_end, s.auto_refill, s.refill_threshold,
      p.name as plan_name, p.slug as plan_slug, p.monthly_fee, p.max_apis
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get(userId) as any;

  if (!subscription) {
    res.status(404).json({ error: 'No active subscription found' });
    return;
  }

  const credits_available = subscription.credits_pool_total - subscription.credits_pool_used;
  const utilization_pct = subscription.credits_pool_total > 0
    ? Math.round((subscription.credits_pool_used / subscription.credits_pool_total) * 100 * 100) / 100
    : 0;

  // Get linked APIs with usage
  const apis = db.prepare(`
    SELECT 
      sa.provider_id, ap.name as provider_name, ap.slug as provider_slug,
      sa.api_key_label, sa.allocated_credits, sa.credits_used,
      CASE WHEN sa.allocated_credits > 0 
        THEN ROUND(CAST(sa.credits_used AS REAL) / sa.allocated_credits * 100, 2)
        ELSE 0 
      END as utilization_pct
    FROM subscription_apis sa
    JOIN api_providers ap ON sa.provider_id = ap.id
    WHERE sa.subscription_id = ? AND sa.is_active = 1
  `).all(subscription.id) as any[];

  // Get recent usage (last 30 days)
  const recent_usage = db.prepare(`
    SELECT 
      DATE(ul.recorded_at) as date,
      ap.name as provider_name,
      SUM(ul.credits_used) as credits_used
    FROM usage_logs ul
    JOIN api_providers ap ON ul.provider_id = ap.id
    WHERE ul.subscription_id = ?
      AND ul.recorded_at >= datetime('now', '-30 days')
    GROUP BY DATE(ul.recorded_at), ap.name
    ORDER BY ul.recorded_at DESC
    LIMIT 60
  `).all(subscription.id) as any[];

  // Get triggered alerts
  const alerts = db.prepare(`
    SELECT * FROM alerts
    WHERE subscription_id = ? AND is_triggered = 1 AND acknowledged = 0
    ORDER BY created_at DESC
    LIMIT 10
  `).all(subscription.id) as any[];

  res.json({
    user,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      plan_name: subscription.plan_name,
      plan_slug: subscription.plan_slug,
      monthly_fee: subscription.monthly_fee,
      max_apis: subscription.max_apis,
      credits_pool_total: subscription.credits_pool_total,
      credits_pool_used: subscription.credits_pool_used,
      credits_available,
      utilization_pct,
      billing_cycle_start: subscription.billing_cycle_start,
      billing_cycle_end: subscription.billing_cycle_end,
      auto_refill: subscription.auto_refill === 1,
      refill_threshold: subscription.refill_threshold,
    },
    apis,
    recent_usage,
    alerts,
  });
});

// GET /api/dashboard/usage - Detailed usage history
router.get('/usage', (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.userId;

  const sub = db.prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1").get(userId) as any;
  if (!sub) {
    res.status(404).json({ error: 'No active subscription' });
    return;
  }

  const days = parseInt(req.query.days as string) || 30;
  const usage = db.prepare(`
    SELECT 
      DATE(ul.recorded_at) as date,
      ap.name as provider_name,
      ap.slug as provider_slug,
      SUM(ul.credits_used) as credits_used,
      SUM(ul.request_count) as request_count,
      SUM(ul.cost_usd) as cost_usd
    FROM usage_logs ul
    JOIN api_providers ap ON ul.provider_id = ap.id
    WHERE ul.subscription_id = ?
      AND ul.recorded_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(ul.recorded_at), ap.name
    ORDER BY ul.recorded_at DESC
  `).all(sub.id, days);

  res.json({ usage });
});

// GET /api/dashboard/billing - Billing history
router.get('/billing', (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.userId;

  const records = db.prepare(`
    SELECT * FROM billing_records
    WHERE user_id = ?
    ORDER BY period_start DESC
    LIMIT 12
  `).all(userId);

  res.json({ billing_records: records });
});

// POST /api/dashboard/alerts/:id/acknowledge
router.post('/alerts/:id/acknowledge', (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.userId;

  // Verify the alert belongs to the user's subscription
  const alert = db.prepare(`
    SELECT a.id FROM alerts a
    JOIN subscriptions s ON a.subscription_id = s.id
    WHERE a.id = ? AND s.user_id = ?
  `).get(req.params.id, userId) as any;

  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  db.run('UPDATE alerts SET acknowledged = 1 WHERE id = ?', alert.id);
  db.save();
  res.json({ success: true });
});

export default router;