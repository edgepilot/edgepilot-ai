
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ModelSelector from '../components/demo/ModelSelector';
import ConfigurationStatus from '../components/demo/ConfigurationStatus';
import { CopilotTextarea } from '@copilotkit/react-textarea';

export default function Page() {
  const [model, setModel] = useState('@cf/meta/llama-3.1-70b-instruct');
  const [isConfigured, setIsConfigured] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [textContent, setTextContent] = useState('');

  // Check if environment is configured
  const checkEnvConfig = () => {
    fetch('/api/copilotedge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
    }).then(res => {
      setIsConfigured(res.ok || res.status !== 500);
    }).catch(() => setIsConfigured(false));
  };

  useEffect(() => {
    checkEnvConfig();
  }, []);

  const models = [
    { id: 'gpt-oss-120b', name: 'GPT-OSS-120B (Best Quality)', description: 'OpenAI open-source 120B parameters' },
    { id: 'gpt-oss-20b', name: 'GPT-OSS-20B (Fast)', description: 'OpenAI open-source 20B parameters' },
    { id: '@cf/meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: "Meta's latest 70B model" },
    { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Fast, lightweight 8B model' },
    { id: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B', description: 'Efficient 7B model' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold">CopilotEdge</span>
                <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400">Starter</span>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="#setup" className="text-gray-400 hover:text-white transition-colors">Setup</Link>
                <Link href="#demo" className="text-gray-400 hover:text-white transition-colors">Demo</Link>
                <Link href="#code" className="text-gray-400 hover:text-white transition-colors">Code</Link>
                <Link href="/showcase" className="text-gray-400 hover:text-white transition-colors">Showcase</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              Welcome to CopilotEdge
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Build AI-powered applications with Cloudflare Workers AI. 
              This starter will guide you through setup and show you what's possible.
            </p>
          </div>

          {/* Configuration Status */}
          {!isConfigured ? (
            <div className="max-w-2xl mx-auto mb-12 p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-red-500 mt-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 mb-2">Configuration Required</h3>
                  <p className="text-red-300 text-sm">
                    CopilotEdge needs your Cloudflare credentials to work. Follow the setup guide below.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto mb-12 p-6 bg-green-900/20 border border-green-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-green-500 mt-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-400 mb-2">Ready to Go!</h3>
                  <p className="text-green-300 text-sm">
                    Your environment is configured correctly. Try the demos below.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Setup Guide */}
      <section id="setup" className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Quick Setup Guide</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Get CopilotEdge running in 3 simple steps
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className={`p-6 rounded-lg border ${setupStep >= 1 ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-900/20 border-gray-800'}`}>
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${setupStep >= 1 ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gray-800'}`}>
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">Get Your Cloudflare Credentials</h3>
                  <p className="text-gray-400 mb-4">
                    You'll need a Cloudflare API token and Account ID to use Workers AI.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm mb-4">
                    <li>Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="https://dash.cloudflare.com/profile/api-tokens" className="text-blue-400 hover:underline">Cloudflare Dashboard</a></li>
                    <li>Create a new API token with "Workers AI" permissions</li>
                    <li>Copy your Account ID from the dashboard sidebar</li>
                  </ol>
                  <button 
                    onClick={() => setSetupStep(2)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all"
                  >
                    I have my credentials
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-6 rounded-lg border ${setupStep >= 2 ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-900/20 border-gray-800'}`}>
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${setupStep >= 2 ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gray-800'}`}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">Add Environment Variables</h3>
                  <p className="text-gray-400 mb-4">
                    Create a <code className="px-2 py-1 bg-gray-800 rounded text-sm">.env.local</code> file in your project root:
                  </p>
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4">
                    <pre className="text-sm text-gray-300">
{`CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id-here`}
                    </pre>
                  </div>
                  <button 
                    onClick={() => {
                      setSetupStep(3);
                      checkEnvConfig();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all"
                  >
                    I've added the variables
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-6 rounded-lg border ${setupStep >= 3 ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-900/20 border-gray-800'}`}>
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${setupStep >= 3 ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gray-800'}`}>
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">Test Your Setup</h3>
                  <p className="text-gray-400 mb-4">
                    Restart your development server and check the status indicator above.
                  </p>
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4">
                    <pre className="text-sm text-gray-300">
{`# Restart your dev server
npm run dev
# or
pnpm dev`}
                    </pre>
                  </div>
                  {isConfigured ? (
                    <div className="flex items-center space-x-2 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Setup complete! Try the demos below.</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Configuration not detected. Check your environment variables.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Try It Out</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Experiment with different models and features
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Model Selection */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 text-sm">🤖</span>
                Select AI Model
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Choose from various models available on Cloudflare Workers AI
              </p>
              <ModelSelector 
                selectedModel={model}
                onModelChange={setModel}
              />
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Currently selected:</p>
                <code className="text-sm text-gray-300">{model}</code>
              </div>
            </div>

            {/* AI Textarea */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3 text-sm">✨</span>
                AI-Enhanced Textarea
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Type something and press <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Cmd+K</kbd> for AI suggestions
              </p>
              <CopilotTextarea
                className="w-full min-h-[150px] p-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600"
                value={textContent}
                onValueChange={setTextContent}
                placeholder="Start typing and press Cmd+K (or Ctrl+K) for AI assistance..."
                autosuggestionsConfig={{    
                  textareaPurpose: "General writing assistance",
                  chatApiConfigs: {},
                }}
              />
            </div>
          </div>

          {/* Chat Popup Info */}
          <div className="mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3 text-sm">💬</span>
              Chat Popup
            </h3>
            <p className="text-gray-400 mb-4">
              Click the chat icon in the bottom-right corner to open the AI assistant. 
              It uses the model you selected above and runs entirely on Cloudflare Workers.
            </p>
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>The chat popup is configured in your layout.tsx file</span>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section id="code" className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Implementation Guide</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Copy these examples to build your own AI features
          </p>

          <div className="space-y-8">
            {/* API Route */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">1. Create Your API Route</h3>
              <p className="text-gray-400 mb-4">
                Create <code className="px-2 py-1 bg-gray-800 rounded text-sm">app/api/copilotedge/route.ts</code>:
              </p>
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-800">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-xs text-gray-500">route.ts</span>
                </div>
                <pre className="p-6 text-sm overflow-x-auto">
                  <code className="text-gray-300">
{`import { createCopilotEdgeHandler } from 'copilotedge';

export const POST = createCopilotEdgeHandler({
  model: '@cf/meta/llama-3.1-70b-instruct',
  cache: true,
  debug: true,
  rateLimit: { 
    requests: 100, 
    windowMs: 60000 
  }
});`}
                  </code>
                </pre>
              </div>
            </div>

            {/* Layout Setup */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">2. Setup Your Layout</h3>
              <p className="text-gray-400 mb-4">
                Wrap your app with CopilotKit in <code className="px-2 py-1 bg-gray-800 rounded text-sm">app/layout.tsx</code>:
              </p>
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-800">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-xs text-gray-500">layout.tsx</span>
                </div>
                <pre className="p-6 text-sm overflow-x-auto">
                  <code className="text-gray-300">
{`import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotedge">
          {children}
          <CopilotPopup 
            instructions="You are a helpful AI assistant."
            defaultOpen={false}
            labels={{
              title: "AI Assistant",
              initial: "Hi! How can I help you today?"
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}`}
                  </code>
                </pre>
              </div>
            </div>

            {/* Component Usage */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">3. Use AI Components</h3>
              <p className="text-gray-400 mb-4">
                Add AI-powered features to your components:
              </p>
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-800">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="ml-4 text-xs text-gray-500">MyComponent.tsx</span>
                </div>
                <pre className="p-6 text-sm overflow-x-auto">
                  <code className="text-gray-300">
{`import { CopilotTextarea } from '@copilotkit/react-textarea';
import { useCopilotAction } from '@copilotkit/react-core';

export function MyComponent() {
  const [text, setText] = useState('');

  // Register a custom action
  useCopilotAction({
    name: "generateIdeas",
    description: "Generate creative ideas",
    parameters: [
      {
        name: "topic",
        type: "string",
        description: "The topic to generate ideas for",
        required: true,
      }
    ],
    handler: async ({ topic }) => {
      // Your custom logic here
      return \`Generated ideas for: \${topic}\`;
    },
  });

  return (
    <CopilotTextarea
      value={text}
      onValueChange={setText}
      placeholder="Type here..."
      autosuggestionsConfig={{
        textareaPurpose: "Creative writing",
        chatApiConfigs: {
          suggestionsApiConfig: {
            model: "@cf/meta/llama-3.1-70b-instruct"
          }
        }
      }}
    />
  );
}`}
                  </code>
                </pre>
              </div>
            </div>

            {/* Configuration Options */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">4. Configuration Options</h3>
              <p className="text-gray-400 mb-4">
                CopilotEdge supports many configuration options:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h4 className="font-semibold mb-3">Handler Options</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><code className="text-gray-300">model</code> - AI model to use</li>
                    <li><code className="text-gray-300">cache</code> - Enable response caching</li>
                    <li><code className="text-gray-300">debug</code> - Show debug logs</li>
                    <li><code className="text-gray-300">rateLimit</code> - Request limiting</li>
                    <li><code className="text-gray-300">maxTokens</code> - Max response length</li>
                    <li><code className="text-gray-300">temperature</code> - Response creativity</li>
                  </ul>
                </div>
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h4 className="font-semibold mb-3">Available Models</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {models.slice(0, 5).map(m => (
                      <li key={m.id}>
                        <code className="text-gray-300">{m.id}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-xl text-gray-400 mb-8">
            You now have everything you need to create AI-powered applications
          </p>
          <div className="flex items-center justify-center space-x-4">
            {/* <a 
              href="/showcase"
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all"
            >
              View Showcase
            </a>
            <a 
              href="https://github.com"
              className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              View on GitHub
            </a> */}
          </div>
        </div>
      </section>
    </div>
  );
}