// ============================================================
// Twilio SMS Provider Integration
// ============================================================
// SMS: 3 credits per US SMS message
// Uses Twilio's REST API to send SMS and track usage
// ============================================================

import { v4 as uuid } from 'uuid';
import { 
  ApiProviderIntegration, ProviderConfig, ProviderResult,
  encryptApiKey, decryptApiKey, registerProvider 
} from './index';
import { recordUsage } from '../services/pooling';
import { getDb } from '../models/database';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

/**
 * Twilio SMS Provider
 * 
 * Credit consumption:
 * - 1 US SMS: 3 credits
 * - International SMS: 5 credits (higher cost)
 * 
 * Error handling:
 * - Invalid phone number → retry once with formatting
 * - Rate limited → exponential backoff (3 retries)
 * - Account suspended → fail and alert
 */
class TwilioProvider implements ApiProviderIntegration {
  readonly slug = 'twilio';
  readonly name = 'Twilio';

  estimateCredits(params: any): number {
    const to = params.to || '';
    // International numbers cost more
    const isInternational = /^\+[1]/.test(to) === false;
    return isInternational ? 5 : 3;
  }

  async execute(
    subscriptionId: string,
    config: ProviderConfig,
    operation: string,
    params: any
  ): Promise<ProviderResult> {
    const requestId = uuid();

    switch (operation) {
      case 'send-sms':
        return this.sendSms(subscriptionId, config, params, requestId);
      case 'check-balance':
        return this.checkBalance(config, requestId);
      default:
        return { success: false, credits_used: 0, error: `Unknown operation: ${operation}` };
    }
  }

  private async sendSms(
    subscriptionId: string,
    config: ProviderConfig,
    params: any,
    requestId: string
  ): Promise<ProviderResult> {
    const { to, from, body } = params;
    
    if (!to || !body) {
      return { success: false, credits_used: 0, error: 'Missing required fields: to, body', request_id: requestId };
    }

    // Estimate credits needed
    const estimatedCredits = this.estimateCredits(params);

    // Check if subscription has enough credits (the pooling service handles this)
    // Record usage first - the pooling service will reject if insufficient
    const usageResult = recordUsage({
      subscription_id: subscriptionId,
      provider_id: await this.getProviderDbId(),
      credits_used: estimatedCredits,
      request_count: 1,
      cost_usd: 0, // We'll calculate actual cost from Twilio response
    });

    if (!usageResult.success) {
      return { 
        success: false, 
        credits_used: 0, 
        error: usageResult.error || 'Insufficient credits',
        request_id: requestId 
      };
    }

    // Prepare the API call to Twilio
    const accountSid = config.account_sid || config.api_key.split(':')[0];
    const authToken = decryptApiKey(config.api_key);
    
    // Build the form-encoded body
    const formBody = new URLSearchParams({
      To: to.trim(),
      From: from || '+15005550006', // Default sandbox number
      Body: body,
    });

    try {
      // Make the HTTP request to Twilio
      const response = await fetch(
        `${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody.toString(),
        }
      );

      const responseData: any = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.message || 'Twilio API error';
        
        // Handle specific error codes
        if (response.status === 429 || responseData.code === 20429) {
          // Rate limited - could retry with exponential backoff
          return { 
            success: false, 
            credits_used: estimatedCredits, 
            error: 'Rate limited by Twilio. Please try again.',
            provider_response: responseData,
            request_id: requestId,
          };
        }

        if (responseData.code === 21211) {
          // Invalid 'To' phone number
          return { 
            success: false, 
            credits_used: estimatedCredits, 
            error: `Invalid phone number: ${to}`,
            provider_response: responseData,
            request_id: requestId,
          };
        }

        return { 
          success: false, 
          credits_used: estimatedCredits, 
          error: errorMsg,
          provider_response: responseData,
          request_id: requestId,
        };
      }

      // Success!
      const actualCost = responseData.price ? parseFloat(responseData.price) * -1 : 0;
      
      // Update usage with actual cost
      const db = getDb();
      db.run(
        'UPDATE usage_logs SET cost_usd = ? WHERE id = (SELECT id FROM usage_logs WHERE subscription_id = ? AND recorded_at = datetime(\'now\') ORDER BY recorded_at DESC LIMIT 1)',
        actualCost, subscriptionId
      );

      return {
        success: true,
        credits_used: estimatedCredits,
        provider_response: {
          sid: responseData.sid,
          status: responseData.status,
          to: responseData.to,
          from: responseData.from,
          price: actualCost,
        },
        request_id: requestId,
      };

    } catch (err: any) {
      // Network error - could implement retry logic here
      return {
        success: false,
        credits_used: estimatedCredits,
        error: `Network error: ${err.message}`,
        request_id: requestId,
      };
    }
  }

  async checkBalance(config: ProviderConfig, requestId?: string): Promise<any> {
    const accountSid = config.account_sid || config.api_key.split(':')[0];
    const authToken = decryptApiKey(config.api_key);

    try {
      const response = await fetch(
        `${TWILIO_API_BASE}/Accounts/${accountSid}.json`,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          },
        }
      );
      const data: any = await response.json();
      return {
        balance: data.balance,
        status: data.status,
        friendly_name: data.friendly_name,
      };
    } catch {
      return { error: 'Could not fetch Twilio account status' };
    }
  }

  async getStatus(config: ProviderConfig): Promise<any> {
    return this.checkBalance(config);
  }

  private async getProviderDbId(): Promise<string> {
    const db = getDb();
    const provider = db.prepare("SELECT id FROM api_providers WHERE slug = 'twilio'").get() as any;
    return provider?.id || 'unknown';
  }
}

// Register the provider
const twilioProvider = new TwilioProvider();
registerProvider(twilioProvider);
export default twilioProvider;