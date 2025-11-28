import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/common/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isPublicRoute = [
    '/onboarding',
    '/response'
  ].some(route => location.pathname.startsWith(route));

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
