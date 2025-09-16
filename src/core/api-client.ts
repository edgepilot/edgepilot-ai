import { Message, HttpError } from './types';

export interface ApiClientOptions {
  apiKey: string;
  accountId: string;
  debug?: boolean;
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

  constructor(options: ApiClientOptions) {
    this.apiKey = options.apiKey;
    this.accountId = options.accountId;
    this.debug = options.debug ?? false;
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response;
  }
}

/**
 * Centralized API client for OpenAI
 */
export class OpenAIApiClient {
  private apiKey: string;
  private debug: boolean;

  constructor(apiKey: string, debug: boolean = false) {
    this.apiKey = apiKey;
    this.debug = debug;
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response;
  }
}