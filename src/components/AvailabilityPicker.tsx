import React, { useState, useEffect } from 'react';

// Types
export interface AvailabilityOption {
  id: string;
  day: string;
  time: string;
  duration: number;
  color?: string;
}

type PickerType = 'date' | 'time' | 'duration';

interface ActivePicker {
  type: PickerType;
  optionId: string;
}

interface AvailabilityPickerProps {
  options: AvailabilityOption[];
  onChange: (options: AvailabilityOption[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
  labelText?: string;
}

// Option colors - match CreateEventPanel (all black for clean look)
const OPTION_COLORS = ['#1A1A1A', '#1A1A1A', '#1A1A1A'];

// Duration options
const DURATION_OPTIONS = [
  { value: 0, label: 'Span' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];

// SVG Icons
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
    <path d="M12 6v6l4 2"/>
  </svg>
);

const TimerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2h4"/>
    <path d="M12 14l3-3"/>
    <circle cx="12" cy="14" r="8"/>
  </svg>
);

// Helper functions
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return 'Date';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTimeDisplay = (timeStr: string): string => {
  if (!timeStr) return 'Time';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const formatDurationDisplay = (duration: number): string => {
  if (!duration) return 'Span';
  if (duration < 60) return `${duration}m`;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return mins ? `${hours}.${mins === 30 ? '5' : mins/60}h` : `${hours}h`;
};

const formatTimeValue = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
  let h = hour;
  if (period === 'PM' && hour !== 12) h += 12;
  if (period === 'AM' && hour === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const parseTimeValue = (timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } => {
  if (!timeStr) return { hour: 9, minute: 0, period: 'AM' };
  const [h, m] = timeStr.split(':').map(Number);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return { hour, minute: m, period };
};

const getCalendarDays = (month: Date): (Date | null)[] => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startPadding = firstDay.getDay();
  const days: (Date | null)[] = [];
  
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, monthIndex, d));
  }
  return days;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const AvailabilityPicker: React.FC<AvailabilityPickerProps> = ({
  options,
  onChange,
  disabled = false,
  showLabel = true,
  labelText = 'Availability'
}) => {
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [timePickerError, setTimePickerError] = useState<string | null>(null);

  // Close picker on Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePicker(null);
      }
    };
    
    if (activePicker) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [activePicker]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setActivePicker(null);
    }
  };

  const openDatePicker = (optionId: string, currentDay: string) => {
    if (currentDay) {
      const [year, month] = currentDay.split('-').map(Number);
      setPickerMonth(new Date(year, month - 1));
    } else {
      setPickerMonth(new Date());
    }
    setActivePicker({ type: 'date', optionId });
  };

  const openTimePicker = (optionId: string, currentTime: string) => {
    if (currentTime) {
      const parsed = parseTimeValue(currentTime);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    } else {
      setSelectedHour(9);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
    }
    setTimePickerError(null);
    setActivePicker({ type: 'time', optionId });
  };

  const openDurationPicker = (optionId: string) => {
    setActivePicker({ type: 'duration', optionId });
  };

  const selectDate = (date: Date) => {
    if (!activePicker) return;
    const dateStr = formatLocalDate(date);
    const updated = options.map(opt => 
      opt.id === activePicker.optionId ? { ...opt, day: dateStr } : opt
    );
    onChange(updated);
    setActivePicker(null);
  };

  const confirmTime = () => {
    if (!activePicker) return;
    
    // Validate time is not in the past for today
    const option = options.find(o => o.id === activePicker.optionId);
    if (option?.day) {
      const today = new Date();
      const [year, month, day] = option.day.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      
      if (selectedDate.toDateString() === today.toDateString()) {
        const timeValue = formatTimeValue(selectedHour, selectedMinute, selectedPeriod);
        const [h, m] = timeValue.split(':').map(Number);
        const selectedDateTime = new Date(year, month - 1, day, h, m);
        
        if (selectedDateTime <= today) {
          setTimePickerError('Please select a future time');
          return;
        }
      }
    }
    
    const timeStr = formatTimeValue(selectedHour, selectedMinute, selectedPeriod);
    const updated = options.map(opt => 
      opt.id === activePicker.optionId ? { ...opt, time: timeStr } : opt
    );
    onChange(updated);
    setActivePicker(null);
    setTimePickerError(null);
  };

  const selectDuration = (duration: number) => {
    if (!activePicker) return;
    const updated = options.map(opt => 
      opt.id === activePicker.optionId ? { ...opt, duration } : opt
    );
    onChange(updated);
    setActivePicker(null);
  };

  return (
    <div className="availability-picker">
      {showLabel && (
        <label className="availability-picker-label">
          <span>{labelText}</span>
          <span className="availability-picker-hint">Select dates and times that work for you</span>
        </label>
      )}
      
      <div className="availability-picker-options">
        {options.map((opt, idx) => (
          <div 
            key={opt.id} 
            className={`availability-picker-option ${opt.day && opt.time ? 'filled' : ''}`}
          >
            <span 
              className="availability-picker-badge" 
              style={{ background: opt.color || OPTION_COLORS[idx] }}
            >
              {idx + 1}
            </span>
            
            {/* Date Picker Button */}
            <button
              type="button"
              className={`availability-picker-btn ${opt.day ? 'has-value' : ''}`}
              onClick={() => openDatePicker(opt.id, opt.day)}
              disabled={disabled}
            >
              <CalendarIcon />
              <span>{formatDateDisplay(opt.day)}</span>
            </button>
            
            {/* Time Picker Button */}
            <button
              type="button"
              className={`availability-picker-btn ${opt.time ? 'has-value' : ''}`}
              onClick={() => openTimePicker(opt.id, opt.time)}
              disabled={disabled}
            >
              <ClockIcon />
              <span>{formatTimeDisplay(opt.time)}</span>
            </button>
            
            {/* Duration Picker Button */}
            <button
              type="button"
              className={`availability-picker-btn availability-picker-duration ${opt.duration ? 'has-value' : ''}`}
              onClick={() => openDurationPicker(opt.id)}
              disabled={disabled}
            >
              <TimerIcon />
              <span>{formatDurationDisplay(opt.duration)}</span>
            </button>
          </div>
        ))}
      </div>
      
      {/* Picker Modals */}
      {activePicker && (
        <div className="availability-picker-overlay" onClick={handleOverlayClick}>
          {/* Date Picker */}
          {activePicker.type === 'date' && (
            <div className="availability-calendar-picker">
              <button 
                type="button" 
                className="availability-picker-close"
                onClick={() => setActivePicker(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <div className="availability-calendar-header">
                <button 
                  type="button"
                  onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1))}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <span className="availability-calendar-title">
                  {pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  type="button"
                  onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1))}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
              <div className="availability-calendar-weekdays">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="availability-calendar-days">
                {getCalendarDays(pickerMonth).map((date, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`availability-calendar-day ${!date ? 'empty' : ''} ${date && isToday(date) ? 'today' : ''} ${date && isPast(date) ? 'past' : ''}`}
                    disabled={!date || isPast(date)}
                    onClick={() => date && selectDate(date)}
                  >
                    {date?.getDate()}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Time Picker */}
          {activePicker.type === 'time' && (
            <div className="availability-time-picker">
              <button 
                type="button" 
                className="availability-picker-close"
                onClick={() => setActivePicker(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <div className="availability-time-display">
                <button 
                  type="button"
                  className="availability-time-value-btn"
                  onClick={() => setSelectedHour(prev => prev === 12 ? 1 : prev + 1)}
                >
                  {selectedHour}
                </button>
                <span className="availability-time-colon">:</span>
                <button 
                  type="button"
                  className="availability-time-value-btn"
                  onClick={() => setSelectedMinute(prev => prev === 45 ? 0 : prev + 15)}
                >
                  {selectedMinute.toString().padStart(2, '0')}
                </button>
                <button 
                  type="button"
                  className="availability-time-value-btn availability-time-period"
                  onClick={() => setSelectedPeriod(prev => prev === 'AM' ? 'PM' : 'AM')}
                >
                  {selectedPeriod}
                </button>
              </div>
              {timePickerError && (
                <div className="availability-time-error">{timePickerError}</div>
              )}
              <div className="availability-time-actions">
                <button type="button" onClick={() => setActivePicker(null)} className="availability-time-cancel">
                  Cancel
                </button>
                <button type="button" onClick={confirmTime} className="availability-time-confirm">
                  Confirm
                </button>
              </div>
            </div>
          )}
          
          {/* Duration Picker */}
          {activePicker.type === 'duration' && (
            <div className="availability-duration-picker">
              <button 
                type="button" 
                className="availability-picker-close"
                onClick={() => setActivePicker(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <div className="availability-duration-title">Duration</div>
              <div className="availability-duration-options">
                {DURATION_OPTIONS.filter(d => d.value > 0).map(d => (
                  <button
                    key={d.value}
                    type="button"
                    className={`availability-duration-option ${options.find(o => o.id === activePicker.optionId)?.duration === d.value ? 'selected' : ''}`}
                    onClick={() => selectDuration(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityPicker;

