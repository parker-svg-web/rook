// ============================================================
// API Gateway Routes
// Proxy endpoints for customer API calls
// ============================================================

import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { proxyCall, getRealtimePoolStatus, getAvailableProviders } from '../gateway/proxy';
import { getPoolStatus, calculateBill } from '../services/pooling';

const router = Router();

// All gateway endpoints require auth
router.use(authMiddleware);

/**
 * POST /api/v1/proxy/:provider/:operation
 * 
 * The main proxy endpoint. Forwards API calls to the appropriate provider.
 * Deducts credits in real-time before forwarding.
 * 
 * Example: POST /api/v1/proxy/twilio/send-sms
 * Body: { "to": "+1234567890", "body": "Hello from Rook!" }
 */
router.post('/proxy/:provider/:operation', async (req: Request, res: Response): Promise<void> => {
  const provider = req.params.provider as string;
  const operation = req.params.operation as string;
  const params = req.body;
  const userId = req.user!.userId;

  // Get user's active subscription
  const db = getDb();
  const subscription = db.prepare(
    "SELECT id, status FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
  ).get(userId) as any;

  if (!subscription) {
    res.status(403).json({
      success: false,
      error: 'No active subscription found',
      error_code: 'NO_SUBSCRIPTION',
    });
    return;
  }

  const result = await proxyCall({
    userId,
    subscriptionId: subscription.id,
    providerSlug: provider,
    operation,
    params,
  });

  const statusCode = result.success ? 200 : (result.error_code === 'INSUFFICIENT_CREDITS' ? 402 :
    result.error_code === 'PROVIDER_NOT_LINKED' ? 403 :
    result.error_code === 'PROVIDER_NOT_FOUND' ? 404 : 502);

  res.status(statusCode).json(result);
});

/**
 * GET /api/v1/pool
 * Get current credit pool status
 */
router.get('/pool', (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.userId;

  const sub = db.prepare(
    "SELECT id, credits_pool_total, credits_pool_used, auto_refill, refill_threshold, status FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
  ).get(userId) as any;

  if (!sub) {
    res.status(404).json({ error: 'No active subscription' });
    return;
  }

  const pool = getPoolStatus(sub.id);
  if (!pool) {
    res.status(500).json({ error: 'Could not determine pool status' });
    return;
  }

  // Get linked APIs
  const apis = db.prepare(`
    SELECT ap.name, ap.slug, sa.allocated_credits, sa.credits_used
    FROM subscription_apis sa
    JOIN api_providers ap ON sa.provider_id = ap.id
    WHERE sa.subscription_id = ? AND sa.is_active = 1
  `).all(sub.id);

  res.json({
    pool: {
      total: pool.pool_total,
      used: pool.pool_used,
      available: pool.pool_available,
      utilization_pct: pool.utilization_pct,
      auto_refill: pool.auto_refill,
      refill_threshold: pool.refill_threshold,
    },
    apis,
    subscription_status: sub.status,
  });
});

/**
 * GET /api/v1/providers
 * List available providers
 */
router.get('/providers', (_req: Request, res: Response): void => {
  const providers = getAvailableProviders();
  res.json({ providers });
});

/**
 * POST /api/v1/pool/estimate
 * Estimate credits for a hypothetical API call
 */
router.post('/pool/estimate', (req: Request, res: Response): void => {
  const { provider: providerSlug, operation, params } = req.body;

  if (!providerSlug) {
    res.status(400).json({ error: 'Provider slug is required' });
    return;
  }

  const { getProvider } = require('../providers/index');
  const provider = getProvider(providerSlug);
  if (!provider) {
    res.status(404).json({ error: `Provider '${providerSlug}' not found` });
    return;
  }

  const estimatedCredits = provider.estimateCredits(params || {});
  res.json({
    provider: providerSlug,
    operation: operation || 'unknown',
    estimated_credits: estimatedCredits,
  });
});

/**
 * GET /api/v1/billing/estimate
 * Get upcoming billing estimate
 */
router.get('/billing/estimate', (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.userId;

  const sub = db.prepare(
    "SELECT id, plan_id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
  ).get(userId) as any;

  if (!sub) {
    res.status(404).json({ error: 'No active subscription' });
    return;
  }

  const { getUpcomingBillingEstimate } = require('../services/billing');
  const estimate = getUpcomingBillingEstimate(sub.id);

  if (!estimate) {
    res.status(500).json({ error: 'Could not calculate estimate' });
    return;
  }

  res.json({ estimate });
});

export default router;