import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from '../models/database';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      company_name: user.company_name,
      role: user.role,
    },
  });
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, company_name } = req.body;
  if (!email || !password || !company_name) {
    res.status(400).json({ error: 'Email, password, and company name are required' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuid();
  db.run(
    'INSERT INTO users (id, email, company_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    id, email, company_name, hash, 'customer'
  );

  // Assign them the Starter plan
  const starterPlan = db.prepare("SELECT id, pool_credits FROM plans WHERE slug = 'starter'").get() as any;
  if (starterPlan) {
    const subId = uuid();
    db.run(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, credits_pool_total, billing_cycle_start, billing_cycle_end)
      VALUES (?, ?, ?, 'active', ?, datetime('now', 'start of month'), datetime('now', 'start of month', '+1 month', '-1 second'))`,
      subId, id, starterPlan.id, starterPlan.pool_credits
    );
  }

  db.save();

  const token = generateToken({ userId: id, email, role: 'customer' });
  res.status(201).json({
    token,
    user: { id, email, company_name, role: 'customer' },
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, company_name, role, created_at FROM users WHERE id = ?')
    .get(req.user!.userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;