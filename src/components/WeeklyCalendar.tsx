import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  color?: string; // Calendar color for the event
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
  label?: string;
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

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 6 AM to 12 AM (midnight)
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
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerView, setPickerView] = useState<'months' | 'years'>('months');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCalendarDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
        setPickerView('months');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigate to a specific month
  const goToMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1);
    // Find the Sunday of that week
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
    setShowDatePicker(false);
    setPickerView('months');
  };

  // Month names for picker
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Generate year range for picker
  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 12 }, (_, i) => pickerYear - 5 + i);

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
    const gatherlyCalendar = calendars.find(c => c.id === 'gatherly');
    const showGatherlyEvents = gatherlyCalendar?.selected !== false;

    return events.filter(e => {
      // Don't show confirmed/cancelled Gatherly events in the Gatherly calendar 
      // (they should appear on their target calendar)
      if (e.isGatherlyEvent && (e.status === 'confirmed' || e.status === 'cancelled')) {
        return false;
      }
      // Handle Gatherly events based on Gatherly Events toggle
      if (e.isGatherlyEvent || e.calendarId === 'gatherly') {
        return showGatherlyEvents;
      }
      if (!e.calendarId) return true; // Show events without calendar ID
      return selectedCalendarIds.includes(e.calendarId);
    });
  }, [events, calendars]);

  // Get calendar color for an event
  const getEventColor = (event: CalendarEvent): string => {
    if (event.color) return event.color;
    if (event.calendarId) {
      const cal = calendars.find(c => c.id === event.calendarId);
      if (cal) return cal.color;
    }
    // Default colors based on category
    switch (event.category) {
      case 'gatherly': return '#22c55e';
      case 'work': return '#3b82f6';
      case 'travel': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  // Extended event type for positioned events
  interface PositionedEvent extends CalendarEvent {
    column: number;
    totalColumns: number;
  }

  // Get events for a specific day with overlap handling
  const getEventsForDay = (date: Date): PositionedEvent[] => {
    const dateISO = fmtDateISO(date);
    // Filter events for this day AND with valid times within our display range (6 AM - midnight)
    const dayEvents = filteredEvents.filter(e => {
      if (e.date !== dateISO) return false;
      if (!e.time) return false; // Skip events without time
      const minutes = timeToMinutes(e.time);
      // Only show events between 6 AM (360 min) and midnight (1440 min)
      return minutes >= 360 && minutes < 1440;
    });
    
    // Sort by start time
    dayEvents.sort((a, b) => {
      const aTime = a.time ? timeToMinutes(a.time) : 0;
      const bTime = b.time ? timeToMinutes(b.time) : 0;
      return aTime - bTime;
    });
    
    // Calculate overlap groups for positioning
    const positioned: PositionedEvent[] = [];
    
    for (let idx = 0; idx < dayEvents.length; idx++) {
      const event = dayEvents[idx];
      const eventStart = event.time ? timeToMinutes(event.time) : 0;
      const eventEnd = event.endTime ? timeToMinutes(event.endTime) : 
                       event.duration ? eventStart + event.duration : eventStart + 60;
      
      // Find overlapping events
      let column = 0;
      let totalColumns = 1;
      
      for (let i = 0; i < idx; i++) {
        const prevEvent = dayEvents[i];
        const prevStart = prevEvent.time ? timeToMinutes(prevEvent.time) : 0;
        const prevEnd = prevEvent.endTime ? timeToMinutes(prevEvent.endTime) :
                       prevEvent.duration ? prevStart + prevEvent.duration : prevStart + 60;
        
        // Check if overlapping
        if (eventStart < prevEnd && eventEnd > prevStart) {
          const prevPositioned = positioned[i];
          column = Math.max(column, (prevPositioned?.column || 0) + 1);
          totalColumns = Math.max(totalColumns, column + 1);
        }
      }
      
      // Create positioned event without spread
      const posEvent: PositionedEvent = {
        id: event.id,
        date: event.date,
        time: event.time,
        endTime: event.endTime,
        title: event.title,
        category: event.category,
        duration: event.duration,
        attendees: event.attendees,
        location: event.location,
        description: event.description,
        source: event.source,
        calendarId: event.calendarId,
        calendarName: event.calendarName,
        important: event.important,
        isGatherlyEvent: event.isGatherlyEvent,
        suggestedTimes: event.suggestedTimes,
        status: event.status,
        color: event.color,
        column,
        totalColumns
      };
      positioned.push(posEvent);
    }
    
    // Update totalColumns for all overlapping events
    const result: PositionedEvent[] = [];
    for (const event of positioned) {
      const eventStart = event.time ? timeToMinutes(event.time) : 0;
      const eventEnd = event.endTime ? timeToMinutes(event.endTime) :
                       event.duration ? eventStart + event.duration : eventStart + 60;
      
      let maxColumns = event.totalColumns;
      for (const other of positioned) {
        if (other.id === event.id) continue;
        const otherStart = other.time ? timeToMinutes(other.time) : 0;
        const otherEnd = other.endTime ? timeToMinutes(other.endTime) :
                        other.duration ? otherStart + other.duration : otherStart + 60;
        
        if (eventStart < otherEnd && eventEnd > otherStart) {
          maxColumns = Math.max(maxColumns, other.totalColumns);
        }
      }
      
      // Create result event without spread
      const resultEvent: PositionedEvent = {
        id: event.id,
        date: event.date,
        time: event.time,
        endTime: event.endTime,
        title: event.title,
        category: event.category,
        duration: event.duration,
        attendees: event.attendees,
        location: event.location,
        description: event.description,
        source: event.source,
        calendarId: event.calendarId,
        calendarName: event.calendarName,
        important: event.important,
        isGatherlyEvent: event.isGatherlyEvent,
        suggestedTimes: event.suggestedTimes,
        status: event.status,
        color: event.color,
        column: event.column,
        totalColumns: maxColumns
      };
      result.push(resultEvent);
    }
    
    return result;
  };

  // Extended time option with index
  interface IndexedTimeOption extends TimeOption {
    globalIdx: number;
  }

  // Get time options for a specific day with their global index
  const getTimeOptionsForDay = (date: Date): IndexedTimeOption[] => {
    const dateISO = fmtDateISO(date);
    const result: IndexedTimeOption[] = [];
    
    for (let i = 0; i < selectedTimeOptions.length; i++) {
      const opt = selectedTimeOptions[i];
      if (opt.date === dateISO) {
        result.push({
          date: opt.date,
          time: opt.time,
          duration: opt.duration,
          color: opt.color,
          label: opt.label,
          globalIdx: i
        });
      }
    }
    
    return result;
  };

  const monthLabel = weekStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const selectedCalendarCount = calendars.filter(c => c.selected).length;

  // Calculate position as percentage of total hours (6 AM to midnight = 19 hours)
  const getEventTopPercent = (time?: string): number => {
    if (!time) return 0;
    const minutes = timeToMinutes(time);
    const startMinutes = 6 * 60; // 6 AM
    const totalMinutes = 19 * 60; // 19 hours (6 AM - 1 AM next day)
    const percent = ((minutes - startMinutes) / totalMinutes) * 100;
    // Clamp to valid range - events outside 6AM-midnight should be hidden
    if (percent < 0 || percent > 100) return -1000; // Move off-screen
    return percent;
  };

  const getEventHeightPercent = (startTime?: string, endTime?: string, duration?: number): number => {
    const totalMinutes = 19 * 60; // 19 hours
    if (startTime && endTime) {
      const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
      return Math.max(2, Math.min((diff / totalMinutes) * 100, 100));
    }
    if (duration) {
      return Math.max(2, Math.min((duration / totalMinutes) * 100, 100));
    }
    return (60 / totalMinutes) * 100; // Default 1 hour
  };

  return (
    <div className={`weekly-calendar ${editingMode ? 'editing-mode' : ''}`}>
      {/* Top Controls Bar */}
      <div className="wc-top-bar">
        {/* Month Label - left (clickable date picker) */}
        <div className="wc-date-picker-wrapper" ref={datePickerRef}>
          <button 
            className="wc-month-label"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setPickerYear(weekStart.getFullYear());
              setPickerView('months');
            }}
          >
            {monthLabel}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={showDatePicker ? 'rotated' : ''}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          
          {showDatePicker && (
            <div className="wc-date-picker">
              {/* Year header */}
              <div className="wc-picker-header">
                <button 
                  className="wc-picker-nav"
                  onClick={() => setPickerYear(y => y - 1)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button 
                  className="wc-picker-year"
                  onClick={() => setPickerView(v => v === 'months' ? 'years' : 'months')}
                >
                  {pickerYear}
                </button>
                <button 
                  className="wc-picker-nav"
                  onClick={() => setPickerYear(y => y + 1)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
              
              {/* Month grid or Year grid */}
              {pickerView === 'months' ? (
                <div className="wc-picker-grid wc-months-grid">
                  {MONTHS.map((month, idx) => {
                    const isCurrentMonth = idx === today.getMonth() && pickerYear === today.getFullYear();
                    const isSelectedMonth = idx === weekStart.getMonth() && pickerYear === weekStart.getFullYear();
                    return (
                      <button
                        key={month}
                        className={`wc-picker-item ${isCurrentMonth ? 'current' : ''} ${isSelectedMonth ? 'selected' : ''}`}
                        onClick={() => goToMonth(pickerYear, idx)}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="wc-picker-grid wc-years-grid">
                  {yearRange.map((year) => {
                    const isCurrentYear = year === currentYear;
                    const isSelectedYear = year === pickerYear;
                    return (
                      <button
                        key={year}
                        className={`wc-picker-item ${isCurrentYear ? 'current' : ''} ${isSelectedYear ? 'selected' : ''}`}
                        onClick={() => {
                          setPickerYear(year);
                          setPickerView('months');
                        }}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Quick actions */}
              <div className="wc-picker-footer">
                <button 
                  className="wc-picker-today"
                  onClick={() => {
                    goToMonth(today.getFullYear(), today.getMonth());
                  }}
                >
                  Today
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation - center */}
        <div className="wc-nav-bubble">
            <button className="wc-nav-btn" onClick={goPrev} aria-label="Previous week">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button className="wc-today-btn" onClick={goToday}>Today</button>
            <button className="wc-nav-btn" onClick={goNext} aria-label="Next week">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        
        {/* Views Dropdown - right */}
        <div className="wc-views-dropdown" ref={dropdownRef}>
          <button 
            className="wc-dropdown-toggle"
            onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Views ({selectedCalendarCount})</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={showCalendarDropdown ? 'rotated' : ''}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          
          {showCalendarDropdown && (
            <div className="wc-dropdown-menu">
            {calendars.map(cal => (
                <label key={cal.id} className="wc-dropdown-item" style={{ '--cal-color': cal.color } as React.CSSProperties}>
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
          )}
        </div>
      </div>

      {/* Week Grid */}
      <div className="wc-grid-container">
        {/* Time column */}
        <div className="wc-time-column">
          <div className="wc-day-header-spacer"></div>
          <div className="wc-time-slots-container">
          {HOURS.map(hour => (
            <div key={hour} className="wc-time-slot">
              <span>{fmtTimeLabel(hour)}</span>
            </div>
          ))}
          </div>
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
                  {dayEvents.map((event) => {
                    const eventTime = event.time;
                    const eventEndTime = event.endTime;
                    const eventDuration = event.duration;
                    const topPercent = getEventTopPercent(eventTime);
                    const heightPercent = getEventHeightPercent(eventTime, eventEndTime, eventDuration);
                    const eventColor = getEventColor(event);
                    const cols = event.totalColumns || 1;
                    const col = event.column || 0;
                    const width = cols > 1 ? `${100 / cols - 2}%` : 'calc(100% - 4px)';
                    const left = cols > 1 ? `${(col / cols) * 100 + 1}%` : '2px';
                    const isShortEvent = heightPercent < 5;
                    
                    return (
                      <div
                        key={event.id}
                        className={`wc-event ${event.isGatherlyEvent ? 'gatherly-event' : ''} ${event.status === 'pending' ? 'pending' : ''} ${isShortEvent ? 'short-event' : ''}`}
                        style={{ 
                          top: `${topPercent}%`, 
                          height: `${Math.max(heightPercent, 2.5)}%`,
                          width,
                          left,
                          right: 'auto',
                          '--event-color': eventColor
                        } as React.CSSProperties}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={`${event.title}${event.time ? ` at ${new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}${event.location ? ` • ${event.location}` : ''}`}
                      >
                        {isShortEvent ? (
                          <div className="wc-event-compact">
                            <span className="wc-event-time">
                              {event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                            </span>
                            <span className="wc-event-title">{event.title}</span>
                          </div>
                        ) : (
                          <>
                        <div className="wc-event-time">
                          {event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'All day'}
                        </div>
                        <div className="wc-event-title">{event.title}</div>
                            {event.location && heightPercent >= 7 && <div className="wc-event-location">📍 {event.location}</div>}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Time option indicators (during editing) - show above existing events */}
                  {editingMode && dayTimeOptions.map((opt) => {
                    const optTime = opt.time;
                    const optDuration = opt.duration;
                    const topPercent = getEventTopPercent(optTime);
                    const heightPercent = getEventHeightPercent(optTime, undefined, optDuration);
                    const optionNumber = (opt.globalIdx || 0) + 1;
                    
                    return (
                      <div
                        key={`opt-${opt.globalIdx}`}
                        className="wc-time-option"
                        style={{ 
                          top: `${topPercent}%`, 
                          height: `${heightPercent}%`,
                        } as React.CSSProperties}
                      >
                        <span className="wc-option-badge">{optionNumber}</span>
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

