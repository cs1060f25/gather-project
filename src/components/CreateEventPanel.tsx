import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  location: string;
  participants: string[];
  availabilityOptions: AvailabilityOption[];
}

interface CreateEventPanelProps {
  contacts: Contact[];
  onSubmit: (data: CreateEventData) => void;
  onFieldChange?: (data: Partial<CreateEventData>) => void;
  onEditingModeChange?: (editing: boolean) => void;
  suggestedData?: Partial<CreateEventData>;
  isLoading?: boolean;
  events?: any[]; // Calendar events for finding free times
}

// Use subtle indicator colors that match the calendar option badges
const OPTION_COLORS = ['#1A1A1A', '#1A1A1A', '#1A1A1A']; // All black for clean look
const DURATIONS = [15, 30, 45, 60, 90, 120];

// Helper to format date as YYYY-MM-DD in local timezone (not UTC)
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate next 14 days
const getDateOptions = () => {
  const options = [];
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

// Generate time options
const getTimeOptions = () => {
  const options = [];
  for (let h = 7; h < 22; h++) {
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
  onSubmit,
  onFieldChange,
  onEditingModeChange,
  suggestedData,
  isLoading = false,
  events = []
}) => {
  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availabilityOptions, setAvailabilityOptions] = useState<AvailabilityOption[]>([
    { id: '1', day: getDateOptions()[1].value, time: '10:00', duration: 60, color: OPTION_COLORS[0] },
    { id: '2', day: getDateOptions()[2].value, time: '14:00', duration: 60, color: OPTION_COLORS[1] },
    { id: '3', day: getDateOptions()[3].value, time: '16:00', duration: 60, color: OPTION_COLORS[2] }
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
        location,
        participants,
        availabilityOptions
      });
    }
  }, [eventName, location, participants, availabilityOptions, isEditing, onFieldChange]);

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

  const handleAddParticipant = (emailOrName: string) => {
    const trimmed = emailOrName.trim();
    if (!trimmed || participants.includes(trimmed)) return;

    // Check if it matches a contact
    const contact = contacts.find(c => 
      c.name.toLowerCase() === trimmed.toLowerCase() || 
      c.email.toLowerCase() === trimmed.toLowerCase()
    );

    const email = contact?.email || trimmed;
    if (!participants.includes(email)) {
      setParticipants([...participants, email]);
    }
    setParticipantInput('');
    setShowSuggestions(false);
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
      location,
      participants,
      availabilityOptions
    });

    // Reset form
    setEventName('');
    setLocation('');
    setParticipants([]);
    setAvailabilityOptions([
      { id: '1', day: dateOptions[1].value, time: '10:00', duration: 60, color: OPTION_COLORS[0] },
      { id: '2', day: dateOptions[2].value, time: '14:00', duration: 60, color: OPTION_COLORS[1] },
      { id: '3', day: dateOptions[3].value, time: '16:00', duration: 60, color: OPTION_COLORS[2] }
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
      // Import and use OpenAI parsing
      const { parseSchedulingMessage, getSuggestedTimes } = await import('../lib/openai');
      
      const contactNames = contacts.map(c => c.name);
      const parsed = await parseSchedulingMessage(message, contactNames);
      
      if (parsed.isSchedulingRequest) {
        // Set event name from parsed title
        if (parsed.title) {
          setEventName(parsed.title);
        }
        
        // Set location if parsed
        if (parsed.location) {
          setLocation(parsed.location);
        }
        
        // Add participants if parsed
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
          
          if (parsed.suggestedDate) {
            newOptions[0] = { ...newOptions[0], day: parsed.suggestedDate };
          }
          if (parsed.suggestedTime) {
            newOptions[0] = { ...newOptions[0], time: parsed.suggestedTime };
          }
          if (parsed.duration) {
            newOptions[0] = { ...newOptions[0], duration: parsed.duration };
          }
          
          // Try to get additional free time suggestions
          if (events.length > 0) {
            const targetDate = parsed.suggestedDate || newOptions[0].day;
            const freeTimes = getSuggestedTimes(events, targetDate, parsed.duration || 60);
            
            freeTimes.slice(0, 3).forEach((time, idx) => {
              if (newOptions[idx]) {
                newOptions[idx] = { ...newOptions[idx], time };
              }
            });
          }
          
          setAvailabilityOptions(newOptions);
        }
        
        setIsEditing(true);
      } else {
        // Not a scheduling request, just set as event name
        setEventName(message);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error processing chat:', error);
      // Fallback: just set as event name
      setEventName(message);
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
        {isEditing && (
          <button 
            className="cep-cancel-btn"
            onClick={() => {
              setEventName('');
              setLocation('');
              setParticipants([]);
              setIsEditing(false);
            }}
            type="button"
          >
            Cancel
          </button>
        )}
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

        {/* Location */}
        <div className="cep-field">
          <label>Location/Link</label>
          <input
            type="text"
            value={location}
            onChange={e => { setLocation(e.target.value); setIsEditing(true); }}
            onFocus={handleFocus}
            placeholder="Office, Zoom, Coffee shop..."
          />
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

          {/* Selected participants */}
          {participants.length > 0 && (
            <div className="cep-participants">
              {participants.map(email => {
                const contact = contacts.find(c => c.email === email);
                return (
                  <div key={email} className="cep-participant">
                    <span>{contact?.name || email}</span>
                    <button type="button" onClick={() => handleRemoveParticipant(email)}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Availability Options */}
        <div className="cep-field cep-availability">
          <label>Availability</label>
          <div className="cep-options">
            {availabilityOptions.map((opt, idx) => (
              <div 
                key={opt.id} 
                className="cep-option"
              >
                <span className="cep-option-badge">{idx + 1}</span>
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
                <select
                  value={opt.duration}
                  onChange={e => handleOptionChange(opt.id, 'duration', Number(e.target.value))}
                  onFocus={handleFocus}
                  className="cep-option-duration"
                >
                  {DURATIONS.map(d => (
                    <option key={d} value={d}>{d < 60 ? `${d}m` : `${d/60}h`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="cep-submit"
          disabled={!eventName.trim() || isLoading}
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

