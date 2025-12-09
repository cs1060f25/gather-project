import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getInviteByToken, respondToInvite, type Invite } from '../lib/invites';
import { supabase } from '../lib/supabase';
import './InvitePage.css';

interface TimeOption {
  day: string;
  time: string;
  duration: number;
}

interface GatherlyEventData {
  options: TimeOption[];
  location?: string;
  description?: string;
}

// Response state for each time option
type TimeOptionResponse = 'yes' | 'no' | 'maybe' | null;

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [eventData, setEventData] = useState<GatherlyEventData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState<'accepted' | 'declined' | 'maybe' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Individual responses for each time option
  const [timeResponses, setTimeResponses] = useState<Record<number, TimeOptionResponse>>({});
  const [currentStep, setCurrentStep] = useState(0); // For step-by-step flow
  const useStepByStep = true; // Use step-by-step flow for better UX

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
      
      // Load the full Gatherly event data to get all time options
      if (data.event_id) {
        try {
          // First try to get all fields including description
          const { data: eventResult, error: eventError } = await supabase
            .from('gatherly_events')
            .select('options, location, description')
            .eq('id', data.event_id)
            .single();
          
          if (eventResult && !eventError) {
            setEventData({
              options: eventResult.options || [],
              location: eventResult.location || data.event_location,
              description: eventResult.description
            });
          } else if (eventError) {
            // Fallback: try without description column (for older tables)
            const { data: fallbackResult } = await supabase
              .from('gatherly_events')
              .select('options, location')
              .eq('id', data.event_id)
              .single();
            
            if (fallbackResult) {
              setEventData({
                options: fallbackResult.options || [],
                location: fallbackResult.location || data.event_location,
                description: undefined
              });
            }
          }
        } catch (err) {
          console.log('Could not load full event data:', err);
        }
      }
      
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
    
    // Pass selected time options to the response
    const selectedTimeStrings = selectedOptions.map(idx => {
      const opt = eventData?.options[idx];
      return opt ? `${opt.day} ${opt.time}` : '';
    }).filter(Boolean);
    
    const result = await respondToInvite(token, status, selectedTimeStrings.length > 0 ? selectedTimeStrings : undefined);
    
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

  // Handle response for individual time option
  const handleTimeResponse = (index: number, response: TimeOptionResponse) => {
    setTimeResponses(prev => ({ ...prev, [index]: response }));
    
    // Update selectedOptions based on responses
    if (response === 'yes') {
      setSelectedOptions(prev => [...new Set([...prev, index])]);
    } else {
      setSelectedOptions(prev => prev.filter(i => i !== index));
    }
  };

  // Move to next step in step-by-step flow
  const handleNextStep = () => {
    const timeOptions = eventData?.options || [];
    if (currentStep < timeOptions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // All options reviewed, submit
      handleFinalSubmit();
    }
  };

  // Submit final response based on individual selections
  const handleFinalSubmit = async () => {
    if (!token || responding) return;
    
    setResponding(true);
    
    // Determine overall status based on individual responses
    const hasYes = Object.values(timeResponses).some(r => r === 'yes');
    const hasMaybe = Object.values(timeResponses).some(r => r === 'maybe');
    const allNo = Object.values(timeResponses).every(r => r === 'no');
    
    let overallStatus: 'accepted' | 'declined' | 'maybe';
    if (hasYes) {
      overallStatus = 'accepted';
    } else if (hasMaybe) {
      overallStatus = 'maybe';
    } else if (allNo) {
      overallStatus = 'declined';
    } else {
      overallStatus = 'maybe'; // Default if not all answered
    }
    
    setResponse(overallStatus);
    
    // Collect accepted/maybe time options
    const selectedTimeStrings = Object.entries(timeResponses)
      .filter(([_, resp]) => resp === 'yes' || resp === 'maybe')
      .map(([idx]) => {
        const opt = eventData?.options[parseInt(idx)];
        return opt ? `${opt.day} ${opt.time}` : '';
      })
      .filter(Boolean);
    
    // Convert timeResponses to use string keys for JSON storage
    const optionResponses: Record<string, 'yes' | 'maybe' | 'no'> = {};
    Object.entries(timeResponses).forEach(([idx, resp]) => {
      if (resp && resp !== null) {
        optionResponses[idx] = resp;
      }
    });
    
    const result = await respondToInvite(
      token, 
      overallStatus, 
      selectedTimeStrings.length > 0 ? selectedTimeStrings : undefined,
      Object.keys(optionResponses).length > 0 ? optionResponses : undefined
    );
    
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

  const toggleTimeOption = (index: number) => {
    setSelectedOptions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Check if all time options have been responded to
  const allOptionsResponded = () => {
    const timeOptions = eventData?.options || [];
    return timeOptions.every((_, idx) => timeResponses[idx] !== undefined && timeResponses[idx] !== null);
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

  const formatDateFromISO = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const timeOptions = eventData?.options || [];
  const location = eventData?.location || invite.event_location;

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
                <p className="event-detail">{eventDate}</p>
                {invite.event_time && <p className="event-detail">{formatTime(invite.event_time)}</p>}
                {location && <p className="event-detail">{location}</p>}
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
                
                {location && (
                  <div className="event-detail" style={{ marginTop: '0.5rem' }}>
                    <span className="detail-icon"></span>
                    <span>{location}</span>
                  </div>
                )}
              </div>
                
              {/* Step-by-step flow for time options - OUTSIDE event card */}
              {timeOptions.length > 0 && useStepByStep && timeOptions[currentStep] ? (
                <div className="step-by-step-flow">
                    <div className="step-progress">
                      <span className="step-label">Time {currentStep + 1} of {timeOptions.length}</span>
                      <div className="step-dots">
                        {timeOptions.map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`step-dot ${idx === currentStep ? 'active' : ''} ${timeResponses[idx] ? 'answered' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="current-time-option">
                      <div className="time-option-card">
                        <span className="option-number-badge">{currentStep + 1}</span>
                        <div className="option-details">
                          <span className="option-date">{timeOptions[currentStep].day ? formatDateFromISO(timeOptions[currentStep].day) : 'Date TBD'}</span>
                          <span className="option-time-large">
                            {timeOptions[currentStep].time ? formatTime(timeOptions[currentStep].time) : 'Time TBD'}
                          </span>
                          <span className="option-duration">{timeOptions[currentStep].duration ? formatDuration(timeOptions[currentStep].duration) : ''}</span>
                        </div>
                      </div>
                      
                      <p className="time-question">Does this time work for you?</p>
                      
                      <div className="time-response-buttons">
                        <button
                          className={`time-btn time-btn-yes ${timeResponses[currentStep] === 'yes' ? 'selected' : ''}`}
                          onClick={() => {
                            handleTimeResponse(currentStep, 'yes');
                            setTimeout(handleNextStep, 300);
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                          Yes
                        </button>
                        <button
                          className={`time-btn time-btn-maybe ${timeResponses[currentStep] === 'maybe' ? 'selected' : ''}`}
                          onClick={() => {
                            handleTimeResponse(currentStep, 'maybe');
                            setTimeout(handleNextStep, 300);
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          Maybe
                        </button>
                        <button
                          className={`time-btn time-btn-no ${timeResponses[currentStep] === 'no' ? 'selected' : ''}`}
                          onClick={() => {
                            handleTimeResponse(currentStep, 'no');
                            setTimeout(handleNextStep, 300);
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                          No
                        </button>
                      </div>
                    </div>
                    
                    {/* Show summary of responses so far */}
                    {Object.keys(timeResponses).length > 0 && (
                      <div className="responses-summary">
                        {timeOptions.map((_, idx) => (
                          timeResponses[idx] && (
                            <div key={idx} className={`response-chip ${timeResponses[idx]}`}>
                              <span className="chip-number">{idx + 1}</span>
                              <span className="chip-response">
                                {timeResponses[idx] === 'yes' ? '✓' : timeResponses[idx] === 'no' ? '✗' : '?'}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    
                    {/* Manual submit button if all answered */}
                    {allOptionsResponded() && (
                      <button
                        className="submit-responses-btn"
                        onClick={handleFinalSubmit}
                        disabled={responding}
                      >
                        {responding ? 'Submitting...' : 'Submit My Availability'}
                      </button>
                    )}
                  </div>
                ) : timeOptions.length > 0 ? (
                  // Fallback: Original selection mode
                  <>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 0.75rem' }}>
                      Suggested times:
                    </p>
                    <div className="time-options-grid">
                      {timeOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          className={`time-option-item ${selectedOptions.includes(idx) ? 'selected' : ''}`}
                          onClick={() => toggleTimeOption(idx)}
                          style={{
                            cursor: 'pointer',
                            background: selectedOptions.includes(idx) ? '#22c55e' : '#fff',
                            color: selectedOptions.includes(idx) ? '#fff' : '#1a1a1a',
                          }}
                        >
                          <span 
                            className="time-option-badge"
                            style={{ 
                              background: selectedOptions.includes(idx) ? '#fff' : '#22c55e',
                              color: selectedOptions.includes(idx) ? '#22c55e' : '#fff'
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div className="time-option-content">
                            <span className="time-option-date" style={{ color: selectedOptions.includes(idx) ? '#fff' : '#1a1a1a' }}>
                              {formatDateFromISO(opt.day)}
                            </span>
                            <span className="time-option-time" style={{ color: selectedOptions.includes(idx) ? 'rgba(255,255,255,0.8)' : '#666' }}>
                              {formatTime(opt.time)} • {formatDuration(opt.duration)}
                            </span>
                          </div>
                          {selectedOptions.includes(idx) && (
                            <span style={{ marginLeft: 'auto' }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.5rem 0 0' }}>
                      Select times that work for you
                    </p>
                    
                    <div className="response-buttons" style={{ marginTop: '1.5rem' }}>
                      <button
                        className={`btn-response btn-yes ${response === 'accepted' ? 'selected' : ''}`}
                        onClick={() => handleResponse('accepted')}
                        disabled={responding || selectedOptions.length === 0}
                      >
                        {responding && response === 'accepted' ? (
                          <span className="loading-spinner-small"></span>
                        ) : (
                          <>
                            <span className="btn-emoji">✅</span>
                            <span>Submit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
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
                  </div>
                )}

              {/* Always show response buttons when no time options available */}
              {timeOptions.length === 0 && (
                <>
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
                </>
              )}
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

