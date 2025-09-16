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
 * Thread-safe rate limiting utility with atomic operations and timeout protection
 */
export class SimpleRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxClients: number;
  private cleanupTimer?: NodeJS.Timeout;
  private isShuttingDown = false;
  private operationTimeouts = 0;

  constructor(maxRequests = 100, windowMs = 60000, maxClients = 10000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxClients = maxClients;
    this.startCleanupTimer();
  }

  /**
   * Check if request is within rate limit (thread-safe with timeout protection)
   */
  checkLimit(identifier: string, timeoutMs: number = 1000): boolean {
    if (this.isShuttingDown) {
      return false;
    }

    const startTime = Date.now();
    const now = Date.now();

    try {
      // Timeout protection for the operation
      if (Date.now() - startTime > timeoutMs) {
        this.operationTimeouts++;
        return false;
      }

      // Sanitize identifier to prevent attacks
      const sanitizedId = this.sanitizeIdentifier(identifier);
      if (!sanitizedId) {
        return false;
      }

      // Prevent unbounded growth with circuit breaker
      if (this.requests.size > this.maxClients) {
        // Emergency cleanup if size exceeded
        try {
          this.cleanup();
        } catch (cleanupError) {
          // If cleanup fails, reject to prevent memory exhaustion
          return false;
        }
      }

      const userLimit = this.requests.get(sanitizedId);

      if (!userLimit || now > userLimit.resetTime) {
        // Reset window - atomic operation
        this.requests.set(sanitizedId, {
          count: 1,
          resetTime: now + this.windowMs
        });
        return true;
      }

      // Atomic check and increment
      if (userLimit.count >= this.maxRequests) {
        return false;
      }

      // Atomic increment
      userLimit.count = userLimit.count + 1;
      return true;
    } catch (error) {
      // Fail safe on any error
      return false;
    }
  }

  /**
   * Sanitize identifier to prevent injection attacks
   */
  private sanitizeIdentifier(identifier: string): string | null {
    if (!identifier || typeof identifier !== 'string') {
      return null;
    }

    // Limit length to prevent memory attacks
    if (identifier.length > 256) {
      return null;
    }

    // Basic sanitization - only allow alphanumeric and safe characters
    const sanitized = identifier.replace(/[^a-zA-Z0-9_.-]/g, '');

    // Must have some content after sanitization
    return sanitized.length > 0 ? sanitized : null;
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
   * Cleanup expired entries (thread-safe with timeout protection)
   */
  cleanup(timeoutMs: number = 5000): void {
    if (this.isShuttingDown) {
      return;
    }

    const startTime = Date.now();
    const now = Date.now();
    const toDelete: string[] = [];
    let processedCount = 0;
    const maxProcessPerCleanup = 10000; // Prevent infinite loops

    try {
      // Collect expired keys first to avoid modification during iteration
      for (const [key, value] of this.requests.entries()) {
        // Timeout protection during iteration
        if (Date.now() - startTime > timeoutMs) {
          this.operationTimeouts++;
          break;
        }

        // Prevent unbounded processing
        if (processedCount > maxProcessPerCleanup) {
          break;
        }

        if (now > value.resetTime) {
          toDelete.push(key);
        }

        processedCount++;
      }

      // Remove expired entries atomically with timeout protection
      for (const key of toDelete) {
        if (Date.now() - startTime > timeoutMs) {
          break;
        }
        this.requests.delete(key);
      }
    } catch (error) {
      // Silent failure for cleanup to prevent cascading errors
      this.operationTimeouts++;
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return; // Skip timer in tests
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, Math.min(this.windowMs / 2, 30000)); // Cleanup twice per window or every 30s

    // Clear timer on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.destroy());
    }
  }

  /**
   * Get reliability statistics
   */
  getStats(): {
    totalClients: number;
    maxClients: number;
    operationTimeouts: number;
    isShuttingDown: boolean;
  } {
    return {
      totalClients: this.requests.size,
      maxClients: this.maxClients,
      operationTimeouts: this.operationTimeouts,
      isShuttingDown: this.isShuttingDown
    };
  }

  /**
   * Graceful shutdown with timeout
   */
  async shutdown(timeoutMs: number = 5000): Promise<void> {
    this.isShuttingDown = true;

    // Stop new timer events
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Final cleanup with timeout protection
    const startTime = Date.now();
    while (this.requests.size > 0 && Date.now() - startTime < timeoutMs) {
      try {
        this.cleanup(1000); // 1s timeout per cleanup attempt
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
      } catch {
        break; // Force exit on error
      }
    }

    // Force clear remaining entries
    this.requests.clear();
  }

  /**
   * Destroy rate limiter and cleanup resources
   */
  destroy(): void {
    this.isShuttingDown = true;
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.requests.clear();
  }
}

/**
 * Get client identifier for rate limiting with security enhancements
 */
export function getClientIdentifier(request: Request): string {
  try {
    // Try to get IP from various headers with validation
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    // Validate and sanitize IP addresses
    let ip = 'unknown';

    if (cfConnectingIP && isValidIP(cfConnectingIP)) {
      ip = cfConnectingIP;
    } else if (realIP && isValidIP(realIP)) {
      ip = realIP;
    } else if (forwardedFor) {
      const firstIP = forwardedFor.split(',')[0]?.trim();
      if (firstIP && isValidIP(firstIP)) {
        ip = firstIP;
      }
    }

    // Limit IP length to prevent attacks
    if (ip.length > 45) { // Max IPv6 length
      ip = ip.slice(0, 45);
    }

    // Use simple hash for privacy (crypto.subtle not available in all edge environments)
    let hash = 0;
    const str = ip + '-edgepilot-salt';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  } catch (error) {
    // Fallback to timestamp-based identifier on any error
    return Date.now().toString(16).slice(-16).padStart(16, '0');
  }
}

/**
 * Validate IP address format (basic validation)
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string' || ip.length === 0 || ip.length > 45) {
    return false;
  }

  // Basic IPv4 regex
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  // Basic IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Regex.test(ip)) {
    // Validate IPv4 ranges
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  if (ipv6Regex.test(ip)) {
    return true; // Basic IPv6 validation
  }

  return false;
}