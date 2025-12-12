import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AuthPage.css';

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

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true); // Start with validating
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check if we have a valid recovery session from the password reset link
  useEffect(() => {
    const clearAllAuthState = async () => {
      // Aggressively clear ALL auth state to prevent auto-login
      sessionStorage.removeItem('gatherly_recovery_mode');
      
      // Clear all Gatherly data
      const keysToRemove = [
        'gatherly_google_token',
        'gatherly_calendars_cache',
        'gatherly_panel_width',
        'gatherly_recent_people',
        'gatherly_timezone',
        'gatherly_detected_timezone',
        'gatherly_theme'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear Supabase auth tokens from localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase
      await supabase.auth.signOut();
    };

    const handleInvalidLink = async () => {
      // Set error FIRST to ensure UI shows before any redirects
      setError('Invalid or expired reset link. Please request a new password reset.');
      setIsValidating(false);
      // Then clear auth state in background
      clearAllAuthState();
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a recovery session (from password reset link)
      if (session) {
        // Check if it's a recovery type session
        const isRecoverySession = sessionStorage.getItem('gatherly_recovery_mode') === 'true';
        
        if (isRecoverySession) {
          setHasSession(true);
        } else {
          // User is logged in but this is NOT a recovery session
          // Set error FIRST, then clear auth
          setError('This reset link is expired or invalid. Please request a new password reset.');
          setIsValidating(false);
          clearAllAuthState();
          return; // Exit early
        }
      } else {
        // No valid session - just show error, don't touch auth
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    // Handle the hash parameters from Supabase password reset
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    const processRecoveryFlow = async () => {
    if (accessToken && refreshToken && type === 'recovery') {
        // First, sign out any existing session to start fresh
        await supabase.auth.signOut();
        
      // Mark this as a recovery mode session
      sessionStorage.setItem('gatherly_recovery_mode', 'true');
        
        // Clean the URL immediately to prevent token reuse
        window.history.replaceState(null, '', window.location.pathname);
      
      // Set the session from the recovery tokens
        const { data, error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
        });
        
        if (setSessionError || !data.session) {
          // Token is expired or invalid - show error immediately
          handleInvalidLink(); // Don't await, let it set error first
          return; // Exit early, handleInvalidLink sets isValidating
        } else {
          setHasSession(true);
          setIsValidating(false);
        }
    } else {
        // No recovery tokens in URL - check if user has existing recovery session
        await checkSession();
        setIsValidating(false);
    }
    };

    processRecoveryFlow();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Clear recovery mode flag
      sessionStorage.removeItem('gatherly_recovery_mode');
      
      // Clear ALL Gatherly cached data to prevent stale data from previous sessions
      const keysToRemove = [
        'gatherly_google_token',
        'gatherly_calendars_cache',
        'gatherly_panel_width',
        'gatherly_recent_people',
        'gatherly_timezone',
        'gatherly_detected_timezone',
        'gatherly_theme'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Also clear any Supabase auth tokens
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key);
        }
      });

      // Sign out after password reset to clear any cached sessions
      await supabase.auth.signOut();
      
      setSuccess(true);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/auth?mode=signin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating the recovery token
  if (isValidating) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <GatherlyLogo size={40} />
            <span className="auth-logo-text">Gatherly</span>
          </div>
          <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="btn-spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem', borderColor: 'rgba(34, 197, 94, 0.3)', borderTopColor: '#22c55e' }} />
            <p style={{ color: '#666', margin: 0 }}>Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <GatherlyLogo size={40} />
            <span className="auth-logo-text">Gatherly</span>
          </div>
          
          <div className="auth-success-card">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <h2>Password Updated!</h2>
            <p>Your password has been successfully changed.</p>
            <p className="redirect-notice">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no valid session and no error yet, show error (safety fallback)
  if (!hasSession && !error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <GatherlyLogo size={40} />
            <span className="auth-logo-text">Gatherly</span>
          </div>
          
          <div className="auth-error-card">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <h2>Invalid Link</h2>
            <p>This password reset link is invalid. Please request a new one.</p>
            <button 
              className="auth-btn primary"
              onClick={() => window.location.href = '/auth?mode=signin'}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSession && error) {
    const handleBackToSignIn = async () => {
      // Extra safety: aggressively clear ALL auth state before navigating
      sessionStorage.removeItem('gatherly_recovery_mode');
      
      // Clear all Gatherly data
      const keysToRemove = [
        'gatherly_google_token',
        'gatherly_calendars_cache',
        'gatherly_panel_width',
        'gatherly_recent_people',
        'gatherly_timezone',
        'gatherly_detected_timezone',
        'gatherly_theme'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear Supabase auth tokens
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut();
      
      // Use window.location to force a full page reload and clear any cached state
      window.location.href = '/auth?mode=signin';
    };

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <GatherlyLogo size={40} />
            <span className="auth-logo-text">Gatherly</span>
          </div>
          
          <div className="auth-error-card">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <h2>Reset Link Expired</h2>
            <p>{error}</p>
            <button 
              className="auth-btn primary"
              onClick={handleBackToSignIn}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
          <GatherlyLogo size={40} />
          <span className="logo-text">Gatherly</span>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-subtitle">Enter your new password below</p>
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

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? <span className="btn-spinner" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
