import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleTokenSync as getGoogleToken } from '../lib/supabase';
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
  description?: string;
  attendees?: string[];
  source: 'google' | 'gatherly';
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  isGatherly?: boolean;
  isGatherlyScheduled?: boolean; // Google Calendar event that was created via Gatherly
  responses?: number;
  totalInvites?: number;
  htmlLink?: string;
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
  const [inviteCounts, setInviteCounts] = useState<Record<string, { responded: number; total: number }>>({});
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const user: UserProfile | null = authUser ? {
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
  } : null;

  // Load invites for all events to get accurate response counts
  const loadInviteCounts = async (eventIds: string[]) => {
    if (eventIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('event_id, status')
        .in('event_id', eventIds);
      
      if (!error && data) {
        const counts: Record<string, { responded: number; total: number }> = {};
        
        // Initialize counts for all event IDs
        eventIds.forEach(id => {
          counts[id] = { responded: 0, total: 0 };
        });
        
        // Count responses
        data.forEach(invite => {
          if (counts[invite.event_id]) {
            counts[invite.event_id].total++;
            if (invite.status !== 'pending') {
              counts[invite.event_id].responded++;
            }
          }
        });
        
        setInviteCounts(counts);
      }
    } catch (err) {
      console.error('Error loading invite counts:', err);
    }
  };

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
              const events = (data.items || []).map((item: any) => {
                // Check if this event was created via Gatherly
                const isGatherlyScheduled = item.description?.includes('[Scheduled with Gatherly]') || false;
                
                return {
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
                  // Use green for Gatherly-scheduled events
                  calendarColor: isGatherlyScheduled ? '#22c55e' : cal.color,
                  isGatherly: false,
                  isGatherlyScheduled
                };
              });
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
            location: e.location || 'TBD',
            options: e.options || [],
            participants: e.participants || [],
            status: e.status,
            createdAt: e.created_at,
            confirmedOption: e.confirmed_option,
            responses: e.responses || []
          }));
          setGatherlyEvents(events);
          localStorage.setItem('gatherly_created_events', JSON.stringify(events));
          // Load invite counts for all Gatherly events
          loadInviteCounts(events.map(e => e.id));
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
    const nowTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;

    // Convert Gatherly events to calendar events format
    // Filter out cancelled events - they shouldn't appear anywhere
    // Track confirmed Gatherly events to filter out duplicates from Google Calendar
    const confirmedGatherlyKeys = new Set<string>();
    
    const gatherlyCalEvents: CalendarEvent[] = gatherlyEvents
      .filter(ge => ge.status !== 'cancelled') // Don't show cancelled events
      .map(ge => {
        // Track confirmed events for duplicate detection
        if (ge.status === 'confirmed' && ge.confirmedOption) {
          const key = `${ge.confirmedOption.day}|${ge.confirmedOption.time}|${ge.title.toLowerCase().trim()}`;
          confirmedGatherlyKeys.add(key);
        }
        
        return {
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
        };
      });

    // Filter Google events to remove duplicates of confirmed Gatherly events
    const filteredGoogleEvents = googleEvents.filter(e => {
      if (!e.date || !e.time || !e.title) return true;
      const key = `${e.date}|${e.time}|${e.title.toLowerCase().trim()}`;
      return !confirmedGatherlyKeys.has(key);
    });

    const allEvents = [...filteredGoogleEvents, ...gatherlyCalEvents];

    // Get next 7 upcoming events chronologically (excluding today, not cancelled, not pending)
    const MAX_UPCOMING = 7;
    const upcomingFiltered = allEvents
      .filter(e => {
        if (e.status === 'cancelled' || e.status === 'pending') return false;
        // Must be after today, OR if today then after current time
        if (e.date > todayISO) return true;
        if (e.date === todayISO && e.time && e.time > nowTime) return true;
        return false;
      })
      .sort((a, b) => {
        // Sort chronologically by date then time
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time || '').localeCompare(b.time || '');
      })
      .slice(0, MAX_UPCOMING);

    return {
      today: allEvents.filter(e => e.date === todayISO && e.status !== 'cancelled' && e.status !== 'pending'),
      upcoming: upcomingFiltered,
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
                const isGatherlyScheduled = event.isGatherlyScheduled || false;
                
                return (
                  <div
                    key={event.id} 
                    className={`event-card-today ${!isGatherlyEvent ? 'non-gatherly clickable' : ''} ${isGatherlyScheduled ? 'gatherly-scheduled' : ''}`}
                    onClick={() => {
                      if (isGatherlyEvent) {
                        navigate(`/event/${event.id}`);
                      } else {
                        setSelectedEvent(event);
                      }
                    }}
                  >
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-location">{event.location || 'TBD'}</p>
                    <div className="event-footer">
                      {/* Only show responses for Gatherly events */}
                      {isGatherlyEvent && (
                      <span className="event-responses">
                          {inviteCounts[event.id]?.responded || 0}/{inviteCounts[event.id]?.total || event.totalInvites || 0} Responses
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
                        {isGatherlyScheduled ? 'Gatherly' : calendarName}
                      </span>
                    </div>
                    {/* Show Gatherly badge for pending Gatherly events OR scheduled via Gatherly */}
                    {(isGatherlyEvent || isGatherlyScheduled) && (
                      <div className="gatherly-badge" title={isGatherlyScheduled ? 'Scheduled with Gatherly' : 'Created with Gatherly'}>
                        <GatherlyLogo size={16} />
                      </div>
                    )}
                    <div className="event-card-bottom-bar" style={{ background: calendarColor }} />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Upcoming Events - Horizontal scroll */}
        {categorizedEvents.upcoming.length > 0 && (
          <section className="events-section upcoming-section">
            <h2 className="section-title">Upcoming</h2>
            <div className="upcoming-events-scroll">
              {categorizedEvents.upcoming.map(event => {
                let calendarName = event.calendarName || 'Calendar';
                if (user?.email && (calendarName === user.email || calendarName.toLowerCase() === user.email.toLowerCase())) {
                  calendarName = 'Personal';
                }
                const calendarColor = event.calendarColor || '#4285f4';
                const bgColor = getLighterColor(calendarColor);
                const isGatherlyEvent = event.isGatherly || event.source === 'gatherly';
                const isGatherlyScheduled = event.isGatherlyScheduled || false;
                
                // Format date for display
                const eventDate = new Date(event.date + 'T00:00:00');
                const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                return (
                  <div
                    key={event.id}
                    className={`event-card-upcoming ${!isGatherlyEvent ? 'non-gatherly clickable' : ''} ${isGatherlyScheduled ? 'gatherly-scheduled' : ''}`}
                    onClick={() => {
                      if (isGatherlyEvent) {
                        navigate(`/event/${event.id}`);
                      } else {
                        setSelectedEvent(event);
                      }
                    }}
                  >
                    <div className="upcoming-date-badge">{dayName}</div>
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-time-date">{monthDay}{event.time && ` • ${new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}</p>
                    <div className="event-footer">
                      <span 
                        className="event-category-badge"
                        style={{ background: bgColor, color: calendarColor }}
                      >
                        {isGatherlyScheduled ? 'Gatherly' : calendarName}
                      </span>
                    </div>
                    {/* Show Gatherly badge for pending Gatherly events OR scheduled via Gatherly */}
                    {(isGatherlyEvent || isGatherlyScheduled) && (
                      <div className="gatherly-badge" title={isGatherlyScheduled ? 'Scheduled with Gatherly' : 'Created with Gatherly'}>
                        <GatherlyLogo size={14} />
                      </div>
                    )}
                    <div className="event-card-bottom-bar" style={{ background: calendarColor }} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
                        {inviteCounts[event.id]?.responded || 0}/{inviteCounts[event.id]?.total || event.participants.length} Responses
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="event-detail-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            <div className="event-detail-header">
              <h2>{selectedEvent.title}</h2>
              {selectedEvent.isGatherlyScheduled && (
                <span className="gatherly-scheduled-badge">
                  <GatherlyLogo size={14} />
                  Scheduled with Gatherly
                </span>
              )}
            </div>

            <div className="event-detail-info">
              <div className="detail-row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>
                  {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                  })}
                </span>
              </div>
              
              {selectedEvent.time && (
                <div className="detail-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span>
                    {new Date(`2000-01-01T${selectedEvent.time}`).toLocaleTimeString('en-US', { 
                      hour: 'numeric', minute: '2-digit' 
                    })}
                    {selectedEvent.endTime && ` - ${new Date(`2000-01-01T${selectedEvent.endTime}`).toLocaleTimeString('en-US', { 
                      hour: 'numeric', minute: '2-digit' 
                    })}`}
                  </span>
                </div>
              )}
              
              {selectedEvent.location && (
                <div className="detail-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="detail-row attendees-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <div className="attendees-list">
                    {selectedEvent.attendees.slice(0, 5).map((email, i) => (
                      <span key={i} className="attendee-chip">{email}</span>
                    ))}
                    {selectedEvent.attendees.length > 5 && (
                      <span className="attendee-more">+{selectedEvent.attendees.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              {selectedEvent.calendarName && (
                <div className="detail-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M3 10h18"/>
                  </svg>
                  <span style={{ color: selectedEvent.calendarColor }}>{selectedEvent.calendarName}</span>
                </div>
              )}
            </div>

            <div className="event-detail-actions">
              {selectedEvent.htmlLink && (
                <a 
                  href={selectedEvent.htmlLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-view-gcal"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Open in Google Calendar
                </a>
              )}
              <button className="btn-close-modal" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
