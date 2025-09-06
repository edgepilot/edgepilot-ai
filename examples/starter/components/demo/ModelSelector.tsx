"use client";

import { useMemo, useState } from 'react';
import { models as baseModels } from '../../data/models';

type Category = 'openai' | 'meta' | 'mistral' | 'other';
type Speed = 'fast' | 'medium' | 'slow';

interface ModelEx {
  id: string;
  name: string;
  description: string;
  category: Category;
  parameters: string;
  speed: Speed;
}

// Heuristics to enrich bare models from data/models.ts
function deriveModel(m: { id: string; name: string; description: string }): ModelEx {
  const id = m.id;
  const name = m.name;
  const description = m.description;
  let category: Category = 'other';
  if (id.startsWith('gpt-oss')) category = 'openai';
  else if (id.includes('@cf/meta')) category = 'meta';
  else if (id.includes('mistral')) category = 'mistral';
  const paramMatch = id.match(/(\d+\.?\d*)[bB]/) || name.match(/(\d+\.?\d*)[bB]/i);
  const parameters = paramMatch?.[1] ? `${paramMatch[1].toUpperCase()}B` : '';
  const speed: Speed = parameters === '8B' || parameters === '7B' ? 'fast' : parameters.includes('120') ? 'slow' : 'medium';
  return { id, name, description, category, parameters, speed };
}

const curated: ModelEx[] = [
  deriveModel({ id: '@cf/meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: "Meta's latest 70B model with improved reasoning" }),
  deriveModel({ id: '@cf/meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'High quality 70B instruction-tuned' }),
  deriveModel({ id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Fast, lightweight 8B model for quick responses' }),
  deriveModel({ id: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B', description: 'Efficient 7B model optimized for instruction following' }),
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Single source of truth: base models enriched + curated overrides
  const models = useMemo<ModelEx[]>(() => {
    const enriched = baseModels.map(deriveModel);
    const map = new Map<string, ModelEx>(enriched.map(m => [m.id, m]));
    curated.forEach(m => map.set(m.id, m));
    return Array.from(map.values());
  }, []);

  const selectedModelData = models.find(m => m.id === selectedModel);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'openai': return 'bg-green-900/50 text-green-400 border-green-700';
      case 'meta': return 'bg-blue-900/50 text-blue-400 border-blue-700';
      case 'mistral': return 'bg-purple-900/50 text-purple-400 border-purple-700';
      default: return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  const getSpeedBadge = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'slow': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
      >
        <div className="flex-1 text-left">
          <div className="font-medium text-white">{selectedModelData?.name || (selectedModel || 'Select a model')}</div>
          <div className="text-sm text-gray-400">{selectedModelData?.parameters || (selectedModelData ? '' : '—')}</div>
        </div>
        {selectedModelData ? (
          <div className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(selectedModelData.category)}`}>
            {selectedModelData.category.toUpperCase()}
          </div>
        ) : (
          <div className="px-2 py-1 rounded text-xs font-medium border bg-gray-800 text-gray-400 border-gray-700">
            MODEL
          </div>
        )}
        <svg aria-hidden="true" focusable="false" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen ? (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
            role="button"
            tabIndex={0}
            aria-label="Close dropdown" />
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors text-white ${
                    model.id === selectedModel ? 'bg-blue-900/50 border border-blue-700' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white">{model.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{model.description}</p>
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
                      <svg aria-hidden="true" focusable="false" className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
