'use client';

import { useState, useEffect } from 'react';

interface ConfigurationStatusProps {
  onStatusChange?: (isConfigured: boolean) => void;
}

interface EnvironmentStatus {
  hasApiToken: boolean;
  hasAccountId: boolean;
  isApiReachable: boolean;
  lastChecked?: Date;
  error?: string;
}

export default function ConfigurationStatus({ onStatusChange }: ConfigurationStatusProps) {
  const [status, setStatus] = useState<EnvironmentStatus>({
    hasApiToken: false,
    hasAccountId: false,
    isApiReachable: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkConfiguration = async () => {
    setIsLoading(true);
    try {
      // Check if API endpoint responds
      const response = await fetch('/api/copilotedge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'ping' }],
          stream: false 
        })
      });

      const newStatus: EnvironmentStatus = {
        hasApiToken: true, // If we get any response, tokens are likely configured
        hasAccountId: true,
        isApiReachable: response.ok || response.status === 429, // 429 = rate limited but working
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      };

      // If we get a 500, it's likely a configuration issue
      if (response.status === 500) {
        newStatus.hasApiToken = false;
        newStatus.hasAccountId = false;
        newStatus.error = 'Configuration error - check environment variables';
      }

      setStatus(newStatus);
      onStatusChange?.(newStatus.isApiReachable && newStatus.hasApiToken && newStatus.hasAccountId);
    } catch (error) {
      const newStatus: EnvironmentStatus = {
        hasApiToken: false,
        hasAccountId: false,
        isApiReachable: false,
        lastChecked: new Date(),
        error: 'Network error'
      };
      setStatus(newStatus);
      onStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConfiguration();
    // Check every 30 seconds
    const interval = setInterval(checkConfiguration, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isLoading) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (status.isApiReachable && status.hasApiToken && status.hasAccountId) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = () => {
    if (isLoading) return '⏳';
    if (status.isApiReachable && status.hasApiToken && status.hasAccountId) return '✅';
    return '❌';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (status.isApiReachable && status.hasApiToken && status.hasAccountId) {
      return 'Ready';
    }
    return 'Setup Required';
  };

  return (
    <div className="space-y-3">
      <div className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center space-x-2 ${getStatusColor()}`}>
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {status.lastChecked && (
          <span className="text-xs opacity-75">
            (checked {status.lastChecked.toLocaleTimeString()})
          </span>
        )}
      </div>
      
      {!isLoading && (
        <div className="text-xs space-y-1">
          <div className={`flex items-center space-x-2 ${status.hasApiToken ? 'text-green-600' : 'text-red-600'}`}>
            <span>{status.hasApiToken ? '✓' : '✗'}</span>
            <span>API Token</span>
          </div>
          <div className={`flex items-center space-x-2 ${status.hasAccountId ? 'text-green-600' : 'text-red-600'}`}>
            <span>{status.hasAccountId ? '✓' : '✗'}</span>
            <span>Account ID</span>
          </div>
          <div className={`flex items-center space-x-2 ${status.isApiReachable ? 'text-green-600' : 'text-red-600'}`}>
            <span>{status.isApiReachable ? '✓' : '✗'}</span>
            <span>API Reachable</span>
          </div>
        </div>
      )}

      {status.error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          Error: {status.error}
        </div>
      )}

      <button
        onClick={checkConfiguration}
        disabled={isLoading}
        className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
      >
        {isLoading ? 'Checking...' : 'Check Again'}
      </button>
    </div>
  );
}