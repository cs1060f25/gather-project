import React, { useState, useMemo } from 'react';
import './WeeklyCalendar.css';

export interface CalendarEvent {
  id: string;
  date: string;
  time?: string;
  endTime?: string;
  title: string;
  category: 'work' | 'personal' | 'travel' | 'gatherly';
  duration?: number;
  attendees?: string[];
  location?: string;
  description?: string;
  source?: 'google' | 'manual' | 'chat' | 'gatherly';
  calendarId?: string;
  calendarName?: string;
  important?: boolean;
  isGatherlyEvent?: boolean;
  suggestedTimes?: { date: string; time: string; color: string }[];
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface GoogleCalendar {
  id: string;
  name: string;
  color: string;
  selected: boolean;
}

export interface TimeOption {
  date: string;
  time: string;
  duration: number;
  color: string;
}

interface WeeklyCalendarProps {
  events: CalendarEvent[];
  calendars: GoogleCalendar[];
  onCalendarToggle: (calendarId: string) => void;
  selectedTimeOptions?: TimeOption[];
  editingMode?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: string, time: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTimeLabel = (hour: number) => {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h} ${suffix}`;
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const getEventTop = (time?: string): number => {
  if (!time) return 0;
  const minutes = timeToMinutes(time);
  const startMinutes = 7 * 60; // 7 AM
  return ((minutes - startMinutes) / 60) * 60; // 60px per hour
};

const getEventHeight = (startTime?: string, endTime?: string, duration?: number): number => {
  if (startTime && endTime) {
    const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    return Math.max(30, (diff / 60) * 60);
  }
  if (duration) {
    return Math.max(30, (duration / 60) * 60);
  }
  return 60; // Default 1 hour
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  events,
  calendars,
  onCalendarToggle,
  selectedTimeOptions = [],
  editingMode = false,
  onEventClick,
  onTimeSlotClick
}) => {
  const [today] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay()); // Go to Sunday
    return d;
  });

  // Get the 7 days of current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const goToday = () => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
  };

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  // Filter events for selected calendars
  const filteredEvents = useMemo(() => {
    const selectedCalendarIds = calendars.filter(c => c.selected).map(c => c.id);
    return events.filter(e => {
      if (e.isGatherlyEvent) return true; // Always show Gatherly events
      if (!e.calendarId) return true; // Show events without calendar ID
      return selectedCalendarIds.includes(e.calendarId);
    });
  }, [events, calendars]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateISO = fmtDateISO(date);
    return filteredEvents.filter(e => e.date === dateISO);
  };

  // Get time options for a specific day
  const getTimeOptionsForDay = (date: Date) => {
    const dateISO = fmtDateISO(date);
    return selectedTimeOptions.filter(opt => opt.date === dateISO);
  };

  const monthLabel = weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={`weekly-calendar ${editingMode ? 'editing-mode' : ''}`}>
      {/* Header */}
      <header className="wc-header">
        <div className="wc-header-left">
          <h2 className="wc-month">{monthLabel}</h2>
        </div>
        <div className="wc-header-center">
          <div className="wc-nav">
            <button className="wc-nav-btn" onClick={goPrev} aria-label="Previous week">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button className="wc-today-btn" onClick={goToday}>Today</button>
            <button className="wc-nav-btn" onClick={goNext} aria-label="Next week">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="wc-header-right">
          {/* Calendar toggles */}
          <div className="wc-calendar-toggles">
            {calendars.map(cal => (
              <label key={cal.id} className="wc-cal-toggle" style={{ '--cal-color': cal.color } as React.CSSProperties}>
                <input
                  type="checkbox"
                  checked={cal.selected}
                  onChange={() => onCalendarToggle(cal.id)}
                />
                <span className="wc-cal-checkbox"></span>
                <span className="wc-cal-name">{cal.name}</span>
              </label>
            ))}
          </div>
        </div>
      </header>

      {/* Week Grid */}
      <div className="wc-grid-container">
        {/* Time column */}
        <div className="wc-time-column">
          <div className="wc-day-header-spacer"></div>
          {HOURS.map(hour => (
            <div key={hour} className="wc-time-slot">
              <span>{fmtTimeLabel(hour)}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="wc-days-container">
          {weekDays.map((date, i) => {
            const dateISO = fmtDateISO(date);
            const isToday = dateISO === fmtDateISO(today);
            const dayEvents = getEventsForDay(date);
            const dayTimeOptions = getTimeOptionsForDay(date);

            return (
              <div key={i} className={`wc-day-column ${isToday ? 'is-today' : ''}`}>
                {/* Day header */}
                <div className="wc-day-header">
                  <span className="wc-day-name">{DAYS[date.getDay()]}</span>
                  <span className={`wc-day-number ${isToday ? 'today' : ''}`}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Hour slots */}
                <div className="wc-day-slots">
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="wc-hour-slot"
                      onClick={() => onTimeSlotClick?.(dateISO, `${pad(hour)}:00`)}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map(event => {
                    const top = getEventTop(event.time);
                    const height = getEventHeight(event.time, event.endTime, event.duration);
                    
                    return (
                      <div
                        key={event.id}
                        className={`wc-event ${event.category} ${event.isGatherlyEvent ? 'gatherly-event' : ''} ${event.status === 'pending' ? 'pending' : ''}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="wc-event-time">
                          {event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'All day'}
                        </div>
                        <div className="wc-event-title">{event.title}</div>
                        {event.location && <div className="wc-event-location">📍 {event.location}</div>}
                      </div>
                    );
                  })}

                  {/* Time option indicators (during editing) */}
                  {editingMode && dayTimeOptions.map((opt, idx) => {
                    const top = getEventTop(opt.time);
                    const height = getEventHeight(opt.time, undefined, opt.duration);
                    
                    return (
                      <div
                        key={`opt-${idx}`}
                        className="wc-time-option"
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          '--option-color': opt.color
                        } as React.CSSProperties}
                      >
                        <span className="wc-option-label">Option {idx + 1}</span>
                        <span className="wc-option-time">
                          {new Date(`2000-01-01T${opt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;

