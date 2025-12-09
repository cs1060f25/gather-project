import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './CreateEventPanel.css';

interface Contact {
  id: string;
  name: string;
  email: string;
  isGatherly?: boolean;
}

export interface AvailabilityOption {
  id: string;
  day: string;
  time: string;
  duration: number;
  color: string;
}

export interface CreateEventData {
  eventName: string;
  description: string;
  location: string;
  participants: string[];
  availabilityOptions: AvailabilityOption[];
}

interface CreateEventPanelProps {
  contacts: Contact[];
  currentUserEmail?: string;
  currentUserName?: string;
  onSubmit: (data: CreateEventData) => void;
  onFieldChange?: (data: Partial<CreateEventData>) => void;
  onEditingModeChange?: (editing: boolean) => void;
  suggestedData?: Partial<CreateEventData>;
  isLoading?: boolean;
  events?: any[]; // Calendar events for finding free times
}

// Use subtle indicator colors that match the calendar option badges
const OPTION_COLORS = ['#1A1A1A', '#1A1A1A', '#1A1A1A']; // All black for clean look

// Helper to format date as YYYY-MM-DD in local timezone (not UTC)
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate next 14 days with a placeholder
const getDateOptions = () => {
  const options = [{ value: '', label: 'Select date...', shortLabel: 'Date' }];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push({
      value: formatLocalDate(d), // Use local date, not UTC
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      shortLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
    });
  }
  return options;
};

// Generate time options with a placeholder (6 AM to 11:30 PM)
const getTimeOptions = () => {
  const options = [{ value: '', label: 'Time' }];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      options.push({ value: time, label });
    }
  }
  return options;
};

// Duration options
const DURATION_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];

// SVG Icons as components
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const TimerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2 2"/>
    <path d="M5 3L2 6"/>
    <path d="M22 6l-3-3"/>
    <path d="M12 2v3"/>
  </svg>
);

const PLACEHOLDER_SUGGESTIONS = [
  "Schedule lunch with the team next Thursday...",
  "Coffee with Sarah tomorrow at 2pm...",
  "Weekly standup every Monday at 9am...",
  "Dinner with friends this Saturday evening...",
  "Quick sync with @John about the project...",
  "Book a meeting room for client presentation..."
];

export const CreateEventPanel: React.FC<CreateEventPanelProps> = ({
  contacts,
  currentUserEmail,
  currentUserName,
  onSubmit,
  onFieldChange,
  onEditingModeChange,
  suggestedData,
  isLoading = false,
  events = []
}) => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Start with blank availability options - AI will populate them intelligently
  const [availabilityOptions, setAvailabilityOptions] = useState<AvailabilityOption[]>([
    { id: '1', day: '', time: '', duration: 60, color: OPTION_COLORS[0] },
    { id: '2', day: '', time: '', duration: 60, color: OPTION_COLORS[1] },
    { id: '3', day: '', time: '', duration: 60, color: OPTION_COLORS[2] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const dateOptions = useMemo(() => getDateOptions(), []);
  const timeOptions = useMemo(() => getTimeOptions(), []);

  // Handle click outside to exit editing mode
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node) && isEditing) {
      // Don't reset if there's content
      if (!eventName && !location && participants.length === 0) {
        setIsEditing(false);
      }
    }
  }, [isEditing, eventName, location, participants]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Cycle through placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Apply suggested data from AI parsing
  useEffect(() => {
    if (suggestedData) {
      if (suggestedData.eventName) setEventName(suggestedData.eventName);
      if (suggestedData.description) setDescription(suggestedData.description);
      if (suggestedData.location) setLocation(suggestedData.location);
      if (suggestedData.participants) setParticipants(suggestedData.participants);
      if (suggestedData.availabilityOptions) setAvailabilityOptions(suggestedData.availabilityOptions);
    }
  }, [suggestedData]);

  // Notify parent of editing mode changes
  useEffect(() => {
    onEditingModeChange?.(isEditing);
  }, [isEditing, onEditingModeChange]);

  // Notify parent of field changes for calendar preview
  useEffect(() => {
    if (isEditing) {
      onFieldChange?.({
        eventName,
        description,
        location,
        participants,
        availabilityOptions
      });
    }
  }, [eventName, description, location, participants, availabilityOptions, isEditing, onFieldChange]);

  // Location autocomplete - virtual meeting platforms and Google Places API fallback
  const handleLocationChange = async (value: string) => {
    setLocation(value);
    setIsEditing(true);

    if (value.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Virtual meeting suggestions
    const virtualPlatforms = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Discord', 'Slack Huddle'];
    const lowercaseValue = value.toLowerCase();
    const matchedPlatforms = virtualPlatforms.filter(p => 
      p.toLowerCase().includes(lowercaseValue)
    );

    // Common location suggestions based on input
    const commonLocations = [
      `${value} (nearby)`,
      `${value}, Office`,
      `${value}, Downtown`,
    ];

    setLocationSuggestions([...matchedPlatforms, ...commonLocations].slice(0, 5));
    setShowLocationSuggestions(true);
  };

  const selectLocation = (loc: string) => {
    setLocation(loc);
    setShowLocationSuggestions(false);
  };

  // Filter contact suggestions
  const filteredContacts = useMemo(() => {
    if (!participantInput.trim()) return contacts.slice(0, 6);
    const query = participantInput.toLowerCase();
    return contacts
      .filter(c => 
        (c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)) &&
        !participants.includes(c.email)
      )
      .slice(0, 6);
  }, [contacts, participantInput, participants]);

  const [emailPromptFor, setEmailPromptFor] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleAddParticipant = (emailOrName: string) => {
    const trimmed = emailOrName.trim();
    if (!trimmed || participants.includes(trimmed)) return;

    // Check if it matches a contact
    const contact = contacts.find(c => 
      c.name.toLowerCase() === trimmed.toLowerCase() || 
      c.email.toLowerCase() === trimmed.toLowerCase()
    );

    if (contact) {
      // Contact exists, use their email
      const email = contact.email;
      if (!participants.includes(email)) {
        setParticipants([...participants, email]);
      }
      setParticipantInput('');
      setShowSuggestions(false);
      setIsEditing(true);
    } else if (trimmed.includes('@') && trimmed.includes('.')) {
      // It's an email, add directly
      if (!participants.includes(trimmed)) {
        setParticipants([...participants, trimmed]);
      }
      setParticipantInput('');
      setShowSuggestions(false);
      setIsEditing(true);
    } else {
      // It's a name without email - prompt for email
      setEmailPromptFor(trimmed);
      setPendingEmail('');
      setParticipantInput('');
      setShowSuggestions(false);
    }
  };

  const handleEmailPromptSubmit = () => {
    if (!emailPromptFor || !pendingEmail.includes('@')) return;
    
    if (!participants.includes(pendingEmail)) {
      setParticipants([...participants, pendingEmail]);
    }
    setEmailPromptFor(null);
    setPendingEmail('');
    setIsEditing(true);
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleOptionChange = (id: string, field: keyof AvailabilityOption, value: string | number) => {
    setAvailabilityOptions(prev => 
      prev.map(opt => opt.id === id ? { ...opt, [field]: value } : opt)
    );
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    onSubmit({
      eventName,
      description,
      location,
      participants,
      availabilityOptions
    });

    // Reset form to blank state
    setEventName('');
    setDescription('');
    setLocation('');
    setParticipants([]);
    setAvailabilityOptions([
      { id: '1', day: '', time: '', duration: 60, color: OPTION_COLORS[0] },
      { id: '2', day: '', time: '', duration: 60, color: OPTION_COLORS[1] },
      { id: '3', day: '', time: '', duration: 60, color: OPTION_COLORS[2] }
    ]);
    setIsEditing(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessingChat) return;
    
    setIsProcessingChat(true);
    const message = chatInput;
    setChatInput('');
    
    try {
      // Import and use OpenAI parsing - include current form state in context
      const { parseSchedulingMessage, getSuggestedTimes } = await import('../lib/openai');
      
      const contactNames = contacts.map(c => c.name);
      
      // Include current form state in the message for context preservation
      const contextMessage = `Current form state: Event="${eventName}", Location="${location}", Description="${description}", Participants=${JSON.stringify(participants)}, Options=${JSON.stringify(availabilityOptions.map(o => ({ day: o.day, time: o.time, duration: o.duration })))}. User message: ${message}`;
      
      const parsed = await parseSchedulingMessage(contextMessage, contactNames);
      
      if (parsed.isSchedulingRequest) {
        // Only update fields that the user explicitly wants to change
        // Preserve existing values for fields not mentioned
        if (parsed.title && parsed.title !== 'New Meeting') {
          setEventName(parsed.title);
        }
        
        // Set location if parsed and different from placeholder
        if (parsed.location && parsed.location !== 'TBD') {
          setLocation(parsed.location);
        }
        
        // Add participants if parsed (merge with existing)
        if (parsed.participants && parsed.participants.length > 0) {
          const emails = parsed.participants.map(p => {
            // Try to find contact by name
            const contact = contacts.find(c => 
              c.name.toLowerCase().includes(p.toLowerCase()) ||
              c.email.toLowerCase().includes(p.toLowerCase())
            );
            return contact?.email || p;
          });
          setParticipants(prev => [...new Set([...prev, ...emails])]);
        }
        
        // Update availability options if we have date/time suggestions
        if (parsed.suggestedDate || parsed.suggestedTime) {
          const newOptions = [...availabilityOptions];
          
          // Find first empty option slot or use first one
          const emptyIndex = newOptions.findIndex(o => !o.day && !o.time);
          const targetIndex = emptyIndex >= 0 ? emptyIndex : 0;
          
          if (parsed.suggestedDate) {
            newOptions[targetIndex] = { ...newOptions[targetIndex], day: parsed.suggestedDate };
          }
          if (parsed.suggestedTime) {
            newOptions[targetIndex] = { ...newOptions[targetIndex], time: parsed.suggestedTime };
          }
          if (parsed.duration) {
            newOptions[targetIndex] = { ...newOptions[targetIndex], duration: parsed.duration };
          }
          
          // Try to get additional free time suggestions for other slots
          if (events.length > 0 && parsed.suggestedDate) {
            const targetDate = parsed.suggestedDate;
            const freeTimes = getSuggestedTimes(events, targetDate, parsed.duration || 60);
            
            // Fill remaining empty slots with free times
            let freeTimeIdx = 0;
            for (let i = 0; i < newOptions.length && freeTimeIdx < freeTimes.length; i++) {
              if (!newOptions[i].day && !newOptions[i].time) {
                newOptions[i] = { 
                  ...newOptions[i], 
                  day: targetDate, 
                  time: freeTimes[freeTimeIdx] 
                };
                freeTimeIdx++;
              }
            }
          }
          
          setAvailabilityOptions(newOptions);
        }
        
        setIsEditing(true);
      } else {
        // Not a scheduling request, just append to event name if empty or treat as note
        if (!eventName) {
          setEventName(message);
        }
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error processing chat:', error);
      // Fallback: just set as event name if empty
      if (!eventName) {
        setEventName(message);
      }
      setIsEditing(true);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <div ref={panelRef} className={`create-event-panel ${isEditing ? 'editing' : ''}`}>
      <div className="cep-header">
        <h2>Create Event</h2>
        <div className="cep-header-actions">
        {isEditing && (
              <button 
              className="cep-cancel-btn"
              onClick={() => {
                setEventName('');
                setDescription('');
                setLocation('');
                setParticipants([]);
                setAvailabilityOptions([
                  { id: '1', day: '', time: '', duration: 60, color: OPTION_COLORS[0] },
                  { id: '2', day: '', time: '', duration: 60, color: OPTION_COLORS[1] },
                  { id: '3', day: '', time: '', duration: 60, color: OPTION_COLORS[2] }
                ]);
                setIsEditing(false);
              }}
              type="button"
            >
              Cancel
            </button>
          )}
          <Link to="/events" className="cep-events-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Events
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="cep-form">
        {/* Event Name */}
        <div className="cep-field">
          <label>Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={e => { setEventName(e.target.value); setIsEditing(true); }}
            onFocus={handleFocus}
            placeholder="Team Lunch, Project Sync..."
            className={suggestedData?.eventName ? 'suggested' : ''}
          />
        </div>

        {/* Description */}
        <div className="cep-field">
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setIsEditing(true); }}
            onFocus={handleFocus}
            placeholder="Add any details about this event..."
            className="cep-description"
            rows={2}
          />
        </div>

        {/* Location */}
        <div className="cep-field cep-location-field">
          <label>Location/Link</label>
          <input
            type="text"
            value={location}
            onChange={e => handleLocationChange(e.target.value)}
            onFocus={() => {
              handleFocus();
              if (location.length >= 2) setShowLocationSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
            placeholder="Office, Zoom, Coffee shop..."
          />
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="cep-location-suggestions">
              {locationSuggestions.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="cep-location-suggestion"
                  onMouseDown={() => selectLocation(loc)}
                >
                  {loc.includes('Meet') || loc.includes('Zoom') || loc.includes('Teams') || loc.includes('Discord') || loc.includes('Slack') ? (
                    <span className="cep-loc-icon">💻</span>
                  ) : (
                    <span className="cep-loc-icon">📍</span>
                  )}
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* People */}
        <div className="cep-field cep-people-field">
          <label>Who Do You Want to Invite?</label>
          <div className="cep-people-input-row">
            <input
              ref={inputRef}
              type="text"
              value={participantInput}
              onChange={e => {
                setParticipantInput(e.target.value);
                setShowSuggestions(true);
                setIsEditing(true);
              }}
              onFocus={() => {
                setShowSuggestions(true);
                handleFocus();
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddParticipant(participantInput);
                }
              }}
              placeholder="Name or email..."
            />
            <button
              type="button"
              onClick={() => handleAddParticipant(participantInput)}
              className="cep-add-btn"
            >
              Add
            </button>
          </div>

          {/* Contact suggestions dropdown */}
          {showSuggestions && filteredContacts.length > 0 && (
            <div className="cep-suggestions">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  className="cep-suggestion"
                  onMouseDown={() => handleAddParticipant(contact.email)}
                >
                  <div className="cep-suggestion-avatar">
                    {contact.name[0].toUpperCase()}
                  </div>
                  <div className="cep-suggestion-info">
                    <span className="cep-suggestion-name">{contact.name}</span>
                    <span className="cep-suggestion-email">{contact.email}</span>
                  </div>
                  {contact.isGatherly && (
                    <span className="cep-gatherly-badge">📅</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Email prompt modal */}
          {emailPromptFor && (
            <div className="cep-email-prompt">
              <p>Enter email for <strong>{emailPromptFor}</strong>:</p>
              <div className="cep-email-prompt-row">
                <input
                  type="email"
                  value={pendingEmail}
                  onChange={e => setPendingEmail(e.target.value)}
                  placeholder="email@example.com"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEmailPromptSubmit();
                    } else if (e.key === 'Escape') {
                      setEmailPromptFor(null);
                    }
                  }}
                />
                <button type="button" onClick={handleEmailPromptSubmit}>Add</button>
                <button type="button" onClick={() => setEmailPromptFor(null)} className="cep-cancel-email">Cancel</button>
              </div>
            </div>
          )}

          {/* Selected participants */}
          {participants.length > 0 && (
            <div className="cep-participants">
              {participants.map(email => {
                const contact = contacts.find(c => c.email === email);
                const isCurrentUser = email === currentUserEmail;
                return (
                  <div key={email} className={`cep-participant ${isCurrentUser ? 'is-organizer' : ''}`}>
                    <span>{isCurrentUser ? `${contact?.name || currentUserName || 'You'} (Organizer)` : (contact?.name || email)}</span>
                    {!isCurrentUser && (
                      <button type="button" onClick={() => handleRemoveParticipant(email)}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Availability Options */}
        <div className="cep-field cep-availability">
          <label>
            <span>Availability</span>
            <span className="cep-availability-hint">Select dates and times that work for you</span>
          </label>
          <div className="cep-options">
            {availabilityOptions.map((opt, idx) => (
              <div 
                key={opt.id} 
                className={`cep-option ${opt.day && opt.time ? 'filled' : ''}`}
              >
                <span className="cep-option-badge">{idx + 1}</span>
                <div className="cep-option-select-wrapper">
                  <span className="cep-option-icon"><CalendarIcon /></span>
                  <select
                    value={opt.day}
                    onChange={e => handleOptionChange(opt.id, 'day', e.target.value)}
                    onFocus={handleFocus}
                    className="cep-option-day"
                  >
                    {dateOptions.map(d => (
                      <option key={d.value} value={d.value}>{d.shortLabel}</option>
                    ))}
                  </select>
                </div>
                <div className="cep-option-select-wrapper">
                  <span className="cep-option-icon"><ClockIcon /></span>
                  <select
                    value={opt.time}
                    onChange={e => handleOptionChange(opt.id, 'time', e.target.value)}
                    onFocus={handleFocus}
                    className="cep-option-time"
                  >
                    {timeOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="cep-option-select-wrapper cep-duration-wrapper">
                  <span className="cep-option-icon"><TimerIcon /></span>
                  <select
                    value={opt.duration}
                    onChange={e => handleOptionChange(opt.id, 'duration', Number(e.target.value))}
                    onFocus={handleFocus}
                    className="cep-option-duration"
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button - requires event name, at least 1 participant, and at least 1 availability option */}
        <button 
          type="submit" 
          className="cep-submit"
          disabled={
            !eventName.trim() || 
            participants.length === 0 || 
            !availabilityOptions.some(opt => opt.day && opt.time) ||
            isLoading
          }
          title={
            !eventName.trim() ? 'Enter an event name' :
            participants.length === 0 ? 'Add at least one participant' :
            !availabilityOptions.some(opt => opt.day && opt.time) ? 'Add at least one availability option' :
            'Create event'
          }
        >
          {isLoading ? (
            <span className="cep-loading">
              <svg className="cep-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
              </svg>
              Creating...
            </span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create
            </>
          )}
        </button>
      </form>

      {/* Chat Bar */}
      <div className="cep-chat">
        <form onSubmit={handleChatSubmit} className="cep-chat-form">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder={isProcessingChat ? 'Processing...' : PLACEHOLDER_SUGGESTIONS[placeholderIndex]}
            className="cep-chat-input"
            disabled={isProcessingChat}
          />
          <button 
            type="submit" 
            className="cep-chat-submit" 
            disabled={!chatInput.trim() || isProcessingChat}
          >
            {isProcessingChat ? (
              <svg className="cep-chat-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
              </svg>
            ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPanel;

