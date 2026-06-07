// ============================================================
// Billing Routes — Stripe Subscription Management
// ============================================================

import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  createBillingSubscription,
  cancelSubscription,
  changePlan,
  generateOverageInvoice,
  handleWebhook,
  createPortalSession,
} from '../services/stripe';

const router = Router();

// Customer billing endpoints (auth required)
router.use(authMiddleware);

/**
 * POST /api/billing/subscription
 * Create a new subscription with Stripe billing
 */
router.post('/subscription', async (req: Request, res: Response): Promise<void> => {
  const { plan_slug, annual, payment_method_id } = req.body;
  const userId = req.user!.userId;

  const db = getDb();
  const user = db.prepare('SELECT email, company_name FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const result = await createBillingSubscription({
    userId,
    email: user.email,
    companyName: user.company_name,
    planSlug: plan_slug || 'starter',
    annual: annual === true,
    paymentMethodId: payment_method_id,
  });

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json(result);
});

/**
 * POST /api/billing/cancel
 * Cancel the active subscription
 */
router.post('/cancel', async (req: Request, res: Response): Promise<void> => {
  const { at_period_end } = req.body;
  const result = await cancelSubscription(req.user!.userId, at_period_end !== false);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

/**
 * POST /api/billing/change-plan
 * Upgrade or downgrade subscription tier
 */
router.post('/change-plan', async (req: Request, res: Response): Promise<void> => {
  const { plan_slug } = req.body;
  if (!plan_slug) {
    res.status(400).json({ error: 'plan_slug is required' });
    return;
  }

  const result = await changePlan(req.user!.userId, plan_slug);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

/**
 * POST /api/billing/overage
 * Manually trigger overage invoice (admin only)
 */
router.post('/overage', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { subscription_id } = req.body;
  if (!subscription_id) {
    res.status(400).json({ error: 'subscription_id is required' });
    return;
  }

  const result = await generateOverageInvoice(subscription_id);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

/**
 * POST /api/billing/portal
 * Get Stripe Customer Portal URL for self-service billing
 */
router.post('/portal', async (req: Request, res: Response): Promise<void> => {
  const returnUrl = req.body.return_url || `${req.protocol}://${req.get('host')}/dashboard`;
  const url = await createPortalSession(req.user!.userId, returnUrl);

  if (!url) {
    res.status(400).json({ error: 'Could not create portal session. Ensure Stripe is configured.' });
    return;
  }
  res.json({ url });
});

/**
 * GET /api/billing/invoices
 * List billing history for the user
 */
router.get('/invoices', (req: Request, res: Response): void => {
  const db = getDb();
  const records = db.prepare(`
    SELECT * FROM billing_records
    WHERE user_id = ?
    ORDER BY period_start DESC
    LIMIT 12
  `).all(req.user!.userId);

  res.json({ invoices: records });
});

/**
 * POST /api/billing/webhook
 * Stripe webhook handler (no auth — uses Stripe signature)
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_missing');
    event = stripe.webhooks.constructEvent(
      JSON.stringify(req.body),
      sig,
      endpointSecret || 'whsec_missing'
    );
  } catch (err: any) {
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  await handleWebhook(event);
  res.json({ received: true });
});

export default router;