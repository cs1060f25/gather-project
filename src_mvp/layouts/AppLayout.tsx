import React from 'react';
import { useRouter } from 'next/router';
import Header from '../components/common/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  const isPublicRoute = [
    '/onboarding',
    '/response'
  ].some(route => router.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Show header only on authenticated routes */}
      {!isPublicRoute && <Header />}
      
      <main className={`container ${!isPublicRoute ? 'pt-8' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
