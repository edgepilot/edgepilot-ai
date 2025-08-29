"use client";

import React, { useState } from 'react';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import ModelSelector from '../components/demo/ModelSelector';
import ConfigurationStatus from '../components/demo/ConfigurationStatus';

export default function Page() {
  const [model, setModel] = useState('@cf/meta/llama-3.1-70b-instruct');
  const [textContent, setTextContent] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

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

  React.useEffect(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CE</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CopilotEdge Starter</h1>
                <p className="text-sm text-gray-500">AI-powered with Cloudflare Workers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="min-w-[200px]">
                <ModelSelector 
                  selectedModel={model}
                  onModelChange={setModel}
                />
              </div>
              
              <ConfigurationStatus onStatusChange={setIsConfigured} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Setup Warning */}
        {!isConfigured && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-amber-500 mt-1">⚠️</div>
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Environment Setup Required</h3>
                <p className="text-amber-700 mb-3">Add your Cloudflare credentials to get started:</p>
                <div className="bg-amber-100 p-3 rounded font-mono text-sm text-amber-800 mb-3">
                  <div>CLOUDFLARE_API_TOKEN=your-token-here</div>
                  <div>CLOUDFLARE_ACCOUNT_ID=your-account-id</div>
                </div>
                <p className="text-sm text-amber-600">
                  Get credentials at: <a href="https://dash.cloudflare.com/profile/api-tokens" 
                  className="underline hover:no-underline" target="_blank">Cloudflare Dashboard</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Chat Popup Demo */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600 text-sm">💬</span>
              Chat Popup
            </h2>
            <p className="text-gray-600 mb-4">
              Click the chat icon in the bottom-right corner to open the AI assistant. 
              It&apos;s powered by CopilotEdge running on Cloudflare Workers AI.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm text-gray-700">
                &lt;CopilotPopup instructions=&quot;...&quot; defaultOpen=&#123;true&#125; /&gt;
              </code>
            </div>
          </div>

          {/* AI Textarea Demo */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-sm">✨</span>
              AI-Enhanced Textarea
            </h2>
            <p className="text-gray-600 mb-4">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+K</kbd> or 
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">Ctrl+K</kbd> for AI suggestions
            </p>
            <CopilotTextarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={textContent}
              onValueChange={setTextContent}
              placeholder="Type something and press Cmd+K for AI assistance..."
              autosuggestionsConfig={{
                textareaPurpose: "General writing assistance",
                chatApiConfigs: {},
              }}
            />
          </div>
        </div>

        {/* Model Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 text-purple-600 text-sm">🤖</span>
            Available Models
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => (
              <div 
                key={m.id} 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  model === m.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setModel(m.id)}
              >
                <h3 className="font-medium text-gray-900 mb-1">{m.name}</h3>
                <p className="text-sm text-gray-600">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 text-indigo-600 text-sm">📝</span>
            Quick Start
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">1. Install Dependencies</h3>
              <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                <code className="text-green-400 text-sm">
                  pnpm add @copilotkit/react-core @copilotkit/react-ui copilotedge
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Create API Route</h3>
              <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code className="text-gray-300">
{`import { createCopilotEdgeHandler } from 'copilotedge';

export const POST = createCopilotEdgeHandler({
  model: '@cf/meta/llama-3.1-70b-instruct',
  debug: true,
  cacheTimeout: 120000,
  rateLimit: 100,
});`}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Add to Layout</h3>
              <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code className="text-gray-300">
{`import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';

export default function Layout({ children }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotedge">
      {children}
      <CopilotPopup instructions="You are helpful!" />
    </CopilotKit>
  );
}`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}