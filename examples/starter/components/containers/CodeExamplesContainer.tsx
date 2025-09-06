'use client';

import React from 'react';
import { CodeExamples } from '../sections/CodeExamples';
import { codeExamples, handlerOptions } from '../../data/codeExamples';
import { models } from '../../data/models';

export function CodeExamplesContainer() {
  const availableModels = models.slice(0, 5).map(m => ({ 
    name: m.id, 
    description: m.name 
  }));
  
  return (
    <CodeExamples
      examples={codeExamples}
      handlerOptions={handlerOptions}
      availableModels={availableModels}
    />
  );
}