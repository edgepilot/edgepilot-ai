import { Config } from './types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  model: '@cf/meta/llama-3.1-8b-instruct',
  stream: true,
  cache: false,
  maxRetries: 3,
  debug: false
} as const;

/**
 * Resolves configuration from user input and environment variables
 */
export function resolveConfig(userConfig: Config = {}): Required<Config> {
  return {
    apiKey: userConfig.apiKey || process.env.CLOUDFLARE_API_TOKEN || '',
    accountId: userConfig.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '',
    model: userConfig.model || DEFAULT_CONFIG.model,
    stream: userConfig.stream ?? DEFAULT_CONFIG.stream,
    cache: userConfig.cache ?? DEFAULT_CONFIG.cache,
    maxRetries: userConfig.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    debug: userConfig.debug ?? (process.env.NODE_ENV !== 'production')
  };
}

/**
 * Validates that required configuration is present
 */
export function validateConfig(config: Required<Config>): void {
  if (!config.apiKey) {
    throw new Error('API key required: set CLOUDFLARE_API_TOKEN environment variable or pass apiKey in config');
  }
  if (!config.accountId) {
    throw new Error('Account ID required: set CLOUDFLARE_ACCOUNT_ID environment variable or pass accountId in config');
  }
}

/**
 * Gets provider preference from environment
 */
export function getProviderPreference(): string {
  return (process.env.EDGEPILOT_PROVIDER || 'cloudflare').toLowerCase();
}

/**
 * Gets OpenAI configuration from environment
 */
export function getOpenAIConfig(): { apiKey: string; model: string } {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  };
}