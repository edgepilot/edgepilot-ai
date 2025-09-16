import { Message, HttpError } from './types';
import { CloudflareApiClient, OpenAIApiClient } from './api-client';
import { withRetry } from './retry';

/**
 * Provider management and fallback logic
 */

export interface ProviderOptions {
  cloudflareApiKey: string;
  cloudflareAccountId: string;
  openaiApiKey?: string;
  debug?: boolean;
  maxRetries?: number;
}

export interface CallOptions {
  messages: Message[];
  model?: string;
  streaming?: boolean;
  temperature?: number;
  provider?: string;
}

/**
 * Multi-provider API client with fallback logic
 */
export class ProviderManager {
  private cloudflareClient: CloudflareApiClient;
  private openaiClient?: OpenAIApiClient;
  private debug: boolean;
  private maxRetries: number;
  private providerPreference: string;
  private openaiModel: string;

  constructor(options: ProviderOptions) {
    this.debug = options.debug ?? false;
    this.maxRetries = options.maxRetries ?? 3;
    this.providerPreference = (process.env.EDGEPILOT_PROVIDER || 'cloudflare').toLowerCase();
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Initialize Cloudflare client
    this.cloudflareClient = new CloudflareApiClient({
      apiKey: options.cloudflareApiKey,
      accountId: options.cloudflareAccountId,
      debug: this.debug
    });

    // Initialize OpenAI client if available
    if (options.openaiApiKey) {
      this.openaiClient = new OpenAIApiClient(options.openaiApiKey, this.debug);
    }
  }

  /**
   * Call API with automatic fallback between providers
   */
  async call(options: CallOptions): Promise<Response> {
    const { messages, model, streaming = false, temperature, provider } = options;
    const selectedModel = model || '@cf/meta/llama-3.1-8b-instruct';
    const useOpenAI = (provider || this.providerPreference) === 'openai';

    return withRetry(async () => {
      if (useOpenAI && this.openaiClient) {
        return this.openaiClient.call({
          model: selectedModel,
          messages,
          streaming,
          temperature
        });
      }

      try {
        return await this.callCloudflareWithFallback({
          model: selectedModel,
          messages,
          streaming,
          temperature
        });
      } catch (error) {
        // Fallback to OpenAI if available and not an auth error
        if (!(error instanceof HttpError && (error.status === 401 || error.status === 403))
            && this.openaiClient) {
          return this.openaiClient.call({
            model: this.openaiModel,
            messages,
            streaming,
            temperature
          });
        }
        throw error;
      }
    }, {
      maxRetries: this.maxRetries,
      debug: this.debug
    });
  }

  /**
   * Call Cloudflare API with model fallback
   */
  private async callCloudflareWithFallback(options: {
    model: string;
    messages: Message[];
    streaming: boolean;
    temperature?: number;
  }): Promise<Response> {
    const { model: primaryModel, messages, streaming, temperature } = options;

    // Reasonable fallbacks known to be widely available
    const fallbacks = [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.1-70b-instruct',
      '@cf/openchat/openchat-3.5-1210'
    ];

    const tried = new Set<string>();
    const modelsToTry = [primaryModel, ...fallbacks].filter(m => {
      if (!m || tried.has(m)) return false;
      tried.add(m);
      return true;
    });

    let lastError: any;

    for (const model of modelsToTry) {
      try {
        return await this.cloudflareClient.call({
          model,
          messages,
          streaming,
          temperature
        });
      } catch (error) {
        lastError = error;

        if (this.debug) {
          console.warn(`[EdgePilot] Model ${model} failed:`, error);
        }

        // Don't fall back on auth errors
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          throw error;
        }

        // Continue to next model
      }
    }

    throw lastError;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    const providers = ['cloudflare'];
    if (this.openaiClient) {
      providers.push('openai');
    }
    return providers;
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: string): boolean {
    return this.getAvailableProviders().includes(provider.toLowerCase());
  }
}