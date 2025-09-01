import { createCopilotEdgeHandler } from 'copilotedge';

// Enhanced CopilotEdge handler with comprehensive configuration
export const POST = createCopilotEdgeHandler({
  // Primary model - high quality for best results
  model: process.env.COPILOT_MODEL || '@cf/meta/llama-3.1-70b-instruct',
  
  // Enable debug logging in development
  debug: process.env.NODE_ENV === 'development' || process.env.COPILOT_DEBUG === 'true',
  
  // Cache responses for 2 minutes to reduce costs and improve performance
  cacheTimeout: parseInt(process.env.COPILOT_CACHE_TIMEOUT || '120000'),
  
  // Rate limiting: 100 requests per minute per IP
  rateLimit: parseInt(process.env.COPILOT_RATE_LIMIT || '100'),
});