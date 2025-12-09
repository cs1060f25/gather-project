import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleToken } from '../lib/supabase';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { getEventInvites, type Invite } from '../lib/invites';
import './EventPage.css';

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

interface GatherlyEvent {
  id: string;
  title: string;
  location?: string;
  description?: string;
  options: { day: string; time: string; duration: number; color: string }[];
  participants: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedOption?: { day: string; time: string; duration: number };
  responses?: { email: string; selectedOptions: number[]; respondedAt: string }[];
}

interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: { email: string; responseStatus: string }[];
}

export const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const [event, setEvent] = useState<GatherlyEvent | null>(null);
  const [googleEvent, setGoogleEvent] = useState<GoogleEvent | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGatherlyEvent, setIsGatherlyEvent] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const user: UserProfile | null = authUser ? {
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
  } : null;

  useEffect(() => {
    loadEvent();
    loadContacts();
  }, [eventId, authUser]);

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

  const loadEvent = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // First try to load from Supabase
    try {
      const { data: supabaseEvent, error } = await supabase
        .from('gatherly_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (!error && supabaseEvent) {
        const gatherlyEvent: GatherlyEvent = {
          id: supabaseEvent.id,
          title: supabaseEvent.title,
          location: supabaseEvent.location || 'TBD',
          description: supabaseEvent.description,
          options: supabaseEvent.options || [],
          participants: supabaseEvent.participants || [],
          status: supabaseEvent.status,
          createdAt: supabaseEvent.created_at,
          confirmedOption: supabaseEvent.confirmed_option,
          responses: supabaseEvent.responses
        };
        setEvent(gatherlyEvent);
        setIsGatherlyEvent(true);
        
        // Load invites for this event
        const eventInvites = await getEventInvites(eventId);
        setInvites(eventInvites);
        
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error loading from Supabase:', err);
    }

    // Fallback: Check localStorage Gatherly events
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const gatherlyEvents: GatherlyEvent[] = JSON.parse(stored);
      const found = gatherlyEvents.find(e => e.id === eventId);
      if (found) {
        setEvent(found);
        setIsGatherlyEvent(true);
        
        // Load invites for this event
        const eventInvites = await getEventInvites(eventId);
        setInvites(eventInvites);
        
        setLoading(false);
        return;
      }
    }

    // If not found, try Google Calendar (search across all calendars)
    const providerToken = await getGoogleToken();
    if (providerToken) {
      try {
        // First try primary calendar
        let response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        if (response.ok) {
          const data = await response.json();
          setGoogleEvent(data);
          setIsGatherlyEvent(false);
          setLoading(false);
          return;
        }

        // If not found in primary, search other calendars
        const calendarListResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        if (calendarListResponse.ok) {
          const calendarList = await calendarListResponse.json();
          
          for (const cal of (calendarList.items || [])) {
            if (cal.id === 'primary') continue; // Already tried primary
            
            try {
              response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events/${eventId}`,
                { headers: { Authorization: `Bearer ${providerToken}` } }
              );

              if (response.ok) {
                const data = await response.json();
                setGoogleEvent(data);
                setIsGatherlyEvent(false);
                setLoading(false);
                return;
              }
            } catch (err) {
              // Continue to next calendar
            }
          }
        }
      } catch (error) {
        console.error('Error loading Google event:', error);
      }
    }

    setLoading(false);
  };

  const handleCancel = async () => {
    if (!event) return;

    try {
      // Delete from Supabase completely
      const { error } = await supabase
        .from('gatherly_events')
        .delete()
        .eq('id', event.id);
      
      if (error) {
        console.error('Error deleting event in Supabase:', error);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }

    // Also delete from localStorage
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const events: GatherlyEvent[] = JSON.parse(stored);
      const filtered = events.filter(e => e.id !== event.id);
      localStorage.setItem('gatherly_created_events', JSON.stringify(filtered));
    }

    // Navigate back to events page
    setShowCancelConfirm(false);
    navigate('/events');
  };

  const handleConfirmTime = async () => {
    if (!event || selectedOption === null) return;

    setIsConfirming(true);
    const confirmedOption = event.options[selectedOption];
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('gatherly_events')
        .update({ 
          status: 'confirmed', 
          confirmed_option: confirmedOption,
          updated_at: new Date().toISOString() 
        })
        .eq('id', event.id);
      
      if (error) {
        console.error('Error confirming event in Supabase:', error);
      }
      
      // Try to create Google Calendar event for the organizer
      const providerToken = await getGoogleToken();
      console.log('Google token available:', !!providerToken);
      if (providerToken && confirmedOption) {
        try {
          const startDate = new Date(`${confirmedOption.day}T${confirmedOption.time}`);
          const endDate = new Date(startDate.getTime() + (confirmedOption.duration || 60) * 60000);
          
          // Build the calendar event with all details
          const calendarEvent: {
            summary: string;
            description?: string;
            location?: string;
            start: { dateTime: string; timeZone: string };
            end: { dateTime: string; timeZone: string };
            attendees: { email: string }[];
          } = {
            summary: event.title,
            start: {
              dateTime: startDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            attendees: event.participants.map(email => ({ email }))
          };
          
          // Add optional fields if they exist
          if (event.description) {
            calendarEvent.description = event.description;
          }
          if (event.location && event.location !== 'TBD') {
            calendarEvent.location = event.location;
          }
          
          console.log('Creating Google Calendar event:', calendarEvent);
          
          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(calendarEvent)
            }
          );
          
          if (response.ok) {
            const createdEvent = await response.json();
            console.log('Google Calendar event created successfully:', createdEvent.id);
            
            // Delete the Gatherly event from Supabase since it's now on GCal
            await supabase
              .from('gatherly_events')
              .delete()
              .eq('id', event.id);
            
            // Delete from localStorage
            const storedEvents = localStorage.getItem('gatherly_created_events');
            if (storedEvents) {
              const events: GatherlyEvent[] = JSON.parse(storedEvents);
              const filtered = events.filter(e => e.id !== event.id);
              localStorage.setItem('gatherly_created_events', JSON.stringify(filtered));
            }
            
            // Navigate back to events page
            navigate('/events');
            return;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to create Google Calendar event:', response.status, errorData);
            // If it's a scope/permission error, show a helpful message
            if (response.status === 403 || response.status === 401) {
              alert('Unable to create calendar event. Please try signing out and signing back in to refresh permissions.');
            }
          }
        } catch (gcalError) {
          console.error('Error creating Google Calendar event:', gcalError);
        }
      }
    } catch (err) {
      console.error('Error confirming event:', err);
    }
    
    // Fallback: Update localStorage if GCal creation failed
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const events: GatherlyEvent[] = JSON.parse(stored);
      const updated = events.map(e => 
        e.id === event.id ? { ...e, status: 'confirmed' as const, confirmedOption } : e
      );
      localStorage.setItem('gatherly_created_events', JSON.stringify(updated));
    }

    setEvent({ ...event, status: 'confirmed', confirmedOption });
    setIsConfirming(false);
  };

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="event-loading">
          <div className="loading-spinner"></div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event && !googleEvent) {
    return (
      <div className="event-page">
        <div className="event-not-found">
          <h1>Event Not Found</h1>
          <p>This event doesn't exist or has been deleted.</p>
          <Link to="/events" className="btn-back">Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="event-page">
      {/* Header */}
      <header className="event-header">
        <div className="header-left">
          <button 
            className="event-back-btn"
            onClick={() => navigate('/events')}
            aria-label="Back to Events"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <Link to="/app" className="event-logo">
            <GatherlyLogo size={28} />
            <span>Gatherly</span>
          </Link>
        </div>
        <div className="header-center">
          <h1>Event</h1>
        </div>
        <div className="header-right">
          {isGatherlyEvent && event?.status !== 'cancelled' && (
            <button 
              className="cancel-btn"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Event
            </button>
          )}
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
      <main className="event-main">
        {isGatherlyEvent && event ? (
          // Gatherly Event View
          <div className="event-content">
            <div className={`event-status-banner ${event.status}`}>
              {event.status === 'pending' && 'Waiting for responses'}
              {event.status === 'confirmed' && 'Event confirmed'}
              {event.status === 'cancelled' && 'Event cancelled'}
            </div>

            <div className="event-nav">
              <Link to="/events" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back to Events
              </Link>
            </div>

            <div className="event-title-section">
              <h2>{event.title}</h2>
              <span className="gatherly-tag">Gatherly Event</span>
            </div>

            {/* Location */}
            {event.location && event.location !== 'TBD' && (
              <div className="event-location-display">
                <span className="location-icon">📍</span>
                <span>{event.location}</span>
              </div>
            )}

            {/* Time Options */}
            <div className="event-section">
              <h3>Schedule Event</h3>
              <div className="time-options">
                {event.options.map((opt, idx) => (
                  <button
                    key={idx}
                    className={`time-option ${selectedOption === idx ? 'selected' : ''} ${event.status === 'confirmed' && event.confirmedOption?.day === opt.day && event.confirmedOption?.time === opt.time ? 'confirmed' : ''}`}
                    style={{ '--option-color': opt.color } as React.CSSProperties}
                    onClick={() => event.status === 'pending' && setSelectedOption(idx)}
                    disabled={event.status !== 'pending'}
                  >
                    <span className="option-date">{formatDate(opt.day)}</span>
                    <span className="option-time">{formatTime(opt.time)}</span>
                    <span className="option-duration">{formatDuration(opt.duration)}</span>
                  </button>
                ))}
              </div>

              {event.status === 'pending' && (
                <button 
                  className="confirm-btn"
                  onClick={handleConfirmTime}
                  disabled={selectedOption === null || isConfirming}
                >
                  {isConfirming ? 'Confirming...' : 'Confirm Selected Time'}
                </button>
              )}
            </div>

            {/* Responses */}
            <div className="event-section">
              <h3>Responses ({invites.filter(i => i.status !== 'pending').length}/{event.participants.length})</h3>
              <div className="responses-list">
                {event.participants.map(email => {
                  const invite = invites.find(i => i.invitee_email.toLowerCase() === email.toLowerCase());
                  const status = invite?.status || 'pending';
                  const suggestedTimes = invite?.suggested_times || [];
                  
                  // Get per-option responses if available
                  const optionResponses = (invite as any)?.option_responses as Record<string, 'yes' | 'maybe' | 'no'> | undefined;
                  
                  return (
                    <div key={email} className="response-item-card">
                      <div className="response-item-header">
                        <div className={`response-avatar ${status}`}>
                          {email[0].toUpperCase()}
                        </div>
                        <div className="response-header-info">
                          <span className="response-email">{email}</span>
                          <span className={`response-status-badge ${status}`}>
                            {status === 'accepted' && 'Responded'}
                            {status === 'declined' && 'Declined All'}
                            {status === 'maybe' && 'Responded'}
                            {status === 'pending' && 'Waiting...'}
                          </span>
                        </div>
                        {invite?.responded_at && (
                          <span className="response-date">
                            {new Date(invite.responded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Show detailed per-option responses */}
                      {status !== 'pending' && (
                        <div className="response-options-grid">
                          {event.options.map((opt, idx) => {
                            // Check option_responses first, fall back to suggestedTimes
                            let optResponse: 'yes' | 'maybe' | 'no' | undefined;
                            if (optionResponses && optionResponses[idx.toString()]) {
                              optResponse = optionResponses[idx.toString()];
                            } else if (suggestedTimes.length > 0) {
                              const isSelected = suggestedTimes.some(t => t.includes(opt.day) && t.includes(opt.time));
                              optResponse = isSelected ? (status === 'maybe' ? 'maybe' : 'yes') : 'no';
                            } else if (status === 'declined') {
                              optResponse = 'no';
                            }
                            
                            if (!optResponse) optResponse = 'no';
                            
                            // Format the date/time for display
                            const optDate = new Date(opt.day + 'T00:00:00');
                            const dayStr = optDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            const timeStr = formatTime(opt.time);
                            
                            return (
                              <div 
                                key={idx} 
                                className={`response-option-row ${optResponse}`}
                              >
                                <span className="option-label">Option {idx + 1}</span>
                                <span className="option-datetime">{dayStr} • {timeStr}</span>
                                <span className={`option-answer ${optResponse}`}>
                                  {optResponse === 'yes' && (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> Yes</>
                                  )}
                                  {optResponse === 'maybe' && (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Maybe</>
                                  )}
                                  {optResponse === 'no' && (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg> No</>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : googleEvent ? (
          // Google Calendar Event View
          <div className="event-content google-event">
            <div className="event-nav">
              <Link to="/events" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back to Events
              </Link>
            </div>

            <div className="event-title-section">
              <h2>{googleEvent.summary}</h2>
              <span className="google-tag">Google Calendar</span>
            </div>

            <div className="event-details">
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <span>{formatDate(googleEvent.start.dateTime?.split('T')[0] || googleEvent.start.date || '')}</span>
              </div>
              {googleEvent.start.dateTime && (
                <div className="detail-item">
                  <span className="detail-icon">🕐</span>
                  <span>{formatTime(googleEvent.start.dateTime.split('T')[1].slice(0, 5))}</span>
                </div>
              )}
              {googleEvent.location && (
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span>{googleEvent.location}</span>
                </div>
              )}
            </div>

            {googleEvent.description && (
              <div className="event-description">
                <h3>Description</h3>
                <p>{googleEvent.description}</p>
              </div>
            )}

            {googleEvent.attendees && googleEvent.attendees.length > 0 && (
              <div className="event-section">
                <h3>Attendees</h3>
                <div className="attendees-list">
                  {googleEvent.attendees.map(attendee => (
                    <div key={attendee.email} className="attendee-item">
                      <div className="attendee-avatar">
                        {attendee.email[0].toUpperCase()}
                      </div>
                      <span className="attendee-email">{attendee.email}</span>
                      <span className={`attendee-status ${attendee.responseStatus}`}>
                        {attendee.responseStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cancel Event?</h3>
            <p>Are you sure you want to cancel "{event?.title}"? This will notify all invited participants.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                Keep Event
              </button>
              <button className="btn-danger" onClick={handleCancel}>
                Cancel Event
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

export default EventPage;

