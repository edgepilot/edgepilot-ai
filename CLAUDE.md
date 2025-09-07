# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **edgepilot-ai** package.

## PROJECT STATUS: Ready to Publish! 🚀

Claude Code has successfully refactored this into a single npm package. The structure is now optimized for a solo developer to maintain and ship.

## Current Structure

```
edgepilot/                      # Main package root
├── src/                        # All source code (consolidated)
│   ├── index.ts               # Main exports
│   ├── next.ts                # Next.js handler
│   ├── fetch.ts               # Fetch handler
│   ├── driver.ts              # Cloudflare driver
│   └── core/                  # Core functionality
├── dist/                       # Built package (TypeScript output)
├── examples/
│   └── starter/               # Demo Next.js app
│       ├── package.json       # Separate package.json for demo
│       └── [demo app files]
├── package.json               # Single package.json for edgepilot-ai
├── tsconfig.json
└── README.md
```

## Key Commands

```bash
# Package Development
pnpm build        # Build the package (compiles TypeScript to dist/)
pnpm dev          # Watch mode for development
pnpm clean        # Clean dist directory

# Testing with Example
cd examples/starter
pnpm dev         # Run the demo app to test the package
pnpm build       # Build the demo app

# Publishing
npm publish      # Publish to npm (from root)
```

## What This Package Does

**edgepilot-ai** provides Cloudflare Workers AI integration for Next.js and React apps:
- Zero cold-start AI at the edge
- Reduces AI costs by using Cloudflare's edge network
- Provides streaming, caching, and automatic retries
- Works with any Cloudflare Workers AI model
- Drop-in integration for Next.js 13.4+ with App Router

## Environment Variables

Required for the package to work:
```
CLOUDFLARE_API_TOKEN=your-api-token  # Cloudflare API token with Workers AI permissions
CLOUDFLARE_ACCOUNT_ID=your-account   # Cloudflare account ID
```

## Pre-Publish Checklist

Before running `npm publish`, verify:

### 1. Package.json Essentials
- [x] Name: `edgepilot-ai`
- [x] Version: `0.1.0`
- [x] Description is clear
- [x] Main and types point to dist/
- [x] Files array includes dist/ and README.md
- [x] Keywords include relevant terms
- [ ] Repository URL is updated
- [ ] Author name is set

### 2. README.md Must Have
- [x] Clear value proposition
- [x] Installation instructions
- [x] Basic usage example
- [x] Environment variables documented
- [x] Link to examples

### 3. Quick Tests
```bash
# 1. Build works
pnpm build

# 2. Example still works
cd examples/starter
pnpm dev
# Test the chat functionality

# 3. Package looks right
cd ../..
npm pack --dry-run  # See what will be published
```

### 4. Version Strategy
- Start with `0.1.0` (not 1.0.0) - sets expectations
- Use semantic versioning going forward
- Don't worry about perfection for 0.1.0

## Publishing Steps

```bash
# 1. Make sure you're logged in to npm
npm login

# 2. Do a dry run first
npm publish --dry-run

# 3. If everything looks good, publish!
npm publish

# 4. Verify it worked
npm view edgepilot-ai
```

## Available AI Models

The package supports multiple Cloudflare Workers AI models:
- `@cf/meta/llama-3.3-70b-instruct` - Meta's latest 70B
- `@cf/meta/llama-3.1-8b-instruct` - Fast lightweight 8B
- `@cf/mistral/mistral-7b-instruct-v0.2` - Efficient 7B
- And many more...

## What NOT to Do Before Publishing

**DO NOT**:
- Add more features
- Refactor working code
- Wait for perfect documentation
- Add complex CI/CD
- Worry about edge cases
- Second-guess the single package structure
- Try to make it a monorepo again

**DO**:
- Ship v0.1.0 TODAY
- Add the npm badge to your GitHub README after publishing
- Tweet about it
- Fix issues in v0.1.1 based on real feedback

## Post-Publish Tasks

After publishing v0.1.0:
1. Create GitHub release with same version tag
2. Share in relevant communities (Reddit r/reactjs, Twitter, Discord)
3. Write a simple blog post about edge AI and cost savings
4. Start collecting real user feedback

## For Future Claude Sessions

When working on updates:
- This is a SINGLE package (not a monorepo)
- The refactoring is DONE - don't suggest restructuring
- Focus on features and bug fixes, not architecture
- Keep the solo developer perspective
- Ship small updates frequently (0.1.1, 0.1.2, etc.)

## Success Metrics

v0.1.0 is successful if:
- ✅ It publishes to npm without errors
- ✅ Someone can install and use it
- ✅ The example app demonstrates it works
- ✅ You've told people it exists

That's it. Everything else is iteration.

## API Reference

### `createNextHandler(options)`

Creates a Next.js API route handler for AI chat endpoints.

```typescript
import { createNextHandler } from 'edgepilot-ai/next';

export const runtime = 'edge';

const handler = createNextHandler({
  model: '@cf/meta/llama-3.1-8b-instruct',
  stream: true,
  cache: false,
  debug: false
});

export const POST = handler;
```

## Remember

- You've already built something valuable (zero cold-start AI!)
- The hard refactoring work is DONE
- Perfect is the enemy of shipped
- Version 0.1.0 means "early but useful"
- You can always release 0.1.1 tomorrow

## The One Command That Matters

```bash
npm publish
```

Run it. Today. Now. The world needs zero cold-start AI at the edge.

---

**Note to Claude Code**: The refactoring is complete. Help with publishing, documentation, and feature additions - not restructuring. This is a working single package ready to ship.