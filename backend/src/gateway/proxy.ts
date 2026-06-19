// ============================================================
// API Gateway / Credit Proxy Layer
// The core pass-through of Rook: routes customer API calls,
// deducts credits in real-time, handles errors.
// ============================================================

import { v4 as uuid } from 'uuid';
import { getDb } from '../models/database';
import { getProvider, getAllProviders, ProviderConfig } from '../providers/index';
import { getPoolStatus, recordUsage, autoRefill, PoolStatus } from '../services/pooling';

// Standard response envelope for all gateway calls
export interface GatewayResponse {
  success: boolean;
  request_id: string;
  provider: string;
  operation: string;
  credits_used: number;
  credits_remaining: number;
  pool_utilization_pct: number;
  data?: any;
  error?: string;
  error_code?: string;
  timing_ms: number;
}

export interface GatewayContext {
  userId: string;
  subscriptionId: string;
  providerSlug: string;
  operation: string;
  params: any;
}

/**
 * Execute a proxied API call through the gateway.
 * This is the main entry point for all customer API requests.
 */
export async function proxyCall(ctx: GatewayContext): Promise<GatewayResponse> {
  const requestId = uuid();
  const startTime = Date.now();
  const { userId, subscriptionId, providerSlug, operation, params } = ctx;

  // 1. Validate provider exists
  const provider = getProvider(providerSlug);
  if (!provider) {
    return errorResponse(requestId, providerSlug, operation, 
      `Provider '${providerSlug}' is not available`, 'PROVIDER_NOT_FOUND', startTime);
  }

  // 2. Verify subscription and get provider config
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND status = ?')
    .get(subscriptionId, 'active') as any;
  if (!sub) {
    return errorResponse(requestId, providerSlug, operation,
      'Subscription is not active', 'SUBSCRIPTION_INACTIVE', startTime);
  }

  // 3. Estimate credits needed
  const estimatedCredits = provider.estimateCredits(params);
  
  // 5. Check pool status
  const poolStatus = getPoolStatus(subscriptionId);
  if (!poolStatus) {
    return errorResponse(requestId, providerSlug, operation,
      'Could not retrieve pool status', 'POOL_ERROR', startTime);
  }

  // Check if pool can handle this request
  if (poolStatus.pool_available < estimatedCredits && !poolStatus.needs_refill) {
    return errorResponse(requestId, providerSlug, operation,
      `Insufficient credits. Need ${estimatedCredits}, have ${poolStatus.pool_available}. ` +
      `Upgrade your plan or wait for auto-refill.`,
      'INSUFFICIENT_CREDITS', startTime);
  }

  // Auto-refill if needed
  if (poolStatus.needs_refill) {
    const refillResult = autoRefill(subscriptionId);
    if (refillResult.success) {
      console.log(`[gateway] Auto-refill triggered for ${subscriptionId}: ${refillResult.refill_amount} credits`);
    }
  }

  // 6. Get provider credentials from env (in production, from vault)
  const providerConfig: ProviderConfig = {
    api_key: process.env[`ROOK_${providerSlug.toUpperCase()}_API_KEY`] || 'dev-key-not-configured',
    account_sid: process.env[`ROOK_${providerSlug.toUpperCase()}_ACCOUNT_SID`] || undefined,
    organization_id: process.env[`ROOK_${providerSlug.toUpperCase()}_ORG_ID`] || undefined,
    sandbox: process.env.NODE_ENV !== 'production',
  };

  // 7. Execute the provider call (this also debits the pool)
  try {
    const result = await provider.execute(subscriptionId, providerConfig, operation, params);
    db.save();

    const elapsed = Date.now() - startTime;
    const poolAfter = getPoolStatus(subscriptionId);

    if (result.success) {
      return {
        success: true,
        request_id: requestId,
        provider: providerSlug,
        operation,
        credits_used: result.credits_used,
        credits_remaining: poolAfter?.pool_available || 0,
        pool_utilization_pct: poolAfter?.utilization_pct || 0,
        data: result.provider_response,
        timing_ms: elapsed,
      };
    } else {
      return {
        success: false,
        request_id: requestId,
        provider: providerSlug,
        operation,
        credits_used: result.credits_used || 0,
        credits_remaining: poolAfter?.pool_available || 0,
        pool_utilization_pct: poolAfter?.utilization_pct || 0,
        error: result.error,
        error_code: 'PROVIDER_ERROR',
        data: result.provider_response,
        timing_ms: elapsed,
      };
    }
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    return errorResponse(requestId, providerSlug, operation,
      `Gateway error: ${err.message}`, 'GATEWAY_ERROR', startTime);
  }
}

/**
 * Get real-time pool status for a subscription
 */
export function getRealtimePoolStatus(subscriptionId: string) {
  return getPoolStatus(subscriptionId);
}

/**
 * List available providers and their operations
 */
export function getAvailableProviders(): Array<{
  slug: string;
  name: string;
  operations: string[];
}> {
  return getAllProviders().map(p => ({
    slug: p.slug,
    name: p.name,
    operations: getOperationsForProvider(p.slug),
  }));
}

function getOperationsForProvider(slug: string): string[] {
  switch (slug) {
    case 'twilio': return ['send-sms', 'check-balance'];
    case 'sendgrid': return ['send-email', 'send-bulk', 'get-usage'];
    case 'openai': return ['chat', 'list-models'];
    default: return [];
  }
}

function errorResponse(
  requestId: string, provider: string, operation: string,
  error: string, errorCode: string, startTime: number
): GatewayResponse {
  return {
    success: false,
    request_id: requestId,
    provider,
    operation,
    credits_used: 0,
    credits_remaining: 0,
    pool_utilization_pct: 0,
    error,
    error_code: errorCode,
    timing_ms: Date.now() - startTime,
  };
}