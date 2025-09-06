import React from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  isConfigured: boolean;
  configStatus?: {
    success: {
      title: string;
      description: string;
    };
    error: {
      title: string;
      description: string;
    };
  };
}

export function HeroSection({ 
  title,
  subtitle,
  isConfigured,
  configStatus = {
    success: {
      title: "Ready to Go!",
      description: "Your environment is configured correctly. Try the demos below."
    },
    error: {
      title: "Configuration Required",
      description: "EdgePilot needs your Cloudflare credentials to work. Follow the setup guide below."
    }
  }
}: HeroSectionProps) {
  const status = isConfigured ? configStatus.success : configStatus.error;
  const statusStyles = isConfigured 
    ? {
        container: 'bg-green-900/20 border-green-500/50',
        icon: 'text-green-500',
        title: 'text-green-400',
        description: 'text-green-300'
      }
    : {
        container: 'bg-red-900/20 border-red-500/50',
        icon: 'text-red-500',
        title: 'text-red-400',
        description: 'text-red-300'
      };

  return (
    <section className="relative pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className={`max-w-2xl mx-auto mb-12 p-6 border rounded-lg ${statusStyles.container}`}>
          <div className="flex items-start space-x-3">
            <div className={`mt-1 ${statusStyles.icon}`}>
              <svg aria-hidden="true" focusable="false" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isConfigured 
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  }
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${statusStyles.title}`}>
                {status.title}
              </h3>
              <p className={`text-sm ${statusStyles.description}`}>
                {status.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
