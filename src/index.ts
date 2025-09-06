// Original exports for backward compatibility
export { createNextHandler } from './next';
export { createFetchHandler } from './fetch';

// Register the Cloudflare driver on import
import './driver';

