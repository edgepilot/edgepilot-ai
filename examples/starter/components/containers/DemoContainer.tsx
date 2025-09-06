'use client';

import React from 'react';
import { DemoSection } from '../sections/DemoSection';
import { useHomePageStore } from '../../stores/useHomePageStore';
import { models } from '../../data/models';

export function DemoContainer() {
  const { 
    selectedModel, 
    setSelectedModel, 
    textContent, 
    setTextContent 
  } = useHomePageStore();
  
  return (
    <DemoSection
      models={models}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      textContent={textContent}
      onTextChange={setTextContent}
    />
  );
}