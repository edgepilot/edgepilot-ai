'use client';

import React from 'react';
import { Navigation } from '../layout/Navigation';
import { useConfigStatus } from '../../hooks/useConfigStatus';
import { ConfigStatusBadge } from '../ui/ConfigStatusBadge';
import { navigationLinks } from '../../data/navigation';

export function NavigationContainer() {
  const { status } = useConfigStatus();
  
  return (
    <Navigation 
      logoText="EdgePilot"
      badgeText="Starter"
      links={navigationLinks}
      statusBadge={<ConfigStatusBadge status={status} />}
    />
  );
}