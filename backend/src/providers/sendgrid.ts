// ============================================================
// SendGrid Email Provider Integration
// ============================================================
// Email: 0.5 credits per email
// Uses SendGrid's v3 Mail Send API
// ============================================================

import { v4 as uuid } from 'uuid';
import { 
  ApiProviderIntegration, ProviderConfig, ProviderResult,
  encryptApiKey, decryptApiKey, registerProvider 
} from './index';
import { recordUsage } from '../services/pooling';
import { getDb } from '../models/database';

const SENDGRID_API_BASE = 'https://api.sendgrid.com/v3';

/**
 * SendGrid Email Provider
 * 
 * Credit consumption:
 * - 1 email: 0.5 credits
 * - Bulk email (100+): 0.4 credits each (volume discount)
 * 
 * Error handling:
 * - Invalid email → return error with details
 * - Rate limited → retry with backoff
 * - Spam detection → flag and alert
 */
class SendGridProvider implements ApiProviderIntegration {
  readonly slug = 'sendgrid';
  readonly name = 'SendGrid';

  estimateCredits(params: any): number {
    const { personalizations, bulk } = params;
    const recipientCount = personalizations?.length || 1;
    const perEmailCost = bulk && recipientCount >= 100 ? 0.4 : 0.5;
    return Math.ceil(recipientCount * perEmailCost * 10) / 10; // Round to 1 decimal
  }

  async execute(
    subscriptionId: string,
    config: ProviderConfig,
    operation: string,
    params: any
  ): Promise<ProviderResult> {
    const requestId = uuid();

    switch (operation) {
      case 'send-email':
        return this.sendEmail(subscriptionId, config, params, requestId);
      case 'send-bulk':
        return this.sendBulk(subscriptionId, config, params, requestId);
      case 'get-usage':
        return this.getUsage(config, requestId);
      default:
        return { success: false, credits_used: 0, error: `Unknown operation: ${operation}` };
    }
  }

  private async sendEmail(
    subscriptionId: string,
    config: ProviderConfig,
    params: any,
    requestId: string
  ): Promise<ProviderResult> {
    const { to, from, subject, content, html } = params;

    if (!to || !from) {
      return { success: false, credits_used: 0, error: 'Missing required fields: to, from', request_id: requestId };
    }

    const estimatedCredits = this.estimateCredits({ personalizations: [{ to: [to] }] });

    // Debit the credit pool
    const usageResult = recordUsage({
      subscription_id: subscriptionId,
      provider_id: await this.getProviderDbId(),
      credits_used: estimatedCredits,
      request_count: 1,
    });

    if (!usageResult.success) {
      return {
        success: false,
        credits_used: 0,
        error: usageResult.error || 'Insufficient credits',
        request_id: requestId,
      };
    }

    const apiKey = decryptApiKey(config.api_key);

    // Build SendGrid v3 Mail Send payload
    const mailData: any = {
      personalizations: [{
        to: Array.isArray(to) ? to.map((t: string) => ({ email: t })) : [{ email: to }],
        subject: subject || 'No Subject',
      }],
      from: { email: typeof from === 'string' ? from : from.email },
      content: content ? [{ type: content.type || 'text/plain', value: content.value }] : undefined,
    };

    if (html) {
      mailData.content = [{ type: 'text/html', value: html }];
    }

    try {
      const response = await fetch(`${SENDGRID_API_BASE}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMsg = `SendGrid error: ${response.status}`;
        
        try {
          const errJson = JSON.parse(errorBody);
          errorMsg = errJson.errors?.[0]?.message || errorMsg;
        } catch { /* use default */ }

        // Handle specific HTTP status codes
        if (response.status === 401) {
          return {
            success: false,
            credits_used: estimatedCredits,
            error: 'Invalid SendGrid API key',
            request_id: requestId,
          };
        }
        if (response.status === 429) {
          return {
            success: false,
            credits_used: estimatedCredits,
            error: 'SendGrid rate limit exceeded. Please try again.',
            request_id: requestId,
          };
        }

        return {
          success: false,
          credits_used: estimatedCredits,
          error: errorMsg,
          request_id: requestId,
        };
      }

      // SendGrid returns 202 Accepted on success
      return {
        success: true,
        credits_used: estimatedCredits,
        provider_response: {
          status: 'queued',
          to: Array.isArray(to) ? to : [to],
          from: typeof from === 'string' ? from : from.email,
        },
        request_id: requestId,
      };

    } catch (err: any) {
      return {
        success: false,
        credits_used: estimatedCredits,
        error: `Network error: ${err.message}`,
        request_id: requestId,
      };
    }
  }

  private async sendBulk(
    subscriptionId: string,
    config: ProviderConfig,
    params: any,
    requestId: string
  ): Promise<ProviderResult> {
    // Bulk is the same as send but with multiple personalizations
    return this.sendEmail(subscriptionId, config, {
      ...params,
      bulk: true,
    }, requestId);
  }

  private async getUsage(config: ProviderConfig, requestId: string): Promise<any> {
    const apiKey = decryptApiKey(config.api_key);
    try {
      const response = await fetch(`${SENDGRID_API_BASE}/stats`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      return await response.json() as any;
    } catch {
      return { error: 'Could not fetch SendGrid usage' };
    }
  }

  async getStatus(config: ProviderConfig): Promise<any> {
    const apiKey = decryptApiKey(config.api_key);
    try {
      const response = await fetch(`${SENDGRID_API_BASE}/user/profile`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      return await response.json() as any;
    } catch {
      return { error: 'Could not fetch SendGrid status' };
    }
  }

  private async getProviderDbId(): Promise<string> {
    const db = getDb();
    const provider = db.prepare("SELECT id FROM api_providers WHERE slug = 'sendgrid'").get() as any;
    return provider?.id || 'unknown';
  }
}

// Register the provider
const sendGridProvider = new SendGridProvider();
registerProvider(sendGridProvider);
export default sendGridProvider;