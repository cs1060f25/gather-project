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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check if we have a valid recovery session from the password reset link
  useEffect(() => {
    const handleInvalidLink = async () => {
      // Sign out to prevent automatic login after clicking "Back to Sign In"
      sessionStorage.removeItem('gatherly_recovery_mode');
      await supabase.auth.signOut();
      setError('Invalid or expired reset link. Please request a new password reset.');
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
          // They clicked an old/invalid reset link while already signed in
          // Sign them out to prevent confusion
          await supabase.auth.signOut();
          setError('This reset link is expired or invalid. Please request a new password reset.');
        }
      } else {
        // No valid session
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    // Handle the hash parameters from Supabase password reset
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      // Mark this as a recovery mode session
      sessionStorage.setItem('gatherly_recovery_mode', 'true');
      
      // Set the session from the recovery tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data, error: setSessionError }) => {
        if (setSessionError || !data.session) {
          // Token is expired or invalid - sign out and show error
          handleInvalidLink();
        } else {
          setHasSession(true);
          // Clean the URL
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
    } else {
      checkSession();
    }
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

  if (!hasSession && error) {
    const handleBackToSignIn = async () => {
      // Extra safety: ensure user is fully signed out before navigating
      sessionStorage.removeItem('gatherly_recovery_mode');
      await supabase.auth.signOut();
      navigate('/auth?mode=signin');
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
