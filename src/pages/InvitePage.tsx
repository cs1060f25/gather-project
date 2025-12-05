import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getInviteByToken, respondToInvite, type Invite } from '../lib/invites';
import './InvitePage.css';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState<'accepted' | 'declined' | 'maybe' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      const data = await getInviteByToken(token);
      if (!data) {
        setError('Invite not found or has expired');
        setLoading(false);
        return;
      }

      setInvite(data);
      
      // Check if already responded
      if (data.status !== 'pending') {
        setResponse(data.status as 'accepted' | 'declined' | 'maybe');
        setSubmitted(true);
      }
      
      // Check for quick response from URL
      const quickResponse = searchParams.get('response');
      if (quickResponse && ['accepted', 'declined', 'maybe'].includes(quickResponse) && data.status === 'pending') {
        handleResponse(quickResponse as 'accepted' | 'declined' | 'maybe');
      }
      
      setLoading(false);
    };

    loadInvite();
  }, [token, searchParams]);

  const handleResponse = async (status: 'accepted' | 'declined' | 'maybe') => {
    if (!token || responding) return;
    
    setResponding(true);
    setResponse(status);
    
    const result = await respondToInvite(token, status);
    
    if (result.success) {
      setSubmitted(true);
      if (result.invite) {
        setInvite(result.invite);
      }
    } else {
      setError(result.message);
    }
    
    setResponding(false);
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-loading">
          <div className="loading-spinner"></div>
          <p>Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-error">
          <div className="error-icon">😕</div>
          <h1>Oops!</h1>
          <p>{error}</p>
          <a href="/" className="btn-home">Go to Gatherly</a>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  const eventDate = new Date(invite.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="invite-page">
      <div className="invite-container">
        {/* Header */}
        <header className="invite-header">
          <div className="gatherly-logo">
            <svg width="32" height="32" viewBox="-2 -2 28 28" fill="none">
              <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
                    stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
              <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Gatherly</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="invite-main">
          {submitted ? (
            <div className="invite-response-success">
              <div className="success-icon">
                {response === 'accepted' ? '🎉' : response === 'maybe' ? '🤔' : '👋'}
              </div>
              <h1>
                {response === 'accepted' 
                  ? "You're in!" 
                  : response === 'maybe' 
                  ? "Got it!" 
                  : "No worries!"}
              </h1>
              <p>
                {response === 'accepted' 
                  ? `See you at ${invite.event_title}!` 
                  : response === 'maybe' 
                  ? "We'll keep you posted on the details." 
                  : "Maybe next time! We'll miss you."}
              </p>
              
              <div className="event-summary">
                <h3>{invite.event_title}</h3>
                <p className="event-detail">📅 {eventDate}</p>
                {invite.event_time && <p className="event-detail">🕐 {formatTime(invite.event_time)}</p>}
                {invite.event_location && <p className="event-detail">📍 {invite.event_location}</p>}
              </div>

              <div className="response-actions">
                <button 
                  className="btn-change"
                  onClick={() => {
                    setSubmitted(false);
                    setResponse(null);
                  }}
                >
                  Change response
                </button>
                <a href="/" className="btn-gatherly">
                  Try Gatherly
                </a>
              </div>
            </div>
          ) : (
            <div className="invite-content">
              <div className="invite-from">
                <span className="from-label">Invitation from</span>
                <span className="from-name">{invite.host_name}</span>
              </div>

              <div className="event-card">
                <h1 className="event-title">{invite.event_title}</h1>
                <div className="event-details">
                  <div className="event-detail">
                    <span className="detail-icon">📅</span>
                    <span>{eventDate}</span>
                  </div>
                  {invite.event_time && (
                    <div className="event-detail">
                      <span className="detail-icon">🕐</span>
                      <span>{formatTime(invite.event_time)}</span>
                    </div>
                  )}
                  {invite.event_location && (
                    <div className="event-detail">
                      <span className="detail-icon">📍</span>
                      <span>{invite.event_location}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="invite-question">Can you make it?</p>

              <div className="response-buttons">
                <button
                  className={`btn-response btn-yes ${response === 'accepted' ? 'selected' : ''}`}
                  onClick={() => handleResponse('accepted')}
                  disabled={responding}
                >
                  {responding && response === 'accepted' ? (
                    <span className="loading-spinner-small"></span>
                  ) : (
                    <>
                      <span className="btn-emoji">✅</span>
                      <span>Yes, I'm in!</span>
                    </>
                  )}
                </button>

                <button
                  className={`btn-response btn-maybe ${response === 'maybe' ? 'selected' : ''}`}
                  onClick={() => handleResponse('maybe')}
                  disabled={responding}
                >
                  {responding && response === 'maybe' ? (
                    <span className="loading-spinner-small"></span>
                  ) : (
                    <>
                      <span className="btn-emoji">🤔</span>
                      <span>Maybe</span>
                    </>
                  )}
                </button>

                <button
                  className={`btn-response btn-no ${response === 'declined' ? 'selected' : ''}`}
                  onClick={() => handleResponse('declined')}
                  disabled={responding}
                >
                  {responding && response === 'declined' ? (
                    <span className="loading-spinner-small"></span>
                  ) : (
                    <>
                      <span className="btn-emoji">❌</span>
                      <span>Can't make it</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="invite-footer">
          <p>Powered by <a href="/">Gatherly</a> • Schedule faster together</p>
        </footer>
      </div>
    </div>
  );
};

