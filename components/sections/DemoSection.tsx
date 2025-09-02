'use client';

import React from 'react';
import EdgeTextarea from '../ui/EdgeTextarea';
import ModelSelector from '../demo/ModelSelector';

interface Model {
  id: string;
  name: string;
  description: string;
}

interface DemoSectionProps {
  title?: string;
  subtitle?: string;
  models: Model[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  textContent: string;
  onTextChange: (text: string) => void;
  modelSelectorTitle?: string;
  modelSelectorDescription?: string;
  textareaTitle?: string;
  textareaDescription?: string;
  textareaPlaceholder?: string;
  chatPopupTitle?: string;
  chatPopupDescription?: string;
  chatPopupInfo?: string;
}

export function DemoSection({ 
  title = "Try It Out",
  subtitle = "Experiment with different models and features",
  models,
  selectedModel,
  onModelChange,
  textContent,
  onTextChange,
  modelSelectorTitle = "Select AI Model",
  modelSelectorDescription = "Choose from various models available on Cloudflare Workers AI",
  textareaTitle = "AI-Enhanced Textarea",
  textareaDescription = "Type something and press",
  textareaPlaceholder = "Start typing and press Cmd+K (or Ctrl+K) for AI assistance...",
  chatPopupTitle = "Chat Popup",
  chatPopupDescription = "Click the chat icon in the bottom-right corner to open the AI assistant. It uses the model you selected above and runs entirely on Cloudflare Workers.",
  chatPopupInfo = "The chat popup is configured in your layout.tsx file"
}: DemoSectionProps) {
  return (
    <section id="demo" className="py-20 px-6 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-4 text-center">{title}</h2>
        <p className="text-xl text-gray-400 text-center mb-12">{subtitle}</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Model Selection */}
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 text-sm">
                🤖
              </span>
              {modelSelectorTitle}
            </h3>
            <p className="text-gray-400 mb-4 text-sm">
              {modelSelectorDescription}
            </p>
            <ModelSelector 
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Currently selected:</p>
              <code className="text-sm text-gray-300">{selectedModel}</code>
            </div>
          </div>

          {/* AI Textarea */}
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3 text-sm">
                ✨
              </span>
              {textareaTitle}
            </h3>
            <p className="text-gray-400 mb-4 text-sm">
              {textareaDescription} <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Cmd+K</kbd> for AI suggestions
            </p>
            <EdgeTextarea
              className="w-full min-h-[150px] p-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600"
              value={textContent}
              onChange={onTextChange}
              placeholder={textareaPlaceholder}
            />
          </div>
        </div>

        {/* Chat Popup Info */}
        <div className="mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3 text-sm">
              💬
            </span>
            {chatPopupTitle}
          </h3>
          <p className="text-gray-400 mb-4">
            {chatPopupDescription}
          </p>
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{chatPopupInfo}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
