// ============================================================
// Provider Integration - Common Interface
// ============================================================

/**
 * Result from a provider API call
 */
export interface ProviderResult {
  success: boolean;
  credits_used: number;
  provider_response?: any;
  error?: string;
  request_id?: string;
}

/**
 * Configuration for a provider
 */
export interface ProviderConfig {
  api_key: string;
  account_sid?: string;    // Twilio
  organization_id?: string; // OpenAI
  sandbox?: boolean;
}

/**
 * Common interface all API provider integrations must implement.
 * Each provider handles:
 * 1. Forwarding the API call to the real provider
 * 2. Debiting the customer's credit pool
 * 3. Logging usage to usage_logs
 * 4. Graceful error handling
 */
export interface ApiProviderIntegration {
  /** Provider slug (e.g., 'twilio', 'sendgrid', 'openai') */
  readonly slug: string;
  
  /** Human-readable name */
  readonly name: string;

  /**
   * Calculate how many credits an operation will consume
   */
  estimateCredits(params: any): number;

  /**
   * Execute the API call against the real provider
   * Automatically debits the customer's credit pool
   */
  execute(
    subscriptionId: string,
    config: ProviderConfig,
    operation: string,
    params: any
  ): Promise<ProviderResult>;

  /**
   * Get usage/cost from the provider (balance, quota, etc.)
   */
  getStatus(config: ProviderConfig): Promise<any>;
}

/**
 * Helper: safely encrypt a provider API key
 * In production, this would use a KMS or HSM
 */
export function encryptApiKey(apiKey: string): string {
  // Simple obfuscation for development
  // In production: use AWS KMS / Google Cloud KMS
  return Buffer.from(`rook:enc:${apiKey}`).toString('base64');
}

/**
 * Helper: decrypt a provider API key
 */
export function decryptApiKey(encrypted: string): string {
  const decoded = Buffer.from(encrypted, 'base64').toString('utf-8');
  const prefix = 'rook:enc:';
  if (decoded.startsWith(prefix)) {
    return decoded.slice(prefix.length);
  }
  return decoded; // fallback for unencrypted keys
}

/**
 * Map of provider slugs to their implementations
 */
const registry = new Map<string, ApiProviderIntegration>();

export function registerProvider(provider: ApiProviderIntegration): void {
  registry.set(provider.slug, provider);
}

export function getProvider(slug: string): ApiProviderIntegration | undefined {
  return registry.get(slug);
}

export function getAllProviders(): ApiProviderIntegration[] {
  return Array.from(registry.values());
}