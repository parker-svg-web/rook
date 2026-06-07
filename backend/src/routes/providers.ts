// ============================================================
// Provider API Router
// Routes API calls through the appropriate provider integration
// ============================================================

import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { getProvider, getAllProviders } from '../providers/index';

const router = Router();

// All provider endpoints require authentication
router.use(authMiddleware);

/**
 * POST /api/providers/:slug/execute
 * Execute a provider API call
 * 
 * Body: { operation, params }
 * Example: { operation: "send-sms", params: { to: "+1234567890", body: "Hello!" } }
 */
router.post('/:slug/execute', async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const userId = req.user!.userId;
  const { slug } = req.params;
  const { operation, params } = req.body;

  if (!operation || !params) {
    res.status(400).json({ error: 'Missing required fields: operation, params' });
    return;
  }

  // Get the provider integration
  const provider = getProvider(slug);
  if (!provider) {
    res.status(404).json({ error: `Provider '${slug}' not found or not yet implemented` });
    return;
  }

  // Get the user's subscription
  const subscription = db.prepare(
    "SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
  ).get(userId) as any;

  if (!subscription) {
    res.status(403).json({ error: 'No active subscription found' });
    return;
  }

  // Check if this provider is linked to the subscription
  const providerDb = db.prepare('SELECT id FROM api_providers WHERE slug = ?').get(slug) as any;
  if (!providerDb) {
    res.status(404).json({ error: `Provider '${slug}' not configured in system` });
    return;
  }

  const subApi = db.prepare(
    'SELECT * FROM subscription_apis WHERE subscription_id = ? AND provider_id = ? AND is_active = 1'
  ).get(subscription.id, providerDb.id) as any;

  if (!subApi) {
    res.status(403).json({ error: `Provider '${slug}' is not linked to your subscription` });
    return;
  }

  // Get stored API key config
  // In production, this would retrieve encrypted credentials from a secure vault
  const providerConfig = {
    api_key: process.env[`ROOK_${slug.toUpperCase()}_API_KEY`] || 'dev-key-not-configured',
    account_sid: process.env[`ROOK_${slug.toUpperCase()}_ACCOUNT_SID`] || undefined,
    organization_id: process.env[`ROOK_${slug.toUpperCase()}_ORG_ID`] || undefined,
    sandbox: process.env.NODE_ENV !== 'production',
  };

  // Estimate credits before executing
  const estimatedCredits = provider.estimateCredits(params);

  try {
    const result = await provider.execute(subscription.id, providerConfig, operation, params);
    
    // Save the database state
    db.save();

    res.json({
      success: result.success,
      credits_used: result.credits_used,
      estimated_credits: estimatedCredits,
      data: result.provider_response,
      error: result.error,
      request_id: result.request_id,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Provider execution error: ${err.message}`,
    });
  }
});

/**
 * GET /api/providers/:slug/estimate
 * Estimate credits for a hypothetical operation without executing
 */
router.post('/:slug/estimate', (req: Request, res: Response): void => {
  const { slug } = req.params;
  const { operation, params } = req.body;

  const provider = getProvider(slug);
  if (!provider) {
    res.status(404).json({ error: `Provider '${slug}' not found` });
    return;
  }

  const estimatedCredits = provider.estimateCredits(params || {});
  res.json({
    provider: slug,
    operation: operation || 'unknown',
    estimated_credits: estimatedCredits,
  });
});

/**
 * GET /api/providers
 * List all available providers
 */
router.get('/', (_req: Request, res: Response): void => {
  const db = getDb();
  const systemProviders = db.prepare('SELECT * FROM api_providers WHERE is_active = 1').all() as any[];
  
  const available = getAllProviders().map(p => {
    const sysProv = systemProviders.find((s: any) => s.slug === p.slug);
    return {
      slug: p.slug,
      name: p.name,
      status: sysProv ? 'available' : 'pending_setup',
      available_operations: getOperationsForProvider(p.slug),
    };
  });

  res.json({ providers: available });
});

function getOperationsForProvider(slug: string): string[] {
  switch (slug) {
    case 'twilio':
      return ['send-sms', 'check-balance'];
    case 'sendgrid':
      return ['send-email', 'send-bulk', 'get-usage'];
    case 'openai':
      return ['chat', 'list-models'];
    default:
      return [];
  }
}

export default router;