'use client';

import React from 'react';
import { SetupGuide } from '../sections/SetupGuide';
import { useConfigStatus } from '../../hooks/useConfigStatus';
import { useHomePageStore } from '../../stores/useHomePageStore';
import { setupSteps } from '../../data/setupSteps';

export function SetupContainer() {
  const { isConfigured, details, refetch } = useConfigStatus();
  const { currentSetupStep, setSetupStep } = useHomePageStore();
  
  const handleStepChange = (step: number) => {
    // Check config when moving to step 3
    if (step === 3) {
      refetch();
    }
    setSetupStep(step);
  };
  
  return (
    <SetupGuide
      steps={setupSteps}
      currentStep={currentSetupStep}
      onStepChange={handleStepChange}
      onCheckConfig={() => refetch()}
      isConfigured={isConfigured}
      missingEnvVars={details?.missing || []}
    />
  );
}