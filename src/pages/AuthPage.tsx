import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AuthPage.css';

// Email icon for password reset
const EmailSentIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
    <path d="M16 12l2 2 4-4" stroke="#22c55e" strokeWidth="2.5"/>
  </svg>
);

// Gatherly Logo SVG Component
const GatherlyLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="-2 -2 28 28" fill="none">
    <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
          stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
    <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Google icon SVG
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Handle back navigation and page restore - reset loading state
  useEffect(() => {
    // Reset loading state when page is restored from bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from back/forward cache
        setIsLoading(false);
        setError(null);
      }
    };
    
    // Also reset on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Reset loading state on mount (handles back button)
    setIsLoading(false);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Note: We don't auto-trigger Google auth anymore
  // The user must click the "Continue with Google" button explicitly

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, check if this email is associated with a Google SSO account
      // We do this by checking if the user exists and their provider
      await supabase.auth.signInWithPassword({
        email,
        password: 'check-provider-dummy-password-that-will-fail'
      });
      
      // If we get here without error, something unexpected happened
      // But we're mainly catching the error to check the message
    } catch (checkErr: any) {
      // If the error indicates the user signed up with OAuth, show a message
      if (checkErr?.message?.toLowerCase().includes('oauth') || 
          checkErr?.message?.toLowerCase().includes('google')) {
        setError('This email is linked to a Google account. Please sign in with Google instead.');
        setIsLoading(false);
        return;
      }
      // Otherwise, continue with password reset
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      // Always show success message for security (don't reveal if email exists)
      setResetEmailSent(true);
    } catch (err: any) {
      // For security, show success even if email doesn't exist
      // This prevents email enumeration attacks
      setResetEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
          scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
        }
      });
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            phone: phone,
            created_at: new Date().toISOString()
          });
          
          navigate('/app');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative elements */}
      <div className="auth-decor d1" />
      <div className="auth-decor d2" />
      <div className="auth-decor d3" />

      {/* Back button positioned absolutely */}
      <button className="back-btn-floating" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div className="auth-container">

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <GatherlyLogo size={36} />
              <span className="logo-text">Gatherly</span>
            </div>
            <h1 className="auth-title">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="auth-subtitle">
              {isSignUp 
                ? 'Start scheduling smarter today' 
                : 'Sign in to continue to Gatherly'}
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            className="google-btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <form className="auth-form" onSubmit={handleEmailAuth}>
            {isSignUp && (
              <>
                <div className="form-group">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone (optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {!isSignUp && (
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-spinner" />
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="forgot-password-modal">
          <div className="forgot-password-card">
            <button 
              className="modal-close-btn"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setError(null);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            {resetEmailSent ? (
              <div className="reset-success">
                <EmailSentIcon />
                <h2>Check your email</h2>
                <p>We've sent a password reset link to <strong>{email}</strong></p>
                <button 
                  className="submit-btn"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h2>Reset password</h2>
                <p className="reset-description">Enter your email and we'll send you a link to reset your password.</p>
                
                {error && (
                  <div className="auth-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                
                <form onSubmit={handleForgotPassword}>
                  <div className="form-group">
                    <label htmlFor="resetEmail">Email</label>
                    <input
                      type="email"
                      id="resetEmail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="btn-spinner" /> : 'Send reset link'}
                  </button>
                </form>
                
                <button 
                  className="back-to-signin"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
