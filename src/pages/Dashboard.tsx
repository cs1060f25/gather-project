import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { Calendar } from '../components/Calendar';
import { GlassChatBar } from '../components/GlassChatBar';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { LocalInfo } from '../components/LocalInfo';
import './Dashboard.css';

// Gatherly Logo SVG Component
const GatherlyLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="-2 -2 28 28" fill="none">
    <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
          stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
    <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isGatherly?: boolean;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, signOut, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingCount] = useState(2); // Mock for now

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
        phone: authUser.user_metadata?.phone || '',
      });
      
      // Load contacts from Supabase
      loadContacts();
      
      // Sync Google Calendar if connected
      syncGoogleCalendar();
    }
  }, [authUser]);

  const loadContacts = async () => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', authUser.id);
      
      if (!error && data) {
        setContacts(data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          isGatherly: c.is_gatherly
        })));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const syncGoogleCalendar = async () => {
    // Check if user has Google Calendar connected
    const session = await supabase.auth.getSession();
    const providerToken = session.data.session?.provider_token;
    
    if (providerToken) {
      try {
        // Fetch events from Google Calendar
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?' + 
          new URLSearchParams({
            timeMin: new Date().toISOString(),
            maxResults: '50',
            singleEvents: 'true',
            orderBy: 'startTime'
          }),
          {
            headers: {
              Authorization: `Bearer ${providerToken}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Convert Google events to our format and store in localStorage
          const events = data.items?.map((item: any) => ({
            id: item.id,
            title: item.summary || 'Untitled Event',
            date: item.start?.date || item.start?.dateTime?.split('T')[0],
            time: item.start?.dateTime?.split('T')[1]?.slice(0, 5),
            category: categorizeEvent(item.summary || '')
          })) || [];
          
          // Merge with existing local events
          const existingEvents = JSON.parse(localStorage.getItem('gatherly_events') || '[]');
          const existingIds = new Set(existingEvents.map((e: any) => e.id));
          const newEvents = events.filter((e: any) => !existingIds.has(e.id));
          
          localStorage.setItem('gatherly_events', JSON.stringify([...existingEvents, ...newEvents]));
          
          // Trigger calendar refresh
          window.dispatchEvent(new Event('gatherly_events_updated'));
        }
      } catch (error) {
        console.error('Error syncing Google Calendar:', error);
      }
    }
  };

  const categorizeEvent = (title: string): 'work' | 'personal' | 'travel' => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('flight') || lowerTitle.includes('trip') || lowerTitle.includes('travel')) {
      return 'travel';
    }
    if (lowerTitle.includes('meeting') || lowerTitle.includes('standup') || lowerTitle.includes('sync') || lowerTitle.includes('call')) {
      return 'work';
    }
    return 'personal';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleChatSubmit = async (message: string) => {
    console.log('Schedule request:', message);
    
    // Parse the message and create an event
    // TODO: Use OpenAI to parse the message into event details
    const today = new Date();
    const newEvent = {
      id: crypto.randomUUID(),
      title: message,
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      time: '12:00',
      category: 'personal' as const
    };
    
    // Add to localStorage
    const existingEvents = JSON.parse(localStorage.getItem('gatherly_events') || '[]');
    localStorage.setItem('gatherly_events', JSON.stringify([...existingEvents, newEvent]));
    
    // Trigger calendar refresh
    window.dispatchEvent(new Event('gatherly_events_updated'));
    
    // Clear input
    setChatInput('');
  };

  const handleAddContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
    
    // Save to Supabase
    if (authUser) {
      supabase.from('contacts').insert({
        user_id: authUser.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        is_gatherly: contact.isGatherly
      });
    }
  };

  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your calendar...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-logo">
            <GatherlyLogo size={28} />
            <span className="logo-text">Gatherly</span>
          </div>
        </div>
        <div className="header-center">
          <button className="pending-events-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="pending-badge">{pendingCount}</span>
            )}
          </button>
        </div>
        <div className="header-right">
          <LocalInfo minimal />
          <ThemeToggle />
          <button 
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || 'Profile'} 
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Calendar */}
      <main className="dashboard-main">
        <Calendar />
      </main>

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showProfile}
        user={user}
        contacts={contacts}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        onAddContact={handleAddContact}
      />

      {/* Chat Bar */}
      <GlassChatBar 
        value={chatInput}
        onChange={setChatInput}
        onSubmit={handleChatSubmit}
      />
    </div>
  );
};
