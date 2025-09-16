/**
 * Retry utilities with exponential backoff and configurable options
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  debug?: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  debug: false
};

/**
 * Executes a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );

      if (config.debug) {
        console.debug(
          `[EdgePilot] Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`,
          { error: error instanceof Error ? error.message : String(error) }
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker state for advanced retry patterns
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 30000,
    private debug = false
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
        if (this.debug) {
          console.debug('[EdgePilot] Circuit breaker moving to half-open state');
        }
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();

      // Success - reset circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        if (this.debug) {
          console.debug('[EdgePilot] Circuit breaker closed after successful operation');
        }
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
        if (this.debug) {
          console.debug(
            `[EdgePilot] Circuit breaker opened after ${this.failures} failures`
          );
        }
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}