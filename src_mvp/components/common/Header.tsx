import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-semibold text-[var(--color-primary)]">
          Gatherly
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm ${location.pathname === '/' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Schedule
          </Link>
          <Link 
            to="/dashboard" 
            className={`text-sm ${location.pathname === '/dashboard' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Meetings
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
