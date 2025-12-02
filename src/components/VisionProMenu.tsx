import React, { useState, useEffect, useRef } from 'react';
import { SpaceBackground } from './SpaceBackground';
import './VisionProMenu.css';

interface VisionProMenuProps {
    isOpen: boolean;
    onClose: () => void;
    initialInput?: string;
}

type View = 'main' | 'signin' | 'signup';

export const VisionProMenu: React.FC<VisionProMenuProps> = ({ isOpen, onClose, initialInput }) => {
    const [activeMenu, setActiveMenu] = useState<'account' | 'schedule'>('account');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [currentView, setCurrentView] = useState<View>('main');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Sign in form state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
    
    // Sign up form state
    const [signUpName, setSignUpName] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');

    // 3D rotation on mouse move
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!menuRef.current) return;
            const multiplier = 6.0;
            const y = (((e.clientY / window.innerHeight) * 2) - 1) * multiplier;
            const x = (((e.clientX / window.innerWidth) * 2) - 1) * multiplier;
            menuRef.current.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (currentView !== 'main') {
                    setCurrentView('main');
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose, currentView]);

    // Reset view when menu closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentView('main');
            setError(null);
        }
    }, [isOpen]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const { supabase } = await import('../lib/supabase');
            const { error } = await supabase.auth.signInWithPassword({
                email: signInEmail,
                password: signInPassword,
            });
            
            if (error) throw error;
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const { supabase } = await import('../lib/supabase');
            const { error } = await supabase.auth.signUp({
                email: signUpEmail,
                password: signUpPassword,
                options: {
                    data: {
                        full_name: signUpName,
                    }
                }
            });
            
            if (error) throw error;
            alert('Check your email to confirm your account!');
            setCurrentView('signin');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSSO = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        setError(null);
        
        try {
            const { supabase } = await import('../lib/supabase');
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin,
                }
            });
            
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || `Failed to sign in with ${provider}`);
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="vision-pro-overlay" onClick={onClose}>
            <SpaceBackground />
            
            {/* Close Button - Top Left */}
            <button className="vision-close-btn" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>

            <div 
                id="vision-pro-menu" 
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Side Menu */}
                <div 
                    id="side-menu-wrapper"
                    onMouseEnter={() => setSidebarExpanded(true)}
                    onMouseLeave={() => setSidebarExpanded(false)}
                >
                    <ul id="side-menu" className={`apple-window ${sidebarExpanded ? 'expanded' : ''}`}>
                        <li 
                            className={activeMenu === 'account' ? 'active' : ''}
                            onClick={() => { setActiveMenu('account'); setCurrentView('main'); }}
                        >
                            <div className="menu-item-inner">
                                <i className="menu-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </i>
                                <span className="menu-label">Account</span>
                            </div>
                        </li>
                        <li 
                            className={activeMenu === 'schedule' ? 'active' : ''}
                            onClick={() => { setActiveMenu('schedule'); setCurrentView('main'); }}
                        >
                            <div className="menu-item-inner">
                                <i className="menu-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </i>
                                <span className="menu-label">Schedule</span>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Main Menu */}
                <div id="main-menu-wrapper">
                    {/* Account - Main View */}
                    {activeMenu === 'account' && currentView === 'main' && (
                        <div className="main-menu apple-window active">
                            <div className="account-buttons">
                                <button className="liquid-glass-btn" onClick={() => setCurrentView('signin')}>
                                    <span className="btn-text">Sign In</span>
                                    <div className="btn-glow"></div>
                                </button>
                                <button className="liquid-glass-btn signup" onClick={() => setCurrentView('signup')}>
                                    <span className="btn-text">Sign Up</span>
                                    <div className="btn-glow"></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sign In View */}
                    {activeMenu === 'account' && currentView === 'signin' && (
                        <div className="main-menu apple-window active signin-view">
                            <button className="back-btn" onClick={() => setCurrentView('main')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <h2 className="view-title">Welcome Back</h2>
                            <p className="view-subtitle">Sign in to access your scheduling agent</p>
                            
                            {error && <div className="auth-error">{error}</div>}
                            
                            <form onSubmit={handleSignIn} className="auth-form">
                                <div className="input-group">
                                    <input 
                                        type="email" 
                                        placeholder="Email"
                                        value={signInEmail}
                                        onChange={(e) => setSignInEmail(e.target.value)}
                                        className="glass-input"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        placeholder="Password"
                                        value={signInPassword}
                                        onChange={(e) => setSignInPassword(e.target.value)}
                                        className="glass-input"
                                        required
                                    />
                                </div>
                                <button type="submit" className="liquid-glass-btn submit" disabled={isLoading}>
                                    <span className="btn-text">{isLoading ? 'Signing in...' : 'Continue'}</span>
                                    <div className="btn-glow"></div>
                                </button>
                            </form>

                            <div className="divider">
                                <span>or</span>
                            </div>

                            <div className="sso-options">
                                <button className="sso-btn google" onClick={() => handleSSO('google')} disabled={isLoading}>
                                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                    Continue with Google
                                </button>
                                <button className="sso-btn apple" onClick={() => handleSSO('apple')} disabled={isLoading}>
                                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                                    Continue with Apple
                                </button>
                            </div>

                            <div className="calendar-connect">
                                <p className="connect-label">Connect your calendar after signing in</p>
                            </div>
                        </div>
                    )}

                    {/* Sign Up View */}
                    {activeMenu === 'account' && currentView === 'signup' && (
                        <div className="main-menu apple-window active signup-view">
                            <button className="back-btn" onClick={() => setCurrentView('main')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <h2 className="view-title">Get Started</h2>
                            <p className="view-subtitle">Create your agentic scheduling account</p>
                            
                            {error && <div className="auth-error">{error}</div>}
                            
                            {/* SSO Options */}
                            <div className="sso-options">
                                <button className="sso-btn google" onClick={() => handleSSO('google')} disabled={isLoading}>
                                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                    Continue with Google
                                </button>
                                <button className="sso-btn apple" onClick={() => handleSSO('apple')} disabled={isLoading}>
                                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                                    Continue with Apple
                                </button>
                            </div>

                            <div className="divider">
                                <span>or</span>
                            </div>

                            <form onSubmit={handleSignUp} className="auth-form">
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        placeholder="Full Name"
                                        value={signUpName}
                                        onChange={(e) => setSignUpName(e.target.value)}
                                        className="glass-input"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="email" 
                                        placeholder="Email"
                                        value={signUpEmail}
                                        onChange={(e) => setSignUpEmail(e.target.value)}
                                        className="glass-input"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        placeholder="Password"
                                        value={signUpPassword}
                                        onChange={(e) => setSignUpPassword(e.target.value)}
                                        className="glass-input"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <button type="submit" className="liquid-glass-btn submit" disabled={isLoading}>
                                    <span className="btn-text">{isLoading ? 'Creating...' : 'Create Account'}</span>
                                    <div className="btn-glow"></div>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Schedule Menu */}
                    {activeMenu === 'schedule' && (
                        <div className="main-menu apple-window active">
                            <div className="schedule-content">
                                <span className="schedule-icon">📅</span>
                                {initialInput && <p className="schedule-query">"{initialInput}"</p>}
                                <p className="schedule-text">Schedule interface coming soon...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
