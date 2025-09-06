'use client';

import React from 'react';
import { HeroSection } from '../sections/HeroSection';
import { useConfigStatus } from '../../hooks/useConfigStatus';

export function HeroContainer() {
  const { isConfigured } = useConfigStatus();
  
  return (
    <HeroSection
      title="Welcome to EdgePilot"
      subtitle="Build AI-powered applications with Cloudflare Workers AI. This starter will guide you through setup and show you what's possible."
      isConfigured={isConfigured}
    />
  );
}