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
  isGatherlyScheduled?: boolean; // Google Calendar event that was created via Gatherly
  suggestedTimes?: { date: string; time: string; color: string }[];
  status?: 'pending' | 'confirmed' | 'cancelled';
  color?: string; // Calendar color for the event
  optionNumber?: number; // 1, 2, or 3 for pending Gatherly event options
  htmlLink?: string; // Direct link to view event in Google Calendar
  responses?: { email: string; selectedOptions: number[]; respondedAt?: string }[]; // Participant responses for pending events
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
  loading?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM (full 24 hours)
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTimeLabel = (hour: number) => {
  // Handle midnight (24 or 0)
  if (hour === 24 || hour === 0) return '12 AM';
  const suffix = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour;
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
  onTimeSlotClick,
  loading = false
}) => {
  // Use a function to always get fresh "today" date (handles midnight rollover)
  const getToday = () => new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const d = getToday();
    d.setDate(d.getDate() - d.getDay()); // Go to Sunday
    return d;
  });
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerView, setPickerView] = useState<'months' | 'years'>('months');
  // Track the display month/year separately from weekStart (which may be in previous month)
  const [displayMonth, setDisplayMonth] = useState(() => getToday().getMonth());
  const [displayYear, setDisplayYear] = useState(() => getToday().getFullYear());
  // Hover preview state
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to 6 AM when component mounts
  useEffect(() => {
    if (gridContainerRef.current) {
      // Calculate scroll position for 6 AM (6 hours into 24-hour day)
      const slotHeight = 40; // --wc-slot-height
      const scrollTo6AM = 6 * slotHeight - 20; // Scroll to just before 6 AM
      gridContainerRef.current.scrollTop = scrollTo6AM;
    }
  }, []);

  // Close dropdowns when clicking outside - use 'click' instead of 'mousedown' 
  // to avoid interfering with button click handlers
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

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Month names for picker - defined as constant outside to avoid recreation
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Navigate to a specific month/year
  const goToMonth = (year: number, month: number) => {
    // Start with the 1st of the month
    const firstOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstOfMonth.getDay(); // 0 = Sunday
    
    // Find the Sunday of the week containing the 1st of the month
    // This ensures we see the beginning of the selected month
    const weekStartDate = new Date(year, month, 1 - dayOfWeek);
    
    console.log(`goToMonth: ${year}-${month + 1}, weekStart:`, weekStartDate.toDateString());
    
    setWeekStart(new Date(weekStartDate));
    // Store the actual month/year the user selected (for display)
    setDisplayMonth(month);
    setDisplayYear(year);
    setShowDatePicker(false);
    setPickerView('months');
    setHoveredMonth(null);
  };

  // Handle month button click - uses current pickerYear state
  const handleMonthClick = (monthIndex: number) => {
    goToMonth(pickerYear, monthIndex);
  };

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
    const now = getToday();
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
    setDisplayMonth(now.getMonth());
    setDisplayYear(now.getFullYear());
    // Also update picker year to match current year
    setPickerYear(now.getFullYear());
  };

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
    // Update display month/year based on new week's Wednesday (middle of week)
    const midWeek = new Date(d);
    midWeek.setDate(d.getDate() + 3);
    setDisplayMonth(midWeek.getMonth());
    setDisplayYear(midWeek.getFullYear());
  };

  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
    // Update display month/year based on new week's Wednesday (middle of week)
    const midWeek = new Date(d);
    midWeek.setDate(d.getDate() + 3);
    setDisplayMonth(midWeek.getMonth());
    setDisplayYear(midWeek.getFullYear());
  };

  // Filter events for selected calendars
  const filteredEvents = useMemo(() => {
    const selectedCalendarIds = calendars.filter(c => c.selected).map(c => c.id);
    const gatherlyCalendar = calendars.find(c => c.id === 'gatherly');
    const gatherlyPendingCalendar = calendars.find(c => c.id === 'gatherly-pending');
    const showConfirmedGatherly = gatherlyCalendar?.selected !== false;
    const showPendingGatherly = gatherlyPendingCalendar?.selected !== false;

    return events.filter(e => {
      // Don't show cancelled Gatherly events
      if (e.isGatherlyEvent && e.status === 'cancelled') {
        return false;
      }
      // Handle Gatherly scheduled events (Google Calendar events created via Gatherly)
      if (e.isGatherlyScheduled) {
        return showConfirmedGatherly;
      }
      // Handle Gatherly confirmed events
      if (e.calendarId === 'gatherly') {
        return showConfirmedGatherly;
      }
      // Handle Gatherly pending events
      if (e.calendarId === 'gatherly-pending') {
        return showPendingGatherly;
      }
      // Handle legacy gatherly events without specific calendar
      if (e.isGatherlyEvent && !e.calendarId) {
        return e.status === 'confirmed' ? showConfirmedGatherly : showPendingGatherly;
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
    // Filter events for this day AND with valid times within our display range (12 AM - 11:59 PM)
    const dayEvents = filteredEvents.filter(e => {
      if (e.date !== dateISO) return false;
      if (!e.time) return false; // Skip events without time (all-day events)
      const minutes = timeToMinutes(e.time);
      // Show all events from 12 AM (0 min) to 11:59 PM (1439 min)
      return minutes >= 0 && minutes < 1440;
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
        optionNumber: event.optionNumber,
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
        optionNumber: event.optionNumber,
        column: event.column,
        totalColumns: maxColumns
      };
      result.push(resultEvent);
    }
    
    return result;
  };

  // Get all-day events for a specific day (events without time, like holidays)
  const getAllDayEventsForDay = (date: Date): CalendarEvent[] => {
    const dateISO = fmtDateISO(date);
    return filteredEvents.filter(e => e.date === dateISO && !e.time);
  };

  // Calculate max all-day events for consistent row height
  const maxAllDayEvents = useMemo(() => {
    let max = 0;
    for (const date of weekDays) {
      const count = getAllDayEventsForDay(date).length;
      if (count > max) max = count;
    }
    return max;
  }, [weekDays, filteredEvents]);

  // Check if any day in the current week has all-day events
  const hasAnyAllDayEvents = maxAllDayEvents > 0;
  
  // Calculate the height needed for all-day row (20px per event + 8px padding)
  const allDayRowHeight = maxAllDayEvents > 0 ? Math.min(maxAllDayEvents, 3) * 20 + 8 : 0;

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

  // Show hover preview or actual display month/year
  const monthLabel = useMemo(() => {
    if (hoveredMonth !== null && showDatePicker) {
      // Show preview of hovered month
      return `${MONTHS[hoveredMonth]} ${pickerYear}`;
    }
    // Show the actual selected month/year
    return `${MONTHS[displayMonth]} ${displayYear}`;
  }, [hoveredMonth, showDatePicker, pickerYear, displayMonth, displayYear, MONTHS]);

  const selectedCalendarCount = calendars.filter(c => c.selected).length;

  // Calculate position as percentage of total hours (12 AM to 11 PM = 24 hours)
  const CALENDAR_START_HOUR = 0; // 12 AM
  const CALENDAR_HOURS = 24; // 24 hours total
  const START_MINUTES = CALENDAR_START_HOUR * 60;
  const MIN_EVENT_HEIGHT_HOURS = 0.5; // Minimum 30 minutes visual height

  // Returns the number of hours from calendar start (used with CSS calc and --wc-slot-height)
  const getEventTopHours = (time?: string): number => {
    if (!time) return 0;
    const minutes = timeToMinutes(time);
    const hoursFromStart = (minutes - START_MINUTES) / 60;
    // Clamp to valid range (0 to 24 hours)
    if (hoursFromStart < 0) return 0;
    if (hoursFromStart > CALENDAR_HOURS) return CALENDAR_HOURS;
    return hoursFromStart;
  };

  // Returns the height in hours (used with CSS calc and --wc-slot-height)
  const getEventHeightHours = (startTime?: string, endTime?: string, duration?: number): number => {
    if (startTime && endTime) {
      const diffMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
      const hours = Math.max(MIN_EVENT_HEIGHT_HOURS, Math.min(diffMinutes / 60, CALENDAR_HOURS));
      return hours;
    }
    if (duration) {
      const hours = Math.max(MIN_EVENT_HEIGHT_HOURS, Math.min(duration / 60, CALENDAR_HOURS));
      return hours;
    }
    return 1; // Default 1 hour
  };

  // Check if event is short (less than 45 minutes for compact display)
  const isEventShort = (startTime?: string, endTime?: string, duration?: number): boolean => {
    const heightHours = getEventHeightHours(startTime, endTime, duration);
    return heightHours < 0.75; // Less than 45 minutes
  };

  return (
    <div className={`weekly-calendar ${editingMode ? 'editing-mode' : ''}`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="wc-loading-overlay">
          <div className="wc-loading-spinner"></div>
          <p>Syncing calendar...</p>
        </div>
      )}
      
      {/* Top Controls Bar */}
      <div className="wc-top-bar">
        {/* Month Label - left (clickable date picker) */}
        <div className="wc-date-picker-wrapper" ref={datePickerRef}>
          <button 
            className={`wc-month-label ${hoveredMonth !== null && showDatePicker ? 'previewing' : ''}`}
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setPickerYear(displayYear);
              setPickerView('months');
              setHoveredMonth(null);
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
                <div 
                  className="wc-picker-grid wc-months-grid"
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {MONTHS.map((month, idx) => {
                    const now = getToday();
                    const isCurrentMonth = idx === now.getMonth() && pickerYear === now.getFullYear();
                    const isSelectedMonth = idx === displayMonth && pickerYear === displayYear;
                    const isHovered = hoveredMonth === idx;
                    return (
                      <button
                        key={`month-${idx}`}
                        type="button"
                        className={`wc-picker-item ${isCurrentMonth ? 'current' : ''} ${isSelectedMonth ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                        onClick={() => handleMonthClick(idx)}
                        onMouseEnter={() => setHoveredMonth(idx)}
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
                        key={`year-${year}`}
                        type="button"
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
                    goToday();
                    setPickerView('months');
                    setShowDatePicker(false);
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
      <div className="wc-grid-container" ref={gridContainerRef}>
        {/* Time column */}
        <div className="wc-time-column">
          <div className="wc-day-header-spacer"></div>
          {/* All-day spacer - must match height of all-day events row */}
          {hasAnyAllDayEvents && (
            <div className="wc-all-day-spacer" style={{ height: `${allDayRowHeight}px`, minHeight: `${allDayRowHeight}px` }}></div>
          )}
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
            const isToday = dateISO === fmtDateISO(getToday());
            const dayEvents = getEventsForDay(date);
            const dayTimeOptions = getTimeOptionsForDay(date);
            const allDayEvents = getAllDayEventsForDay(date);

            return (
              <div key={i} className={`wc-day-column ${isToday ? 'is-today' : ''}`}>
                {/* Day header */}
                <div className="wc-day-header">
                  <span className="wc-day-name">{DAYS[date.getDay()]}</span>
                  <span className={`wc-day-number ${isToday ? 'today' : ''}`}>
                    {date.getDate()}
                  </span>
                </div>

                {/* All-day events row - shown on all columns when any day has all-day events */}
                {hasAnyAllDayEvents && (
                  <div 
                    className="wc-all-day-events"
                    style={{ height: `${allDayRowHeight}px`, minHeight: `${allDayRowHeight}px` }}
                  >
                    {allDayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="wc-all-day-event"
                        style={{ backgroundColor: event.color || '#e3e4e6' }}
                        title={event.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {allDayEvents.length > 3 && (
                      <div className="wc-all-day-more">+{allDayEvents.length - 3} more</div>
                    )}
                  </div>
                )}

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
                    const topHours = getEventTopHours(eventTime);
                    const heightHours = getEventHeightHours(eventTime, eventEndTime, eventDuration);
                    const eventColor = getEventColor(event);
                    const cols = event.totalColumns || 1;
                    const col = event.column || 0;
                    const width = cols > 1 ? `${100 / cols - 2}%` : 'calc(100% - 4px)';
                    const left = cols > 1 ? `${(col / cols) * 100 + 1}%` : '2px';
                    const isShort = isEventShort(eventTime, eventEndTime, eventDuration);
                    
                    return (
                      <div
                        key={event.id}
                        className={`wc-event ${event.isGatherlyEvent ? 'gatherly-event' : ''} ${event.isGatherlyScheduled ? 'gatherly-scheduled' : ''} ${event.status === 'pending' ? 'pending' : ''} ${event.status === 'confirmed' ? 'confirmed' : ''} ${isShort ? 'short-event' : ''}`}
                        style={{ 
                          top: `calc(${topHours} * var(--wc-slot-height))`, 
                          height: `calc(${heightHours} * var(--wc-slot-height))`,
                          width,
                          left,
                          right: 'auto',
                          '--event-color': eventColor
                        } as React.CSSProperties}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={`${event.title}${event.time ? ` at ${new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}${event.location ? ` • ${event.location}` : ''}${event.isGatherlyScheduled ? ' • Scheduled with Gatherly' : ''}`}
                      >
                        {/* Option number badge for pending Gatherly events */}
                        {event.isGatherlyEvent && event.status === 'pending' && event.optionNumber && (
                          <span className="wc-event-option-badge">{event.optionNumber}</span>
                        )}
                        {/* Response indicators for pending events */}
                        {event.isGatherlyEvent && event.status === 'pending' && event.responses && event.responses.length > 0 && (
                          <div className="wc-response-indicators" title={event.responses.map(r => {
                            const optIdx = event.optionNumber ? event.optionNumber - 1 : 0;
                            const selected = r.selectedOptions?.includes(optIdx);
                            return `${r.email.split('@')[0]}: ${selected ? '✓' : '✗'}`;
                          }).join('\n')}>
                            {event.responses.slice(0, 4).map((r, idx) => {
                              const optIdx = event.optionNumber ? event.optionNumber - 1 : 0;
                              const selected = r.selectedOptions?.includes(optIdx);
                              return (
                                <span 
                                  key={idx} 
                                  className={`wc-response-dot ${selected ? 'yes' : 'no'}`}
                                  title={`${r.email}: ${selected ? 'Available' : 'Not available'}`}
                                />
                              );
                            })}
                            {event.responses.length > 4 && <span className="wc-response-more">+{event.responses.length - 4}</span>}
                          </div>
                        )}
                        {/* Gatherly badge for confirmed events scheduled via Gatherly (Google Calendar events with marker) */}
                        {event.isGatherlyScheduled && (
                          <span className="wc-gatherly-badge" title="Scheduled with Gatherly">
                            <svg width="12" height="12" viewBox="-2 -2 28 28" fill="none">
                              <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
                                    stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2.5"/>
                              <path d="M6 14V18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M4 16H8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                        {isShort ? (
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
                            {event.location && heightHours >= 1.2 && <div className="wc-event-location">{event.location}</div>}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Time option indicators (during editing) - show above existing events */}
                  {editingMode && dayTimeOptions.map((opt) => {
                    const optTime = opt.time;
                    const optDuration = opt.duration;
                    const topHours = getEventTopHours(optTime);
                    const heightHours = getEventHeightHours(optTime, undefined, optDuration);
                    const optionNumber = (opt.globalIdx || 0) + 1;
                    
                    return (
                      <div
                        key={`opt-${opt.globalIdx}`}
                        className="wc-time-option"
                        style={{ 
                          top: `calc(${topHours} * var(--wc-slot-height))`, 
                          height: `calc(${heightHours} * var(--wc-slot-height))`,
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

