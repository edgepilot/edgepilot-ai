import { Message, HttpError } from './types';

/**
 * Security constants for input validation
 */
export const SECURITY_LIMITS = {
  MAX_MESSAGE_LENGTH: 10_000,
  MAX_MESSAGES_COUNT: 100,
  MAX_MODEL_NAME_LENGTH: 100,
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2
} as const;

/**
 * Sanitizes and validates a string input
 */
export function sanitizeString(input: unknown, maxLength: number = SECURITY_LIMITS.MAX_MESSAGE_LENGTH): string {
  if (typeof input !== 'string') {
    throw new HttpError(400, 'Invalid request', 'Expected string input');
  }

  // Remove null bytes and control characters except newlines/tabs
  const sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  if (sanitized.length > maxLength) {
    return sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Validates and sanitizes message content
 */
export function validateMessage(msg: unknown, index: number): Message {
  if (!msg || typeof msg !== 'object') {
    throw new HttpError(400, 'Invalid request', `Message at index ${index} must be an object`);
  }

  const message = msg as any;

  // Validate role
  if (!message.role || typeof message.role !== 'string') {
    throw new HttpError(400, 'Invalid request', `Message at index ${index} missing valid role`);
  }

  const validRoles = ['system', 'user', 'assistant'];
  const role = message.role.toLowerCase().trim();

  if (!validRoles.includes(role) && role.length > 20) {
    throw new HttpError(400, 'Invalid request', `Message at index ${index} has invalid role`);
  }

  // Validate content
  if (!message.content) {
    throw new HttpError(400, 'Invalid request', `Message at index ${index} missing content`);
  }

  const content = sanitizeString(message.content, SECURITY_LIMITS.MAX_MESSAGE_LENGTH);

  return { role, content };
}

/**
 * Validates an array of messages
 */
export function validateMessages(messages: unknown): Message[] {
  if (!Array.isArray(messages)) {
    throw new HttpError(400, 'Invalid request', 'Messages must be an array');
  }

  if (messages.length === 0) {
    throw new HttpError(400, 'Invalid request', 'Messages array cannot be empty');
  }

  if (messages.length > SECURITY_LIMITS.MAX_MESSAGES_COUNT) {
    throw new HttpError(400, 'Invalid request', `Too many messages (max ${SECURITY_LIMITS.MAX_MESSAGES_COUNT})`);
  }

  return messages.map((msg, index) => validateMessage(msg, index));
}

/**
 * Validates model name
 */
export function validateModelName(model: unknown): string | undefined {
  if (model === undefined || model === null) {
    return undefined;
  }

  if (typeof model !== 'string') {
    throw new HttpError(400, 'Invalid request', 'Model must be a string');
  }

  const sanitized = sanitizeString(model, SECURITY_LIMITS.MAX_MODEL_NAME_LENGTH);

  // Basic model name validation - should start with @ for Cloudflare models
  if (sanitized.length > 0 && !sanitized.match(/^[@a-zA-Z0-9\/_\-\.]+$/)) {
    throw new HttpError(400, 'Invalid request', 'Invalid model name format');
  }

  return sanitized;
}

/**
 * Validates temperature parameter
 */
export function validateTemperature(temperature: unknown): number | undefined {
  if (temperature === undefined || temperature === null) {
    return undefined;
  }

  const temp = Number(temperature);

  if (isNaN(temp)) {
    throw new HttpError(400, 'Invalid request', 'Temperature must be a number');
  }

  if (temp < SECURITY_LIMITS.MIN_TEMPERATURE || temp > SECURITY_LIMITS.MAX_TEMPERATURE) {
    throw new HttpError(400, 'Invalid request', `Temperature must be between ${SECURITY_LIMITS.MIN_TEMPERATURE} and ${SECURITY_LIMITS.MAX_TEMPERATURE}`);
  }

  return temp;
}

/**
 * Validates provider name
 */
export function validateProvider(provider: unknown): string | undefined {
  if (provider === undefined || provider === null) {
    return undefined;
  }

  if (typeof provider !== 'string') {
    throw new HttpError(400, 'Invalid request', 'Provider must be a string');
  }

  const sanitized = provider.toLowerCase().trim();
  const validProviders = ['cloudflare', 'openai'];

  if (!validProviders.includes(sanitized)) {
    throw new HttpError(400, 'Invalid request', 'Invalid provider');
  }

  return sanitized;
}

/**
 * Validates request body structure and sanitizes all inputs
 */
export function validateRequestBody(body: unknown): {
  messages: Message[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  provider?: string;
} {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Invalid request', 'Request body must be an object');
  }

  const request = body as any;

  // Extract and validate messages - check multiple possible locations
  let messages: unknown;

  if (request.messages) {
    messages = request.messages;
  } else if (request.query && request.variables?.messages) {
    // GraphQL-style request
    messages = request.variables.messages;
  } else {
    throw new HttpError(400, 'Invalid request', 'No messages found in request');
  }

  return {
    messages: validateMessages(messages),
    stream: typeof request.stream === 'boolean' ? request.stream : undefined,
    model: validateModelName(request.model),
    temperature: validateTemperature(request.temperature),
    provider: validateProvider(request.provider)
  };
}