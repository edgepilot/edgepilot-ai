import {
  validateModelName,
  validateMessages,
  validateTemperature,
  ALLOWED_MODELS,
  HttpError
} from '../validation';

describe('Validation Module', () => {
  describe('validateModelName', () => {
    it('should accept allowed Cloudflare models', () => {
      const model = '@cf/meta/llama-3.1-8b-instruct';
      expect(validateModelName(model)).toBe(model);
    });

    it('should accept allowed OpenAI models', () => {
      const model = 'gpt-3.5-turbo';
      expect(validateModelName(model)).toBe(model);
    });

    it('should reject models not in allowlist', () => {
      expect(() => {
        validateModelName('@cf/../../../etc/passwd');
      }).toThrow(HttpError);
    });

    it('should reject path traversal attempts', () => {
      expect(() => {
        validateModelName('@cf/meta/../../../sensitive');
      }).toThrow('not in the allowed models list');
    });

    it('should return undefined for null/undefined input', () => {
      expect(validateModelName(null)).toBeUndefined();
      expect(validateModelName(undefined)).toBeUndefined();
    });

    it('should reject non-string input', () => {
      expect(() => {
        validateModelName(123);
      }).toThrow('Model must be a string');
    });
  });

  describe('validateMessages', () => {
    it('should accept valid message array', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];
      const result = validateMessages(messages);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'system', content: 'You are helpful' });
    });

    it('should reject non-array input', () => {
      expect(() => {
        validateMessages('not an array');
      }).toThrow('Messages must be an array');
    });

    it('should reject empty array', () => {
      expect(() => {
        validateMessages([]);
      }).toThrow('Messages array cannot be empty');
    });

    it('should reject too many messages', () => {
      const tooMany = Array(101).fill({ role: 'user', content: 'test' });
      expect(() => {
        validateMessages(tooMany);
      }).toThrow('Too many messages');
    });

    it('should sanitize control characters', () => {
      const messages = [
        { role: 'user', content: 'Hello\x00World\x1F' }
      ];
      const result = validateMessages(messages);
      expect(result[0].content).toBe('HelloWorld');
    });
  });

  describe('validateTemperature', () => {
    it('should accept valid temperature', () => {
      expect(validateTemperature(0.7)).toBe(0.7);
      expect(validateTemperature(0)).toBe(0);
      expect(validateTemperature(2)).toBe(2);
    });

    it('should return undefined for null/undefined', () => {
      expect(validateTemperature(null)).toBeUndefined();
      expect(validateTemperature(undefined)).toBeUndefined();
    });

    it('should reject non-numeric input', () => {
      expect(() => {
        validateTemperature('not a number');
      }).toThrow('Temperature must be a number');
    });

    it('should reject out of range values', () => {
      expect(() => {
        validateTemperature(-0.1);
      }).toThrow('Temperature must be between 0 and 2');

      expect(() => {
        validateTemperature(2.1);
      }).toThrow('Temperature must be between 0 and 2');
    });
  });

  describe('ALLOWED_MODELS', () => {
    it('should include popular Cloudflare models', () => {
      expect(ALLOWED_MODELS).toContain('@cf/meta/llama-3.1-8b-instruct');
      expect(ALLOWED_MODELS).toContain('@cf/mistral/mistral-7b-instruct-v0.2');
    });

    it('should include OpenAI models', () => {
      expect(ALLOWED_MODELS).toContain('gpt-3.5-turbo');
      expect(ALLOWED_MODELS).toContain('gpt-4');
    });

    it('should not contain path traversal patterns', () => {
      ALLOWED_MODELS.forEach(model => {
        expect(model).not.toContain('../');
        expect(model).not.toContain('..\\');
      });
    });
  });
});