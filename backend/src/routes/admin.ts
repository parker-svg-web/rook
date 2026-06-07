import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/stats - Dashboard stats for admin
router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb();

  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as any).count;
  const activeSubscriptions = (db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get() as any).count;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM billing_records WHERE status = 'paid'").get() as any).total;
  const totalCreditsUsed = (db.prepare('SELECT COALESCE(SUM(credits_used), 0) as total FROM usage_logs').get() as any).total;

  const usageByProvider = db.prepare(`
    SELECT ap.name, ap.slug, COUNT(*) as log_count, SUM(ul.credits_used) as total_credits
    FROM usage_logs ul
    JOIN api_providers ap ON ul.provider_id = ap.id
    WHERE ul.recorded_at >= datetime('now', '-30 days')
    GROUP BY ap.name
    ORDER BY total_credits DESC
  `).all();

  const mrr = (db.prepare(`
    SELECT COALESCE(SUM(p.monthly_fee), 0) as mrr
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
  `).get() as any).mrr;

  res.json({
    total_users: totalUsers,
    active_subscriptions: activeSubscriptions,
    total_revenue: totalRevenue,
    mrr,
    total_credits_used_30d: totalCreditsUsed,
    usage_by_provider: usageByProvider,
  });
});

// GET /api/admin/users - List all users
router.get('/users', (req: Request, res: Response): void => {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.email, u.company_name, u.role, u.created_at,
           s.status as subscription_status, p.name as plan_name
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    LEFT JOIN plans p ON s.plan_id = p.id
    ORDER BY u.created_at DESC
  `).all();
  res.json({ users });
});

// GET /api/admin/subscriptions
router.get('/subscriptions', (req: Request, res: Response): void => {
  const db = getDb();
  const subs = db.prepare(`
    SELECT s.*, u.email, u.company_name, p.name as plan_name, p.monthly_fee
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    JOIN plans p ON s.plan_id = p.id
    ORDER BY s.created_at DESC
  `).all();
  res.json({ subscriptions: subs });
});

// GET /api/admin/providers
router.get('/providers', (req: Request, res: Response): void => {
  const db = getDb();
  const providers = db.prepare('SELECT * FROM api_providers ORDER BY name').all();
  res.json({ providers });
});

// GET /api/admin/plans
router.get('/plans', (req: Request, res: Response): void => {
  const db = getDb();
  const plans = db.prepare('SELECT * FROM plans ORDER BY monthly_fee').all();
  res.json({ plans });
});

export default router;