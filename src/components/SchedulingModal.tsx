import React, { useState, useEffect } from 'react';
import './SchedulingModal.css';

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface ParsedEventData {
  title?: string;
  participants?: string[];
  dates?: string[];
  time?: string;
  duration?: number;
}

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ParsedEventData | null;
  contacts: Contact[];
  onSubmit: (eventData: any) => void;
}

export const SchedulingModal: React.FC<SchedulingModalProps> = ({
  isOpen,
  onClose,
  initialData,
  contacts,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [isDateRange, setIsDateRange] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

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
      
      setAutoFilledFields(filled);
    }
  }, [initialData]);

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

  const handleAddParticipant = () => {
    if (newParticipant && !participants.includes(newParticipant)) {
      setParticipants([...participants, newParticipant]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title,
      date: selectedDates[0] || new Date().toISOString().split('T')[0],
      time: startTime,
      duration,
      participants,
      category: 'personal',
      status: 'pending'
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
      value: date.toISOString().split('T')[0],
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
              <button type="button" onClick={handleAddParticipant}>Add</button>
            </div>
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
