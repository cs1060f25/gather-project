import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleToken } from '../lib/supabase';
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
  calendarColor?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  isGatherly?: boolean;
  responses?: number;
  totalInvites?: number;
}

interface GatherlyEvent {
  id: string;
  title: string;
  location?: string;
  options: { day: string; time: string; duration: number; color: string; location?: string }[];
  participants: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedOption?: { day: string; time: string; duration: number };
  responses?: { email: string; selectedOptions: number[] }[];
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

interface GoogleCalendar {
  id: string;
  name: string;
  color: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Helper to create lighter background from color
const getLighterColor = (color: string): string => {
  // Convert hex to RGB, lighten, and return
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Mix with white (lighter)
  const lightR = Math.round(r + (255 - r) * 0.8);
  const lightG = Math.round(g + (255 - g) * 0.8);
  const lightB = Math.round(b + (255 - b) * 0.8);
  return `rgb(${lightR}, ${lightG}, ${lightB})`;
};

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
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

    // Load Google Calendar events from ALL calendars
    const providerToken = getGoogleToken();
    if (providerToken) {
      try {
        // First fetch all calendars
        const calendarListResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        let fetchedCalendars: GoogleCalendar[] = [];
        if (calendarListResponse.ok) {
          const calendarListData = await calendarListResponse.json();
          fetchedCalendars = (calendarListData.items || []).map((cal: any) => ({
            id: cal.id,
            name: cal.summary || 'Unnamed Calendar',
            color: cal.backgroundColor || '#4285f4'
          }));
        }

        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // Fetch events from all calendars
        const allEvents: CalendarEvent[] = [];
        
        for (const cal of fetchedCalendars) {
          try {
            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?` +
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
                location: item.location || 'TBD',
                attendees: (item.attendees || []).map((a: any) => a.email),
                source: 'google' as const,
                calendarId: cal.id,
                calendarName: cal.name,
                calendarColor: cal.color,
                isGatherly: false
              }));
              allEvents.push(...events);
            }
          } catch (err) {
            console.error(`Error fetching events from ${cal.name}:`, err);
          }
        }
        
        setGoogleEvents(allEvents);
      } catch (error) {
        console.error('Error loading Google events:', error);
      }
    }

    // Load Gatherly events from localStorage
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGatherlyEvents(parsed);
      } catch (e) {
        console.error('Error parsing Gatherly events:', e);
      }
    }

    // Also try to load from Supabase
    if (authUser) {
      try {
        const { data, error } = await supabase
          .from('gatherly_events')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const events: GatherlyEvent[] = data.map(e => ({
            id: e.id,
            title: e.title,
            location: e.options?.[0]?.location || 'TBD',
            options: e.options || [],
            participants: e.participants || [],
            status: e.status,
            createdAt: e.created_at,
            confirmedOption: e.confirmed_option,
            responses: e.responses || []
          }));
          setGatherlyEvents(events);
          localStorage.setItem('gatherly_created_events', JSON.stringify(events));
        }
      } catch (err) {
        console.error('Error loading from Supabase:', err);
      }
    }

    setLoading(false);
  };

  // Categorize events
  const categorizedEvents = useMemo(() => {
    const today = new Date();
    const todayISO = fmtDateISO(today);

    // Convert Gatherly events to calendar events format
    const gatherlyCalEvents: CalendarEvent[] = gatherlyEvents.map(ge => ({
      id: ge.id,
      title: ge.title,
      date: ge.confirmedOption?.day || ge.options[0]?.day || todayISO,
      time: ge.confirmedOption?.time || ge.options[0]?.time,
      location: ge.location || ge.options?.[0]?.location || 'TBD',
      attendees: ge.participants,
      source: 'gatherly' as const,
      status: ge.status,
      isGatherly: true,
      calendarName: 'Gatherly',
      calendarColor: '#22c55e',
      responses: ge.responses?.length || 0,
      totalInvites: ge.participants.length
    }));

    const allEvents = [...googleEvents, ...gatherlyCalEvents];

    return {
      today: allEvents.filter(e => e.date === todayISO && e.status !== 'cancelled'),
      pending: gatherlyEvents.filter(ge => ge.status === 'pending')
    };
  }, [googleEvents, gatherlyEvents]);

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
        <div className="header-right">
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

      {/* Main Content */}
      <main className="events-main">
        {/* Today's Events - Horizontal scroll */}
        <section className="events-section today-section">
          <div className="section-header">
            <button 
              className="back-arrow"
              onClick={() => navigate('/app')}
              aria-label="Back to Dashboard"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <h2 className="section-title">Today's Events</h2>
          </div>
          <div className="today-events-scroll">
            {categorizedEvents.today.length === 0 ? (
              <div className="event-card-today empty">
                <p>No events today</p>
              </div>
            ) : (
              categorizedEvents.today.map(event => {
                // Show "Personal" if calendar name matches user's email
                let calendarName = event.calendarName || 'Calendar';
                if (user?.email && (calendarName === user.email || calendarName.toLowerCase() === user.email.toLowerCase())) {
                  calendarName = 'Personal';
                }
                const calendarColor = event.calendarColor || '#4285f4';
                const bgColor = getLighterColor(calendarColor);
                const isGatherlyEvent = event.isGatherly || event.source === 'gatherly';
                
                return (
                  <Link 
                    key={event.id} 
                    to={isGatherlyEvent ? `/event/${event.id}` : '#'}
                    className={`event-card-today ${!isGatherlyEvent ? 'non-gatherly' : ''}`}
                    onClick={(e) => {
                      if (!isGatherlyEvent) {
                        e.preventDefault();
                        // Could optionally show a toast or info that this is a Google Calendar event
                      }
                    }}
                  >
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-location">{event.location || 'TBD'}</p>
                    <div className="event-footer">
                      {/* Only show responses for Gatherly events */}
                      {isGatherlyEvent && (
                        <span className="event-responses">
                          {event.responses || 0}/{event.totalInvites || event.attendees?.length || 1} Responses
                        </span>
                      )}
                      {!isGatherlyEvent && event.time && (
                        <span className="event-time-display">
                          {new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                      <span 
                        className="event-category-badge"
                        style={{ background: bgColor, color: calendarColor }}
                      >
                        {calendarName}
                      </span>
                    </div>
                    <div className="event-card-bottom-bar" style={{ background: calendarColor }} />
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Pending Events */}
        <section className="events-section pending-section">
          <h2 className="section-title">Pending</h2>
          <div className="pending-events-list">
            {categorizedEvents.pending.length === 0 ? (
              <div className="empty-state">
                <p>No pending events</p>
              </div>
            ) : (
              categorizedEvents.pending.map(event => {
                // Format time for display
                const formatTime = (time: string) => {
                  if (!time) return '';
                  const [h, m] = time.split(':').map(Number);
                  const date = new Date();
                  date.setHours(h, m);
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                };
                
                // Format date for display
                const formatDate = (dateStr: string) => {
                  if (!dateStr) return '';
                  const [year, month, day] = dateStr.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                };
                
                return (
                  <Link 
                    key={event.id}
                    to={`/event/${event.id}`}
                    className="pending-event-row"
                  >
                    <div className="pending-event-header">
                      <h3 className="event-title">{event.title}</h3>
                      <span className="event-responses">
                        {event.responses?.length || 0}/{event.participants.length} Responses
                      </span>
                    </div>
                    
                    {/* Show the 3 time options with badges */}
                    {event.options && event.options.length > 0 && (
                      <div className="pending-event-options">
                        {event.options.slice(0, 3).map((opt, idx) => (
                          <div key={idx} className="pending-option-badge">
                            <span className="option-number">{idx + 1}</span>
                            <span className="option-datetime">
                              {opt.day && formatDate(opt.day)}
                              {opt.time && ` • ${formatTime(opt.time)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="event-meta">
                      <span className="event-location">{event.location || event.options?.[0]?.location || 'TBD'}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
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
