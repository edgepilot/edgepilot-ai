# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-15

### Added
- Initial release of EdgePilot AI package
- Next.js 13.4+ App Router support with `createNextHandler()`
- Cloudflare Workers support with `createFetchHandler()`
- Streaming support with Server-Sent Events
- Support for 25+ Cloudflare Workers AI models
- Automatic retry logic with exponential backoff
- Response caching with LRU eviction and memory management
- Rate limiting with per-client isolation
- TypeScript support with full type definitions
- Comprehensive input validation and sanitization
- Thread-safe cache operations with operation queue
- Timeout protection for all network operations

### Security
- Model allowlist validation to prevent path traversal
- API key and token redaction in debug logs
- IP hashing for privacy in rate limiting
- Input sanitization for all user inputs
- Memory-safe operations with bounded limits

### Documentation
- Comprehensive README with setup instructions
- JSDoc comments for all public APIs
- Example Next.js starter application
- Environment variable documentation
- Cloudflare credential setup guide

---

## Future Releases

### [0.2.0] - Planned
- Circuit breaker for provider failures
- Health check endpoint
- Prometheus metrics export
- Additional provider support (Anthropic, Cohere)
- Request/response middleware system

### [0.3.0] - Planned
- OpenTelemetry tracing support
- Advanced caching strategies
- WebSocket support for real-time chat
- Multi-modal support (images, audio)
- Edge function deployment templates

---

For more information, see the [README](README.md) or visit our [documentation](https://github.com/edgepilot/edgepilot-ai).