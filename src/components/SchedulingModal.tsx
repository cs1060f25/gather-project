import React, { useState, useEffect, useMemo } from 'react';
import './SchedulingModal.css';

export interface Contact {
  id: string;
  name: string;
  email: string;
}

export interface ParsedEventData {
  title?: string;
  participants?: string[];
  dates?: string[];
  time?: string;
  duration?: number;
  location?: string;
  priority?: 'must' | 'should' | 'maybe';
  notes?: string;
}

export interface ScheduledEventData {
  title: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  participants: string[];
  location?: string;
  priority: 'must' | 'should' | 'maybe';
  notes?: string;
}

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ParsedEventData | null;
  contacts: Contact[];
  defaultDate?: string;
  suggestedTimes?: string[];
  onSubmit: (eventData: ScheduledEventData) => void;
}

export const SchedulingModal: React.FC<SchedulingModalProps> = ({
  isOpen,
  onClose,
  initialData,
  contacts: _contacts,
  defaultDate,
  suggestedTimes = [],
  onSubmit
}) => {
  const contacts = _contacts || [];
  // Note: contacts will be used for autocomplete suggestions in future
  const [title, setTitle] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [isDateRange, setIsDateRange] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'must' | 'should' | 'maybe'>('should');
  const [notes, setNotes] = useState('');

  // Pre-fill from parsed data
  useEffect(() => {
    if (initialData) {
      const filled: string[] = [];
      
      if (initialData.title) {
        setTitle(initialData.title);
        filled.push('title');
      }
      if (initialData.participants?.length) {
        setParticipants(initialData.participants);
        filled.push('participants');
      }
      if (initialData.dates?.length) {
        setSelectedDates(initialData.dates);
        filled.push('dates');
      }
      if (initialData.time) {
        setStartTime(initialData.time);
        filled.push('time');
      }
      if (initialData.duration) {
        setDuration(initialData.duration);
        filled.push('duration');
      }
      if (initialData.location) {
        setLocation(initialData.location);
        filled.push('location');
      }
      if (initialData.priority) {
        setPriority(initialData.priority);
        filled.push('priority');
      }
      if (initialData.notes) {
        setNotes(initialData.notes);
        filled.push('notes');
      }
      
      setAutoFilledFields(filled);
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen && defaultDate) {
      setSelectedDates([defaultDate]);
    }
  }, [isOpen, defaultDate]);

  const filteredContactSuggestions = useMemo(() => {
    if (!newParticipant.trim()) return contacts.slice(0, 6);
    const query = newParticipant.toLowerCase();
    return contacts
      .filter((c: Contact) => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
      .slice(0, 6);
  }, [contacts, newParticipant]);

  // Generate time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeOptions.push({ value: time, label: displayTime });
    }
  }

  const handleAddParticipant = (value?: string) => {
    const candidate = (value ?? newParticipant).trim();
    if (candidate && !participants.includes(candidate)) {
      setParticipants([...participants, candidate]);
      setNewParticipant('');
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleDateSelect = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title,
      date: selectedDates[0] || formatLocalDate(new Date()),
      time: startTime,
      startTime,
      endTime,
      duration,
      participants,
      location,
      priority,
      notes,
    });
  };

  if (!isOpen) return null;

  // Generate next 14 days for date selection
  const dateOptions = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dateOptions.push({
      value: formatLocalDate(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }

  return (
    <div className="scheduling-modal-overlay" onClick={onClose}>
      <div className="scheduling-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="modal-header">
          <h2>Schedule Event</h2>
          <p>Fill in the details for your event</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Event Title */}
          <div className={`form-field ${autoFilledFields.includes('title') ? 'auto-filled' : ''}`}>
            <label>Event Name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Team Standup, Coffee with Sarah"
              required
            />
            {autoFilledFields.includes('title') && (
              <span className="auto-badge">Auto-filled</span>
            )}
          </div>

          {/* Location */}
          <div className={`form-field ${autoFilledFields.includes('location') ? 'auto-filled' : ''}`}>
            <label>Location / Link</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Office, Zoom link, Cafe..."
            />
          </div>

          {/* Date Selection */}
          <div className={`form-field ${autoFilledFields.includes('dates') ? 'auto-filled' : ''}`}>
            <label>Select Dates</label>
            <div className="date-type-toggle">
              <button
                type="button"
                className={!isDateRange ? 'active' : ''}
                onClick={() => setIsDateRange(false)}
              >
                Specific Days
              </button>
              <button
                type="button"
                className={isDateRange ? 'active' : ''}
                onClick={() => setIsDateRange(true)}
              >
                Date Range
              </button>
            </div>
            <div className="date-grid">
              {dateOptions.map(date => (
                <div
                  key={date.value}
                  className={`date-option ${selectedDates.includes(date.value) ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(date.value)}
                >
                  <span className="date-day">{date.dayName}</span>
                  <span className="date-num">{new Date(date.value).getDate()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Times */}
          {suggestedTimes.length > 0 && (
            <div className="form-field suggested-times">
              <label>
                <span className="sparkle">✨</span> Suggested times (based on your calendar)
              </label>
              <div className="suggested-time-chips">
                {suggestedTimes.map((time, idx) => {
                  const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  return (
                    <button
                      key={time}
                      type="button"
                      className={`suggested-chip ${startTime === time ? 'selected' : ''}`}
                      onClick={() => {
                        setStartTime(time);
                        // Auto-set end time based on duration
                        const [h, m] = time.split(':').map(Number);
                        const endMinutes = h * 60 + m + duration;
                        const endH = Math.floor(endMinutes / 60) % 24;
                        const endM = endMinutes % 60;
                        setEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
                      }}
                    >
                      <span className="chip-rank">#{idx + 1}</span>
                      <span className="chip-time">{displayTime}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Selection */}
          <div className={`form-field time-field ${autoFilledFields.includes('time') ? 'auto-filled' : ''}`}>
            <label>Time</label>
            <div className="time-inputs">
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              >
                <option value="">Start time</option>
                {timeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="time-separator">to</span>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              >
                <option value="">End time</option>
                {timeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className={`form-field ${autoFilledFields.includes('duration') ? 'auto-filled' : ''}`}>
            <label>Duration</label>
            <div className="duration-options">
              {[15, 30, 45, 60, 90, 120].map(mins => (
                <button
                  key={mins}
                  type="button"
                  className={duration === mins ? 'active' : ''}
                  onClick={() => setDuration(mins)}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Flexibility */}
          <div className="form-field inline-fields">
            <div className="priority-group">
              <label>Priority</label>
              <div className="pill-toggle">
                {(['must', 'should', 'maybe'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    className={priority === level ? 'active' : ''}
                    onClick={() => setPriority(level)}
                  >
                    {level === 'must' ? 'Must do' : level === 'should' ? 'Should do' : 'Maybe'}
                  </button>
                ))}
              </div>
            </div>
            <div className="priority-group">
              <label>Flexibility</label>
              <div className="pill-toggle">
                <button
                  type="button"
                  className={!isDateRange ? 'active' : ''}
                  onClick={() => setIsDateRange(false)}
                >
                  Fixed time
                </button>
                <button
                  type="button"
                  className={isDateRange ? 'active' : ''}
                  onClick={() => setIsDateRange(true)}
                >
                  Flexible
                </button>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className={`form-field ${autoFilledFields.includes('participants') ? 'auto-filled' : ''}`}>
            <label>Participants</label>
            <div className="participants-input">
              <input
                type="email"
                value={newParticipant}
                onChange={e => setNewParticipant(e.target.value)}
                placeholder="Add email address"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <button type="button" onClick={() => handleAddParticipant()}>Add</button>
            </div>
            {filteredContactSuggestions.length > 0 && (
              <div className="contact-suggestions">
                {filteredContactSuggestions.map((contact: Contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleAddParticipant(contact.email)}
                  >
                    {contact.name} — {contact.email}
                  </button>
                ))}
              </div>
            )}
            {participants.length > 0 && (
              <div className="participants-list">
                {participants.map(email => (
                  <div key={email} className="participant-tag">
                    <span>{email}</span>
                    <button type="button" onClick={() => handleRemoveParticipant(email)}>×</button>
                  </div>
                ))}
              </div>
            )}
            {autoFilledFields.includes('participants') && (
              <span className="auto-badge">Auto-filled</span>
            )}
          </div>

          {/* Notes */}
          <div className={`form-field ${autoFilledFields.includes('notes') ? 'auto-filled' : ''}`}>
            <label>Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Context, agenda, prep work..."
            />
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              <span>Create & Send Invites</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulingModal;
