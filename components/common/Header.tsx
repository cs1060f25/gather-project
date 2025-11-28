import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const Header: React.FC = () => {
  const router = useRouter();
  
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold text-[var(--color-primary)]">
          Gatherly
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm ${router.pathname === '/' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Schedule
          </Link>
          <Link 
            href="/dashboard" 
            className={`text-sm ${router.pathname === '/dashboard' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Meetings
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
