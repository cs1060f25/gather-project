'use client';

/**
 * Auth Callback Page
 * Linear Task: GATHER-78
 * 
 * Handles redirect after SSO authentication
 * IMPORTANT: Must preserve redirectTo parameter from query or localStorage
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { getAndClearRedirectTo } from '@/lib/auth/google-auth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // GATHER-78: Get redirectTo from query params first, then localStorage
    const queryRedirectTo = searchParams.get('redirectTo');
    const storedRedirectTo = getAndClearRedirectTo();
    
    // Priority: query param > localStorage > default
    const finalRedirect = queryRedirectTo || storedRedirectTo || '/app';
    setRedirectPath(finalRedirect);
    
    console.log('Auth callback - redirectTo sources:', {
      queryParam: queryRedirectTo,
      localStorage: storedRedirectTo,
      final: finalRedirect,
    });
  }, [searchParams]);

  useEffect(() => {
    if (!loading && redirectPath) {
      if (isAuthenticated) {
        // User is authenticated, redirect to intended destination
        console.log('Auth callback - redirecting to:', redirectPath);
        router.push(redirectPath);
      } else {
        // Not authenticated, redirect to login
        router.push(`/auth/login${redirectPath !== '/app' ? `?redirectTo=${encodeURIComponent(redirectPath)}` : ''}`);
      }
    }
  }, [isAuthenticated, loading, router, redirectPath]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{
        marginTop: '24px',
        color: 'white',
        fontSize: '16px',
        fontWeight: 500,
      }}>
        Completing sign in...
      </p>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

