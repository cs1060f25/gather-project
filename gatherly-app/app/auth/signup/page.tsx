'use client';

/**
 * Signup Page
 * Linear Tasks: GATHER-76, GATHER-78
 * 
 * Handles user registration with proper duplicate email error handling
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  signInWithGoogle, 
  signUpWithEmail, 
  saveRedirectTo,
  AUTH_ERROR_CODES,
  AuthResult 
} from '@/lib/auth/google-auth';
import { useAuth } from '@/lib/auth/auth-context';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get redirectTo from URL params
  const redirectTo = searchParams.get('redirectTo');

  // Save redirectTo for after auth (GATHER-78)
  useEffect(() => {
    if (redirectTo) {
      saveRedirectTo(redirectTo);
    }
  }, [redirectTo]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo || '/app');
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    
    const result = await signInWithGoogle();
    
    if (result.success) {
      // Redirect handled by auth state change
    } else if (result.error) {
      setError(result.error.message);
      setErrorCode(result.error.code);
    }
    
    setIsLoading(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const result = await signUpWithEmail(email, password, name);
    
    if (result.success) {
      // Redirect handled by auth state change
    } else if (result.error) {
      setError(result.error.message);
      setErrorCode(result.error.code);
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '8px',
          textAlign: 'center',
          color: '#1a1a1a',
        }}>
          Create your account
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#666',
          marginBottom: '32px',
          textAlign: 'center',
        }}>
          Join Gatherly to schedule smarter
        </p>

        {/* Error Message - Inline display for GATHER-76 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            data-testid="signup-error"
            data-error-code={errorCode}
            style={{
              backgroundColor: errorCode === AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS 
                ? '#FEF3C7' 
                : '#FEE2E2',
              border: `1px solid ${errorCode === AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS 
                ? '#FCD34D' 
                : '#FECACA'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <p style={{
              color: errorCode === AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS 
                ? '#92400E' 
                : '#DC2626',
              fontSize: '14px',
              margin: 0,
            }} data-testid="auth-error-message">
              {error}
            </p>
            {errorCode === AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS && (
              <a
                href={`/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  color: '#92400E',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
                data-testid="signin-link"
              >
                Sign in instead →
              </a>
            )}
          </motion.div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          data-testid="google-signup-button"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            backgroundColor: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '15px',
            fontWeight: 500,
            color: '#1a1a1a',
            transition: 'all 0.2s',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          gap: '16px',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          <span style={{ color: '#9CA3AF', fontSize: '14px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
        </div>

        {/* Email Sign Up Form */}
        <form onSubmit={handleEmailSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px',
            }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="name-input"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Your name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="email-input"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-input"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="email-signup-button"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#5b7fa8',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#6B7280',
        }}>
          Already have an account?{' '}
          <a
            href={`/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
            style={{ color: '#5b7fa8', fontWeight: 500, textDecoration: 'none' }}
          >
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
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
      <SignupContent />
    </Suspense>
  );
}
