'use client';

import { useState } from 'react';

interface Model {
  id: string;
  name: string;
  description: string;
  category: 'openai' | 'meta' | 'mistral';
  parameters: string;
  speed: 'fast' | 'medium' | 'slow';
}

const models: Model[] = [
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS-120B',
    description: 'OpenAI open-source 120B parameters - highest quality',
    category: 'openai',
    parameters: '120B',
    speed: 'slow'
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT-OSS-20B',
    description: 'OpenAI open-source 20B parameters - good balance',
    category: 'openai',
    parameters: '20B',
    speed: 'medium'
  },
  {
    id: '@cf/meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: "Meta's latest 70B model with improved reasoning",
    category: 'meta',
    parameters: '70B',
    speed: 'medium'
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    description: 'Fast, lightweight 8B model for quick responses',
    category: 'meta',
    parameters: '8B',
    speed: 'fast'
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    name: 'Mistral 7B',
    description: 'Efficient 7B model optimized for instruction following',
    category: 'mistral',
    parameters: '7B',
    speed: 'fast'
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedModelData = models.find(m => m.id === selectedModel);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'openai': return 'bg-green-100 text-green-800 border-green-200';
      case 'meta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mistral': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSpeedBadge = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'slow': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">{selectedModelData?.name}</div>
          <div className="text-sm text-gray-500">{selectedModelData?.parameters}</div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(selectedModelData?.category || 'openai')}`}>
          {selectedModelData?.category.toUpperCase()}
        </div>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    model.id === selectedModel ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    </div>
                    <div className="flex flex-col space-y-1 ml-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(model.category)}`}>
                        {model.category.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSpeedBadge(model.speed)}`}>
                        {model.speed.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Parameters: {model.parameters}</span>
                    {model.id === selectedModel && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}