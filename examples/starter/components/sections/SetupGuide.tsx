'use client';

import React from 'react';

interface SetupStep {
  title: string;
  description: string;
  instructions?: string[];
  code?: string;
  buttonText: string;
}

interface SetupGuideProps {
  title?: string;
  subtitle?: string;
  steps: SetupStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onCheckConfig?: () => void;
  isConfigured?: boolean;
  missingEnvVars?: string[];
}

export function SetupGuide({ 
  title = "Quick Setup Guide",
  subtitle = "Get EdgePilot running in 3 simple steps",
  steps,
  currentStep,
  onStepChange,
  onCheckConfig,
  isConfigured = false,
  missingEnvVars = []
}: SetupGuideProps) {
  const handleButtonClick = (stepNumber: number) => {
    if (stepNumber === 2 && onCheckConfig) {
      onCheckConfig();
    }
    onStepChange(stepNumber + 1);
  };

  return (
    <section id="setup" className="py-20 px-6 border-t border-gray-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-4 text-center">{title}</h2>
        <p className="text-xl text-gray-400 text-center mb-12">{subtitle}</p>

        <div className="space-y-8">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep >= stepNumber;
            const isLastStep = stepNumber === steps.length;

            return (
              <div 
                key={stepNumber}
                className={`p-6 rounded-lg border ${
                  isActive ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-900/20 border-gray-800'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isActive ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gray-800'
                  }`}>
                    {stepNumber}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-gray-400 mb-4">{step.description}</p>
                    
                    {step.instructions && (
                      <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm mb-4">
                        {step.instructions.map((instruction, i) => (
                          <li key={i} dangerouslySetInnerHTML={{ __html: instruction }} />
                        ))}
                      </ol>
                    )}
                    
                    {step.code && (
                      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4">
                        <pre className="text-sm text-gray-300">{step.code}</pre>
                      </div>
                    )}
                    
                    {!isLastStep && (
                      <button 
                        onClick={() => handleButtonClick(stepNumber)}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all"
                      >
                        {step.buttonText}
                      </button>
                    )}
                    
                    {isLastStep && (
                      <>
                        <button 
                          onClick={() => handleButtonClick(stepNumber)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all mb-4"
                        >
                          {step.buttonText}
                        </button>
                        {isConfigured ? (
                          <div className="flex items-center space-x-2 text-green-400">
                            <svg aria-hidden="true" focusable="false" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Setup complete! Try the demos below.</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-yellow-400">
                              <svg aria-hidden="true" focusable="false" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Configuration not detected. Check your environment variables.</span>
                            </div>
                            {missingEnvVars.length > 0 && (
                              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mt-2">
                                <p className="text-red-400 text-sm font-semibold mb-1">Missing environment variables:</p>
                                <ul className="list-disc list-inside text-red-300 text-sm">
                                  {missingEnvVars.map((envVar) => (
                                    <li key={envVar}>{envVar}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
