import React from 'react';
import Link from 'next/link';

interface NavigationProps {
  logoText?: string;
  badgeText?: string;
  links?: Array<{
    href: string;
    label: string;
  }>;
  statusBadge?: React.ReactNode;
}

export function Navigation({ 
  logoText = "EdgePilot",
  badgeText = "Starter",
  links = [],
  statusBadge
}: NavigationProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg" />
              <span className="text-xl font-bold">{logoText}</span>
              <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400">
                {badgeText}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {links.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {statusBadge}
          </div>
        </div>
      </div>
    </nav>
  );
}