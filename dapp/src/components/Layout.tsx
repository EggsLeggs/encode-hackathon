import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Calendar, BookOpen } from 'lucide-react';
import type { WalletConnectionProps } from '@concordium/react-components';
import { WalletButton } from './WalletButton';
import { ContractAddressButton } from './ContractAddressButton';

export const Layout: React.FC<WalletConnectionProps> = (props) => {
  const location = useLocation();

  const navigation = [
    { name: 'Register for Exam', href: '/register', icon: Calendar },
    // { name: 'Take Exam', href: '/exam', icon: BookOpen }, // Hidden for demo
    { name: 'Take Exam', href: '/mock-exam', icon: BookOpen }, // Mock exam disguised as real exam
    // Temporarily commented out to reduce scope
    // { name: 'Become a Proctor', href: '/become-proctor', icon: UserCheck },
    // { name: 'Proctor Exam', href: '/proctor', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex w-full items-center justify-between px-8 py-3 gap-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-gray-900" />
            <h1 className="font-custom font-semibold text-lg text-gray-900">
              Proctora.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ContractAddressButton />
            <WalletButton {...props} />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-secondary/60 backdrop-blur-md border-t border-gray-200/50 rounded-t-md p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 max-w-xl">
            <h3 className="font-custom text-lg font-semibold text-secondary-foreground">
              About
            </h3>
            <p className="font-custom text-sm text-secondary-foreground">
              Proctora brings on-chain transparency to online exams. Powered by Concordium, driven by zero-knowledge identity - redefining trust in remote assessment.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <p className="font-custom text-xs text-secondary-foreground">
              Psst... this site runs on coffee, cookies, and a little bit of wizardry ✨
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
