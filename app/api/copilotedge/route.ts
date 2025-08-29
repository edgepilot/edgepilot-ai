import { createCopilotEdgeHandler } from 'copilotedge';

// Enhanced CopilotEdge handler with comprehensive configuration
export const POST = createCopilotEdgeHandler({
  // Primary model - high quality for best results
  model: process.env.COPILOT_MODEL || '@cf/meta/llama-3.1-70b-instruct',
  
  // Fallback model - faster, smaller model for when primary fails
  fallback: '@cf/meta/llama-3.1-8b-instruct',
  
  // Enable debug logging in development
  debug: process.env.NODE_ENV === 'development' || process.env.COPILOT_DEBUG === 'true',
  
  // Cache responses for 2 minutes to reduce costs and improve performance
  cacheTimeout: parseInt(process.env.COPILOT_CACHE_TIMEOUT || '120000'),
  
  // Retry failed requests up to 5 times with exponential backoff
  maxRetries: 5,
  
  // Rate limiting: 100 requests per minute per IP
  rateLimit: parseInt(process.env.COPILOT_RATE_LIMIT || '100'),
  
  // Optional: Custom headers for additional security
  headers: {
    'X-Powered-By': 'CopilotEdge',
    'X-Model': process.env.COPILOT_MODEL || '@cf/meta/llama-3.1-70b-instruct',
  },
  
  // Error handling and monitoring
  onError: (error, req) => {
    console.error('CopilotEdge Error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Request logging for monitoring
  onRequest: (req) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CopilotEdge Request:', {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
      });
    }
  },
});