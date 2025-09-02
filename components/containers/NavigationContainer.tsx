'use client';

import React from 'react';
import { Navigation } from '../layout/Navigation';
import { useConfigStatus } from '../../hooks/useConfigStatus';
import { navigationLinks } from '../../data/navigation';

export function NavigationContainer() {
  const { isConfigured, isChecking } = useConfigStatus();
  
  const StatusBadge = () => {
    if (isChecking) {
      return (
        <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 rounded-full text-xs">
          Checking...
        </span>
      );
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${
        isConfigured 
          ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
          : 'bg-red-900/30 text-red-400 border border-red-500/30'
      }`}>
        {isConfigured ? 'Configured' : 'Not Configured'}
      </span>
    );
  };
  
  return (
    <Navigation 
      logoText="CopilotEdge"
      badgeText="Starter"
      links={navigationLinks}
      statusBadge={<StatusBadge />}
    />
  );
}