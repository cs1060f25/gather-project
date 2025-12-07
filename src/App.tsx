import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { supabase } from './lib/supabase';
import './App.css';

import { MarketingPage } from './pages/MarketingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { StoryPage } from './pages/StoryPage';
import { InvitePage } from './pages/InvitePage';
import { EventsPage } from './pages/EventsPage';
import { EventPage } from './pages/EventPage';

// Auth Context
interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-content">
          <svg width="48" height="48" viewBox="-2 -2 28 28" fill="none" className="auth-logo-spin">
            <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
            <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Signing you in...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Route - redirects to /app if already logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // LoadingScreen handles this
  }

  // If user is logged in and on landing page, redirect to app
  if (user && location.pathname === '/') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// Auth Provider Component
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Auth init - setting up listeners');

    // Set up auth state listener - Supabase will automatically handle OAuth callbacks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        
        setUser(session?.user || null);
        
        // Clean up URL hash if it contains tokens
        if (window.location.hash.includes('access_token')) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }
        
        console.log('Initial session check:', session?.user?.email);
        setUser(session?.user || null);
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
        setLoading(false);
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
function AppContent() {
  const [showLoading, setShowLoading] = useState(true);

  // Show loading screen on first visit or refresh
  const isFirstVisit = !sessionStorage.getItem('gatherly_visited');

  useEffect(() => {
    if (!isFirstVisit) {
      setShowLoading(false);
    }
  }, [isFirstVisit]);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('gatherly_visited', 'true');
    setShowLoading(false);
  };

  // Show loading screen only on first visit
  if (showLoading && isFirstVisit) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <Routes>
      {/* Marketing/Landing Page */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <MarketingPage />
          </PublicRoute>
        } 
      />
      
      {/* Auth Pages */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } 
      />
      
      {/* Main App Dashboard */}
      <Route 
        path="/app" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Our Story Page */}
      <Route 
        path="/story" 
        element={<StoryPage />} 
      />
      
      {/* Invite Response Page */}
      <Route 
        path="/invite/:token" 
        element={<InvitePage />} 
      />
      
      {/* Events Page */}
      <Route 
        path="/events" 
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Event Detail Page */}
      <Route 
        path="/event/:eventId" 
        element={
          <ProtectedRoute>
            <EventPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
