import { HttpError } from './types';

/**
 * Security utilities for protecting sensitive data
 */

/**
 * Redacts sensitive information from strings for logging
 */
export function redactSensitiveData(input: string): string {
  return input
    .replace(/([A-Za-z0-9+/]{20,})/g, (match) => {
      // Redact what looks like API keys or tokens
      if (match.length > 20) {
        return match.slice(0, 4) + '*'.repeat(match.length - 8) + match.slice(-4);
      }
      return match;
    })
    .replace(/(Bearer\s+)([A-Za-z0-9._-]+)/gi, '$1***')
    .replace(/(api[_-]?key[s]?['":]?\s*['":]?\s*)([A-Za-z0-9._-]+)/gi, '$1***')
    .replace(/(token[s]?['":]?\s*['":]?\s*)([A-Za-z0-9._-]+)/gi, '$1***');
}

/**
 * Securely logs debug information by redacting sensitive data
 */
export function secureLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'production') {
    return; // No debug logging in production
  }

  const redactedMessage = redactSensitiveData(message);

  if (data) {
    const redactedData = typeof data === 'string'
      ? redactSensitiveData(data)
      : JSON.stringify(data, (key, value) => {
          if (typeof value === 'string' && (
            key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret')
          )) {
            return redactSensitiveData(value);
          }
          return value;
        });

    console.debug(`[EdgePilot] ${redactedMessage}`, redactedData);
  } else {
    console.debug(`[EdgePilot] ${redactedMessage}`);
  }
}

/**
 * Validates environment variables are properly set
 */
export function validateEnvironmentSecurity(): void {
  const warnings: string[] = [];

  // Check if we're in development with placeholder values
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (apiToken && (
    apiToken.includes('your-') ||
    apiToken.includes('placeholder') ||
    apiToken.length < 20
  )) {
    warnings.push('CLOUDFLARE_API_TOKEN appears to be a placeholder value');
  }

  if (accountId && (
    accountId.includes('your-') ||
    accountId.includes('placeholder') ||
    accountId.length < 32
  )) {
    warnings.push('CLOUDFLARE_ACCOUNT_ID appears to be a placeholder value');
  }

  // Check for leaked credentials in development
  if (process.env.NODE_ENV !== 'production') {
    if (apiToken && console.warn) {
      warnings.forEach(warning => console.warn(`[EdgePilot Security] ${warning}`));
    }
  }
}

/**
 * Rate limiting utility (simple in-memory implementation)
 */
export class SimpleRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute by default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const userLimit = this.requests.get(identifier);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (userLimit.count >= this.maxRequests) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Get rate limit status
   */
  getStatus(identifier: string): { remaining: number; resetTime: number } {
    const userLimit = this.requests.get(identifier);
    const now = Date.now();

    if (!userLimit || now > userLimit.resetTime) {
      return { remaining: this.maxRequests, resetTime: now + this.windowMs };
    }

    return {
      remaining: Math.max(0, this.maxRequests - userLimit.count),
      resetTime: userLimit.resetTime
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIP || realIP || forwardedFor?.split(',')[0]?.trim() || 'unknown';

  // Hash the IP for privacy in logs
  const buffer = new TextEncoder().encode(ip);
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}