import React from 'react';
import CopyButton from '../../components/ui/CopyButton';
import Link from 'next/link';

export default function Page() {

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-black focus:px-3 focus:py-1 focus:rounded"
      >
        Skip to content
      </a>

      {/* Header / Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <nav aria-label="Primary">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                  <span className="text-xl font-bold">Edgecraft</span>
                </div>
                <ul className="hidden md:flex items-center gap-6" role="list">
                  <li>
                    <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                <Link
                      href="/showcase"
                      aria-current="page"
                      className="text-white font-medium border-b border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      Showcase
                    </Link>
                  </li>
                  <li>
                    <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">
                      Features
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/#demo" className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-pink-600/20 opacity-50" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse motion-reduce:animate-none" />
              <span className="text-sm text-gray-300">Edgecraft + Cloudflare Workers AI</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              The AI copilot
              <br />
              for your app
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Build intelligent applications with Edgecraft’s local components + Cloudflare Workers AI,
              delivering fast, scalable AI experiences at the edge.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a href="/#demo" className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all">
                Start Building
              </a>
              <a href="/" className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">
                View Demo
              </a>
            </div>
          </div>

          {/* Code Preview */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-xs text-gray-500">api/ai/chat/route.ts</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">TypeScript</span>
                  <CopyButton
                    text={`import { createNextHandler } from '@edgecraft/copilotkit-workers-ai';\n\nexport const runtime = 'edge';\n\nexport const POST = createNextHandler({\n  apiKey: process.env.CLOUDFLARE_API_TOKEN,\n  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,\n  model: '@cf/meta/llama-3.1-70b-instruct',\n  stream: true,\n  cache: false,\n});`}
                  />
                </div>
              </div>
              <pre className="p-6 text-sm overflow-x-auto">
                <code className="language-typescript text-gray-300">
{`import { createNextHandler } from '@edgecraft/copilotkit-workers-ai';

export const runtime = 'edge';

export const POST = createNextHandler({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  model: '@cf/meta/llama-3.1-70b-instruct',
  stream: true,
  cache: false,
});`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why developers love Edgecraft</h2>
            <p className="text-xl text-gray-400">Everything you need to build AI-powered applications</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-4 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Powered by Cloudflare's global edge network for ultra-low latency AI responses</p>
            </div>

            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Models</h3>
              <p className="text-gray-400">Choose from Llama, Mistral, GPT-OSS and more. Switch models with a single line</p>
            </div>

            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mb-4 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Built-in Security</h3>
              <p className="text-gray-400">Rate limiting, caching, and authentication out of the box</p>
            </div>

            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mb-4 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">React Components</h3>
              <p className="text-gray-400">Pre-built UI components like CopilotPopup and CopilotTextarea</p>
            </div>

            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg mb-4 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">TypeScript First</h3>
              <p className="text-gray-400">Full TypeScript support with autocompletion and type safety</p>
            </div>

            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg mb-4 flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable</h3>
              <p className="text-gray-400">Style components to match your brand with full control over the UI</p>
            </div>
          </div>
        </div>
      </section>
      </main>


      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold">CopilotEdge</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered applications at the edge
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm" role="list">
                 <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm" role="list">
                 <li><Link href="/" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/#code" className="hover:text-white transition-colors">Examples</Link></li> 
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm" role="list">
                 <li><Link href="/" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Contact</Link></li> 
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CopilotEdge. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
             <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                <svg aria-hidden="true" focusable="false" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a> 
               <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 hover:text-white transition-colors">
                <svg aria-hidden="true" focusable="false" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a> 
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import React from "react";
import Link from "next/link";

export default function Page() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-black px-3 py-2 rounded-md"
      >
        Skip to content
      </a>

      {/* Header / Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <nav aria-label="Primary" className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md">
                <span aria-hidden className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold">Edgecraft</span>
              </Link>
              <ul className="hidden md:flex items-center space-x-6" role="list">
                {/* Example real links */}
                <li><Link href="#features" className="text-gray-300 hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="text-gray-300 hover:text-white">Docs</Link></li>
              </ul>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/start"
                className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main id="main">
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-pink-600/20 opacity-50" />
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700 mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse motion-reduce:animate-none" aria-hidden />
                <span className="text-sm text-gray-300">Edgecraft + Cloudflare Workers AI</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                The AI copilot
                <br />
                for your app
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Build intelligent applications with Edgecraft’s local components + Cloudflare Workers AI,
                delivering fast, scalable AI experiences at the edge.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/#demo"
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Start Building
                </Link>
                <Link
                  href="/demo"
                  className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  View Demo
                </Link>
              </div>
            </div>

            {/* Code Preview */}
            <div className="mt-20 max-w-4xl mx-auto">
              <figure className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <figcaption className="flex items-center space-x-2 px-4 py-3 border-b border-gray-800">
                  <span aria-hidden className="w-3 h-3 bg-red-500 rounded-full" />
                  <span aria-hidden className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span aria-hidden className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-xs text-gray-500">api/ai/chat/route.ts</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(codeSample).catch(() => {})}
                    className="ml-auto text-xs text-gray-300 border border-gray-700 px-2 py-0.5 rounded hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Copy
                  </button>
                </figcaption>
                <pre className="p-6 text-sm overflow-x-auto" aria-label="TypeScript example">
                  <code className="text-gray-300 whitespace-pre">{codeSample}</code>
                </pre>
              </figure>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why developers love Edgecraft</h2>
              <p className="text-xl text-gray-400">Everything you need to build AI-powered applications</p>
            </div>

            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f) => (
                <li key={f.title} className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className={`w-12 h-12 ${f.bg} rounded-lg mb-4 flex items-center justify-center`}>
                    {/* decorative icon */}
                    <svg aria-hidden="true" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.path} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-400">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span aria-hidden className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold">Edgecraft</span>
              </div>
              <p className="text-gray-400 text-sm">AI-powered applications at the edge</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/examples" className="hover:text-white transition-colors">Examples</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex items-center justify-between">
            <p className="text-gray-400 text-sm">© {year} Edgecraft. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a aria-label="Twitter" href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883..."/></svg>
              </a>
              <a aria-label="GitHub" href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626..."/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const codeSample = `import { createNextHandler } from '@edgecraft/copilotkit-workers-ai';

export const runtime = 'edge';

export const POST = createNextHandler({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  model: '@cf/meta/llama-3.1-70b-instruct',
  stream: true,
  cache: false,
});`;

const features = [
  { title: "Lightning Fast", desc: "Powered by Cloudflare's global edge network for ultra-low latency AI responses", bg: "bg-gradient-to-br from-blue-500 to-cyan-500", path: "M13 10V3L4 14h7v7l9-11h-7z" },
  { title: "Multiple Models", desc: "Choose from Llama, Mistral, GPT-OSS and more. Switch models with a single line", bg: "bg-gradient-to-br from-purple-500 to-pink-500", path: "M12 6V4m0 2a2 2..." },
  { title: "Built-in Security", desc: "Rate limiting, caching, and authentication out of the box", bg: "bg-gradient-to-br from-green-500 to-emerald-500", path: "M9 12l2 2 4-4m5.618-4.016A11.955..." },
  { title: "React Components", desc: "Pre-built UI components like CopilotPopup and CopilotTextarea", bg: "bg-gradient-to-br from-orange-500 to-red-500", path: "M4 5a1 1 0 011-1h14a1 1 0 011 1..." },
  { title: "TypeScript First", desc: "Full TypeScript support with autocompletion and type safety", bg: "bg-gradient-to-br from-indigo-500 to-blue-500", path: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { title: "Customizable", desc: "Style components to match your brand with full control over the UI", bg: "bg-gradient-to-br from-yellow-500 to-orange-500", path: "M7 21a4 4 0 01-4-4V5a2 2..." },
];
import React from "react";
import Link from "next/link";

export default function Page() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-black px-3 py-2 rounded-md"
      >
        Skip to content
      </a>

      {/* Header / Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <nav aria-label="Primary" className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md">
                <span aria-hidden className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold">Edgecraft</span>
              </Link>
              <ul className="hidden md:flex items-center space-x-6">
                {/* Example real links */}
                <li><Link href="#features" className="text-gray-300 hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="text-gray-300 hover:text-white">Docs</Link></li>
              </ul>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/start"
                className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main id="main">
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-pink-600/20 opacity-50" />
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700 mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse motion-reduce:animate-none" aria-hidden />
                <span className="text-sm text-gray-300">Edgecraft + Cloudflare Workers AI</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                The AI copilot
                <br />
                for your app
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Build intelligent applications with Edgecraft’s local components + Cloudflare Workers AI,
                delivering fast, scalable AI experiences at the edge.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/#demo"
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Start Building
                </Link>
                <Link
                  href="/demo"
                  className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  View Demo
                </Link>
              </div>
            </div>

            {/* Code Preview */}
            <div className="mt-20 max-w-4xl mx-auto">
              <figure className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <figcaption className="flex items-center space-x-2 px-4 py-3 border-b border-gray-800">
                  <span aria-hidden className="w-3 h-3 bg-red-500 rounded-full" />
                  <span aria-hidden className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span aria-hidden className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-xs text-gray-500">api/ai/chat/route.ts</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(codeSample).catch(() => {})}
                    className="ml-auto text-xs text-gray-300 border border-gray-700 px-2 py-0.5 rounded hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Copy
                  </button>
                </figcaption>
                <pre className="p-6 text-sm overflow-x-auto" aria-label="TypeScript example">
                  <code className="text-gray-300 whitespace-pre">{codeSample}</code>
                </pre>
              </figure>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why developers love Edgecraft</h2>
              <p className="text-xl text-gray-400">Everything you need to build AI-powered applications</p>
            </div>

            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f) => (
                <li key={f.title} className="p-6 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className={`w-12 h-12 ${f.bg} rounded-lg mb-4 flex items-center justify-center`}>
                    {/* decorative icon */}
                    <svg aria-hidden="true" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.path} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-400">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span aria-hidden className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold">Edgecraft</span>
              </div>
              <p className="text-gray-400 text-sm">AI-powered applications at the edge</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/examples" className="hover:text-white transition-colors">Examples</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex items-center justify-between">
            <p className="text-gray-400 text-sm">© {year} Edgecraft. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a aria-label="Twitter" href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883..."/></svg>
              </a>
              <a aria-label="GitHub" href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626..."/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const codeSample = `import { createNextHandler } from '@edgecraft/copilotkit-workers-ai';

export const runtime = 'edge';

export const POST = createNextHandler({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  model: '@cf/meta/llama-3.1-70b-instruct',
  stream: true,
  cache: false,
});`;

const features = [
  { title: "Lightning Fast", desc: "Powered by Cloudflare's global edge network for ultra-low latency AI responses", bg: "bg-gradient-to-br from-blue-500 to-cyan-500", path: "M13 10V3L4 14h7v7l9-11h-7z" },
  { title: "Multiple Models", desc: "Choose from Llama, Mistral, GPT-OSS and more. Switch models with a single line", bg: "bg-gradient-to-br from-purple-500 to-pink-500", path: "M12 6V4m0 2a2 2..." },
  { title: "Built-in Security", desc: "Rate limiting, caching, and authentication out of the box", bg: "bg-gradient-to-br from-green-500 to-emerald-500", path: "M9 12l2 2 4-4m5.618-4.016A11.955..." },
  { title: "React Components", desc: "Pre-built UI components like CopilotPopup and CopilotTextarea", bg: "bg-gradient-to-br from-orange-500 to-red-500", path: "M4 5a1 1 0 011-1h14a1 1 0 011 1..." },
  { title: "TypeScript First", desc: "Full TypeScript support with autocompletion and type safety", bg: "bg-gradient-to-br from-indigo-500 to-blue-500", path: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { title: "Customizable", desc: "Style components to match your brand with full control over the UI", bg: "bg-gradient-to-br from-yellow-500 to-orange-500", path: "M7 21a4 4 0 01-4-4V5a2 2..." },
];
