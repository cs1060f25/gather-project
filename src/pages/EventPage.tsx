import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getGoogleToken } from '../lib/supabase';
import { DayNightToggle } from '../components/DayNightToggle';
import './EventPage.css';

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
  const { user: authUser } = useAuth();
  const [event, setEvent] = useState<GatherlyEvent | null>(null);
  const [googleEvent, setGoogleEvent] = useState<GoogleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGatherlyEvent, setIsGatherlyEvent] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // First check Gatherly events
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const gatherlyEvents: GatherlyEvent[] = JSON.parse(stored);
      const found = gatherlyEvents.find(e => e.id === eventId);
      if (found) {
        setEvent(found);
        setIsGatherlyEvent(true);
        setLoading(false);
        return;
      }
    }

    // If not found, try Google Calendar
    const providerToken = getGoogleToken();
    if (providerToken) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        if (response.ok) {
          const data = await response.json();
          setGoogleEvent(data);
          setIsGatherlyEvent(false);
        }
      } catch (error) {
        console.error('Error loading Google event:', error);
      }
    }

    setLoading(false);
  };

  const handleCancel = () => {
    if (!event) return;

    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const events: GatherlyEvent[] = JSON.parse(stored);
      const updated = events.map(e => 
        e.id === event.id ? { ...e, status: 'cancelled' as const } : e
      );
      localStorage.setItem('gatherly_created_events', JSON.stringify(updated));
      setEvent({ ...event, status: 'cancelled' });
    }

    setShowCancelConfirm(false);
  };

  const handleConfirmTime = async () => {
    if (!event || selectedOption === null) return;

    const confirmedOption = event.options[selectedOption];
    
    // Update local storage
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const events: GatherlyEvent[] = JSON.parse(stored);
      const updated = events.map(e => 
        e.id === event.id ? { ...e, status: 'confirmed' as const, confirmedOption } : e
      );
      localStorage.setItem('gatherly_created_events', JSON.stringify(updated));
      setEvent({ ...event, status: 'confirmed', confirmedOption });
    }

    // TODO: Create Google Calendar event and send invites
    // This would use the Google Calendar API to create the event
    // and send calendar invites to all participants
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
          <Link to="/events" className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <div className="event-logo">
            <GatherlyLogo size={28} />
            <span>Gatherly</span>
          </div>
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
          <DayNightToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="event-main">
        {isGatherlyEvent && event ? (
          // Gatherly Event View
          <div className="event-content">
            <div className={`event-status-banner ${event.status}`}>
              {event.status === 'pending' && '⏳ Waiting for responses'}
              {event.status === 'confirmed' && '✅ Event confirmed'}
              {event.status === 'cancelled' && '❌ Event cancelled'}
            </div>

            <div className="event-title-section">
              <h2>{event.title}</h2>
              <span className="gatherly-tag">Gatherly Event</span>
            </div>

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
                  disabled={selectedOption === null}
                >
                  Confirm Selected Time
                </button>
              )}
            </div>

            {/* Responses */}
            <div className="event-section">
              <h3>Responses</h3>
              <div className="responses-list">
                {event.participants.map(email => {
                  const response = event.responses?.find(r => r.email === email);
                  return (
                    <div key={email} className="response-item">
                      <div className="response-avatar">
                        {email[0].toUpperCase()}
                      </div>
                      <div className="response-info">
                        <span className="response-email">{email}</span>
                        <span className={`response-status ${response ? 'responded' : 'pending'}`}>
                          {response ? 'Responded' : 'Waiting...'}
                        </span>
                      </div>
                      {response && (
                        <div className="response-selections">
                          {response.selectedOptions.map(idx => (
                            <span 
                              key={idx} 
                              className="selection-chip"
                              style={{ backgroundColor: event.options[idx]?.color }}
                            >
                              Option {idx + 1}
                            </span>
                          ))}
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
    </div>
  );
};

export default EventPage;

