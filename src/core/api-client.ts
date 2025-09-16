import { Message, HttpError } from './types';

export interface ApiClientOptions {
  apiKey: string;
  accountId: string;
  debug?: boolean;
  timeout?: number;
}

export interface CallOptions {
  model: string;
  messages: Message[];
  streaming?: boolean;
  temperature?: number;
}

/**
 * Centralized API client for Cloudflare Workers AI
 */
export class CloudflareApiClient {
  private apiKey: string;
  private accountId: string;
  private debug: boolean;
  private timeout: number;

  constructor(options: ApiClientOptions) {
    this.apiKey = options.apiKey;
    this.accountId = options.accountId;
    this.debug = options.debug ?? false;
    this.timeout = options.timeout ?? 30000; // 30 second default timeout
  }

  private getEndpoint(model: string): string {
    return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/v1/chat/completions`;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;

    // Read error for server-side debugging only
    try {
      const errTxt = await response.text();
      if (this.debug) {
        console.error('[EdgePilot] Cloudflare API error:', status, errTxt?.slice(0, 500));
      }
    } catch {}

    if (status === 401 || status === 403) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (status === 429) {
      throw new HttpError(429, 'Rate limit exceeded');
    }
    throw new HttpError(503, 'Service unavailable');
  }

  async call(options: CallOptions): Promise<Response> {
    const endpoint = this.getEndpoint(options.model);
    const headers = this.getHeaders();

    const body = {
      model: options.model,
      messages: options.messages,
      stream: options.streaming ?? false,
      ...(typeof options.temperature === 'number' ? { temperature: options.temperature } : {})
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout', `Cloudflare API request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

/**
 * Centralized API client for OpenAI
 */
export class OpenAIApiClient {
  private apiKey: string;
  private debug: boolean;
  private timeout: number;

  constructor(apiKey: string, debug: boolean = false, timeout: number = 30000) {
    this.apiKey = apiKey;
    this.debug = debug;
    this.timeout = timeout;
  }

  private getEndpoint(): string {
    return 'https://api.openai.com/v1/chat/completions';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;

    try {
      const txt = await response.text();
      if (this.debug) {
        console.error('[EdgePilot] OpenAI error:', status, txt?.slice(0, 500));
      }
    } catch {}

    if (status === 401 || status === 403) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (status === 429) {
      throw new HttpError(429, 'Rate limit exceeded');
    }
    throw new HttpError(503, 'Service unavailable');
  }

  async call(options: CallOptions): Promise<Response> {
    if (!this.apiKey) {
      throw new HttpError(503, 'Service unavailable');
    }

    const endpoint = this.getEndpoint();
    const headers = this.getHeaders();

    const body = {
      model: options.model,
      messages: options.messages,
      stream: options.streaming ?? false,
      ...(typeof options.temperature === 'number' ? { temperature: options.temperature } : {})
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout', `OpenAI API request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}