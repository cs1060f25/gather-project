import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleToken } from '../lib/supabase';
import { DayNightToggle } from '../components/DayNightToggle';
import { ProfileSidebar } from '../components/ProfileSidebar';
import './EventsPage.css';

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

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  attendees?: string[];
  source: 'google' | 'gatherly';
  calendarId?: string;
  calendarName?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  isGatherly?: boolean;
}

interface GatherlyEvent {
  id: string;
  title: string;
  options: { day: string; time: string; duration: number; color: string }[];
  participants: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedOption?: { day: string; time: string; duration: number };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isGatherly?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const EventsPage: React.FC = () => {
  const { user: authUser, signOut } = useAuth();
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [gatherlyEvents, setGatherlyEvents] = useState<GatherlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const user: UserProfile | null = authUser ? {
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
  } : null;

  // Load events and contacts
  useEffect(() => {
    loadEvents();
    loadContacts();
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
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const loadEvents = async () => {
    setLoading(true);

    // Load Google Calendar events
    const providerToken = getGoogleToken();
    if (providerToken) {
      try {
        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
          new URLSearchParams({
            timeMin,
            timeMax,
            maxResults: '50',
            singleEvents: 'true',
            orderBy: 'startTime'
          }),
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        if (response.ok) {
          const data = await response.json();
          const events = (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.summary || 'Untitled Event',
            date: item.start?.date || item.start?.dateTime?.split('T')[0],
            time: item.start?.dateTime?.split('T')[1]?.slice(0, 5),
            endTime: item.end?.dateTime?.split('T')[1]?.slice(0, 5),
            location: item.location,
            attendees: (item.attendees || []).map((a: any) => a.email),
            source: 'google' as const,
            isGatherly: false
          }));
          setGoogleEvents(events);
        }
      } catch (error) {
        console.error('Error loading Google events:', error);
      }
    }

    // Load Gatherly events
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      setGatherlyEvents(JSON.parse(stored));
    }

    setLoading(false);
  };

  // Categorize events
  const categorizedEvents = useMemo(() => {
    const today = new Date();
    const todayISO = fmtDateISO(today);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowISO = fmtDateISO(weekFromNow);

    // Convert Gatherly events to calendar events format
    const gatherlyCalEvents: CalendarEvent[] = gatherlyEvents.map(ge => ({
      id: ge.id,
      title: ge.title,
      date: ge.confirmedOption?.day || ge.options[0]?.day || todayISO,
      time: ge.confirmedOption?.time || ge.options[0]?.time,
      attendees: ge.participants,
      source: 'gatherly' as const,
      status: ge.status,
      isGatherly: true
    }));

    const allEvents = [...googleEvents, ...gatherlyCalEvents];

    return {
      today: allEvents.filter(e => e.date === todayISO),
      nextWeek: allEvents.filter(e => e.date > todayISO && e.date <= weekFromNowISO),
      pending: gatherlyEvents.filter(ge => ge.status === 'pending')
    };
  }, [googleEvents, gatherlyEvents]);

  const formatTime = (time?: string) => {
    if (!time) return 'All day';
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="events-loading">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Header */}
      <header className="events-header">
        <div className="header-left">
          <Link to="/app" className="events-logo">
            <GatherlyLogo size={28} />
            <span>Gatherly</span>
          </Link>
        </div>
        <div className="header-center">
          <h1>Events</h1>
        </div>
        <div className="header-right">
          <DayNightToggle />
          <button 
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
            title="Profile"
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Profile" 
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

      {/* Content */}
      <main className="events-main">
        {/* Today's Events */}
        <section className="events-section">
          <h2 className="section-title">
            <span className="title-icon">📅</span>
            Today's Events
          </h2>
          {categorizedEvents.today.length === 0 ? (
            <div className="empty-state">
              <p>No events today! 🎉</p>
            </div>
          ) : (
            <div className="events-list">
              {categorizedEvents.today.map(event => (
                <Link 
                  key={event.id} 
                  to={`/event/${event.id}`}
                  className={`event-card ${event.isGatherly ? 'gatherly' : ''}`}
                >
                  <div className="event-time">{formatTime(event.time)}</div>
                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    {event.location && <p className="event-location">📍 {event.location}</p>}
                    {event.attendees && event.attendees.length > 0 && (
                      <p className="event-attendees">{event.attendees.length} attendees</p>
                    )}
                  </div>
                  {event.isGatherly && <span className="gatherly-badge">G</span>}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Next Week's Events */}
        <section className="events-section">
          <h2 className="section-title">
            <span className="title-icon">🗓️</span>
            Next Week's Events
          </h2>
          {categorizedEvents.nextWeek.length === 0 ? (
            <div className="empty-state">
              <p>No events this week</p>
            </div>
          ) : (
            <div className="events-list">
              {categorizedEvents.nextWeek.map(event => (
                <Link 
                  key={event.id} 
                  to={`/event/${event.id}`}
                  className={`event-card ${event.isGatherly ? 'gatherly' : ''}`}
                >
                  <div className="event-date-time">
                    <div className="event-date">{formatDate(event.date)}</div>
                    <div className="event-time">{formatTime(event.time)}</div>
                  </div>
                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    {event.location && <p className="event-location">📍 {event.location}</p>}
                  </div>
                  {event.isGatherly && <span className="gatherly-badge">G</span>}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pending Events */}
        <section className="events-section pending-section">
          <h2 className="section-title">
            <span className="title-icon">⏳</span>
            Pending
          </h2>
          {categorizedEvents.pending.length === 0 ? (
            <div className="empty-state">
              <p>No pending events</p>
            </div>
          ) : (
            <div className="events-list">
              {categorizedEvents.pending.map(event => (
                <Link 
                  key={event.id} 
                  to={`/event/${event.id}`}
                  className="event-card pending gatherly"
                >
                  <div className="event-options">
                    {event.options.slice(0, 3).map((opt, i) => (
                      <div key={i} className="option-chip" style={{ backgroundColor: opt.color }}>
                        {formatDate(opt.day)}
                      </div>
                    ))}
                  </div>
                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-participants">
                      {event.participants.length} invited • Waiting for responses
                    </p>
                  </div>
                  <span className="pending-badge">Pending</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showProfile}
        user={user}
        contacts={contacts}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        onAddContact={async () => {}}
        onRemoveContact={async () => {}}
        onImportContacts={async () => {}}
      />
    </div>
  );
};

export default EventsPage;

