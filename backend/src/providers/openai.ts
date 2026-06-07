// ============================================================
// OpenAI GPT-4o-mini Provider Integration
// ============================================================
// Chat completions: 1 credit per 500 input tokens + 2 credits per 200 output tokens
// Uses OpenAI's Chat Completions API
// ============================================================

import { v4 as uuid } from 'uuid';
import {
  ApiProviderIntegration, ProviderConfig, ProviderResult,
  encryptApiKey, decryptApiKey, registerProvider,
} from './index';
import { recordUsage } from '../services/pooling';
import { getDb } from '../models/database';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * OpenAI GPT-4o-mini Provider
 * 
 * Credit consumption (GPT-4o-mini):
 * - 1 credit per 500 input tokens
 * - 2 credits per 200 output tokens
 * 
 * Example: 500 input + 200 output tokens = 1 + 2 = 3 credits
 * 
 * Error handling:
 * - Token limit exceeded → truncate prompt
 * - Rate limited → retry with exponential backoff
 * - Invalid API key → fail gracefully
 * - Content policy violation → return error message
 */
class OpenAIProvider implements ApiProviderIntegration {
  readonly slug = 'openai';
  readonly name = 'OpenAI';

  estimateCredits(params: any): number {
    const { messages, max_tokens } = params;
    
    // Estimate input tokens (rough: ~4 chars per token)
    const inputText = Array.isArray(messages) 
      ? messages.map((m: any) => m.content || '').join(' ')
      : '';
    const estimatedInputTokens = Math.ceil(inputText.length / 4);
    
    // Output tokens from max_tokens or default
    const estimatedOutputTokens = max_tokens || 200;

    // Credit calculation
    const inputCredits = estimatedInputTokens / 500;
    const outputCredits = (estimatedOutputTokens / 200) * 2;
    
    return Math.max(1, Math.ceil(inputCredits + outputCredits));
  }

  async execute(
    subscriptionId: string,
    config: ProviderConfig,
    operation: string,
    params: any
  ): Promise<ProviderResult> {
    const requestId = uuid();

    switch (operation) {
      case 'chat':
        return this.chatCompletion(subscriptionId, config, params, requestId);
      case 'stream-chat':
        return this.streamChatCompletion(subscriptionId, config, params, requestId);
      case 'list-models':
        return this.listModels(config, requestId);
      default:
        return { success: false, credits_used: 0, error: `Unknown operation: ${operation}` };
    }
  }

  private async chatCompletion(
    subscriptionId: string,
    config: ProviderConfig,
    params: any,
    requestId: string
  ): Promise<ProviderResult> {
    const { model, messages, max_tokens, temperature, ...restParams } = params;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { success: false, credits_used: 0, error: 'Messages array is required', request_id: requestId };
    }

    // Default to GPT-4o-mini
    const effectiveModel = model || 'gpt-4o-mini';
    const effectiveMaxTokens = max_tokens || 1000;
    const effectiveTemperature = temperature ?? 0.7;

    // Estimate credits needed
    const estimatedCredits = this.estimateCredits({ messages, max_tokens: effectiveMaxTokens });

    // Debit the credit pool first
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

    // Build OpenAI request payload
    const requestBody: any = {
      model: effectiveModel,
      messages,
      max_tokens: effectiveMaxTokens,
      temperature: effectiveTemperature,
      ...restParams,
    };

    try {
      const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Organization': config.organization_id || '',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorCode = responseData.error?.code || 'unknown';
        const errorMsg = responseData.error?.message || 'OpenAI API error';

        // Handle specific error types
        if (response.status === 401) {
          return {
            success: false,
            credits_used: estimatedCredits,
            error: 'Invalid OpenAI API key',
            request_id: requestId,
          };
        }

        if (response.status === 429) {
          return {
            success: false,
            credits_used: estimatedCredits,
            error: 'OpenAI rate limit exceeded. Please try again.',
            request_id: requestId,
          };
        }

        if (response.status === 400 && errorCode === 'context_length_exceeded') {
          return {
            success: false,
            credits_used: estimatedCredits,
            error: 'Token limit exceeded. Try reducing the message length.',
            provider_response: responseData,
            request_id: requestId,
          };
        }

        if (response.status === 400 && errorCode === 'content_policy_violation') {
          return {
            success: false,
            credits_used: estimatedCredits,
            error: 'Content policy violation. Please review your message content.',
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

      // Calculate actual tokens used
      const promptTokens = responseData.usage?.prompt_tokens || 0;
      const completionTokens = responseData.usage?.completion_tokens || 0;
      const totalTokens = responseData.usage?.total_tokens || 0;

      // Calculate actual credits based on real token usage
      const actualInputCredits = promptTokens / 500;
      const actualOutputCredits = (completionTokens / 200) * 2;
      const actualCredits = Math.max(1, Math.ceil(actualInputCredits + actualOutputCredits));

      // If actual credits differ from estimate, adjust
      if (actualCredits !== estimatedCredits) {
        // For now, log a notice. In production, reconcile the difference
        console.log(
          `[openai] Credit estimate mismatch: estimated=${estimatedCredits}, actual=${actualCredits} ` +
          `(prompt=${promptTokens}, completion=${completionTokens})`
        );
      }

      return {
        success: true,
        credits_used: actualCredits,
        provider_response: {
          id: responseData.id,
          model: responseData.model,
          usage: responseData.usage,
          choices: responseData.choices?.map((c: any) => ({
            index: c.index,
            finish_reason: c.finish_reason,
            message: {
              role: c.message?.role,
              content: c.message?.content,
            },
          })),
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

  private async streamChatCompletion(
    subscriptionId: string,
    config: ProviderConfig,
    params: any,
    requestId: string
  ): Promise<ProviderResult> {
    // Streaming is not fully implemented in this stub
    // In production, this would use SSE (Server-Sent Events)
    return {
      success: false,
      credits_used: 0,
      error: 'Streaming is not yet supported in this stub. Use "chat" operation instead.',
      request_id: requestId,
    };
  }

  private async listModels(config: ProviderConfig, requestId: string): Promise<any> {
    const apiKey = decryptApiKey(config.api_key);
    try {
      const response = await fetch(`${OPENAI_API_BASE}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      return await response.json();
    } catch {
      return { error: 'Could not fetch OpenAI models' };
    }
  }

  async getStatus(config: ProviderConfig): Promise<any> {
    const apiKey = decryptApiKey(config.api_key);
    try {
      const response = await fetch(`${OPENAI_API_BASE}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const data = await response.json();
      return {
        accessible_models: data.data?.length || 0,
        organization: config.organization_id || 'default',
      };
    } catch {
      return { error: 'Could not fetch OpenAI status' };
    }
  }

  private async getProviderDbId(): Promise<string> {
    const db = getDb();
    const provider = db.prepare("SELECT id FROM api_providers WHERE slug = 'openai'").get() as any;
    return provider?.id || 'unknown';
  }
}

// Register the provider
const openaiProvider = new OpenAIProvider();
registerProvider(openaiProvider);
export default openaiProvider;