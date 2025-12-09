import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { SchedulingModal, type ScheduledEventData } from './SchedulingModal';

export interface ContactSuggestion {
  id: string;
  name: string;
  email: string;
}

interface CalendarEvent {
  id: string;
  date: string;
  time?: string;
  endTime?: string;
  title: string;
  category: 'work' | 'personal' | 'travel';
  duration?: number;
  attendees?: string[];
  location?: string;
  description?: string;
  source?: 'google' | 'manual' | 'chat';
  important?: boolean;
}

interface CalendarProps {
  contacts: ContactSuggestion[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORIES = {
  work: { label: 'Work', color: 'canary' },
  personal: { label: 'Personal', color: 'acid' },
  travel: { label: 'Travel', color: 'sky' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTimeLabel = (time?: string) => {
  if (!time) return 'All day';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const Calendar: React.FC<CalendarProps> = ({ contacts }) => {
  const [view] = useState<'month' | 'week' | 'agenda'>('month');
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filters] = useState({ work: true, personal: true, travel: true });
  const [showScheduler, setShowScheduler] = useState(false);
  const [popover, setPopover] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);

  // Load events from localStorage - no mock data
  const loadEvents = () => {
    const stored = localStorage.getItem('gatherly_events');
    if (stored) {
      setEvents(JSON.parse(stored));
    } else {
      // Start with empty events - no sample data
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
    
    // Listen for external updates (e.g., from chat bar or Google Calendar sync)
    const handleUpdate = () => loadEvents();
    window.addEventListener('gatherly_events_updated', handleUpdate);
    
    return () => window.removeEventListener('gatherly_events_updated', handleUpdate);
  }, [today]);

  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem('gatherly_events', JSON.stringify(newEvents));
  };

  const monthLabel = current.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const goToday = () => {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(new Date(today));
  };

  const goPrev = () => {
    if (view === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 7);
      setSelectedDate(newDate);
      setCurrent(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    } else {
      setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    }
  };

  const goNext = () => {
    if (view === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 7);
      setSelectedDate(newDate);
      setCurrent(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    } else {
      setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    }
  };

  const filteredEventsFor = (dateISO: string) => {
    return events
      .filter(e => e.date === dateISO && filters[e.category])
      .sort((a, b) => {
        // Important events first, then time
        if ((b.important ? 1 : 0) !== (a.important ? 1 : 0)) {
          return (b.important ? 1 : 0) - (a.important ? 1 : 0);
        }
        return (a.time || '').localeCompare(b.time || '');
      });
  };

  const handleScheduleSubmit = (data: ScheduledEventData) => {
    const category: CalendarEvent['category'] =
      data.priority === 'must' ? 'work' : data.priority === 'should' ? 'personal' : 'travel';

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: data.title,
      date: data.date,
      time: data.startTime || data.time,
      endTime: data.endTime,
      duration: data.duration,
      category,
      attendees: data.participants,
      location: data.location,
      description: data.notes,
      source: 'manual',
      important: data.priority !== 'maybe',
    };

    saveEvents([...events, newEvent]);
    setShowScheduler(false);
    window.dispatchEvent(new Event('gatherly_events_updated'));
  };

  const deleteEvent = (id: string) => {
    saveEvents(events.filter(e => e.id !== id));
    setPopover(null);
  };

  const renderMonthGrid = () => {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = 0; i < 42; i++) {
      let dayNum: number, dateObj: Date, inCurrent = true;

      if (i < startDay) {
        dayNum = prevMonthDays - startDay + i + 1;
        dateObj = new Date(year, month - 1, dayNum);
        inCurrent = false;
      } else if (i >= startDay + daysInMonth) {
        dayNum = i - (startDay + daysInMonth) + 1;
        dateObj = new Date(year, month + 1, dayNum);
        inCurrent = false;
      } else {
        dayNum = i - startDay + 1;
        dateObj = new Date(year, month, dayNum);
      }

      const dateISO = fmtDateISO(dateObj);
      const isToday = dateISO === fmtDateISO(today);
      const isSelected = dateISO === fmtDateISO(selectedDate);
      const dayEvents = filteredEventsFor(dateISO);

      cells.push(
        <div
          key={i}
          className={`calendar-cell ${!inCurrent ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => {
            setSelectedDate(dateObj);
            if (!inCurrent) {
              setCurrent(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
            }
          }}
        >
          <div className="cell-header">
            <span className="day-number">{dayNum}</span>
          </div>
          <div className="cell-events">
            {dayEvents.slice(0, 3).map(ev => (
              <button
                key={ev.id}
                className={`event-chip ${ev.category} ${ev.important ? 'important' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopover({ event: ev, x: e.clientX, y: e.clientY });
                }}
                aria-label={`${ev.title} at ${ev.time || 'all day'}`}
              >
                <span className="chip-time">{fmtTimeLabel(ev.time)}</span>
                <span className="chip-title">{ev.title}</span>
              </button>
            ))}
            {dayEvents.length > 3 && (
              <span className="more-events">+{dayEvents.length - 3}</span>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  const renderAgenda = () => {
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    const monthEvents = events
      .filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end && filters[e.category];
      })
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

    if (monthEvents.length === 0) {
      return <div className="agenda-empty">No events this month.</div>;
    }

    let lastDate = '';
    return monthEvents.map(e => {
      const showHeader = e.date !== lastDate;
      lastDate = e.date;
      const dateObj = new Date(e.date);
      
      return (
        <React.Fragment key={e.id}>
          {showHeader && (
            <div className="agenda-date-header">
              {dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          )}
          <div className="agenda-item">
            <span className={`event-dot ${e.category}`} />
            <div className="agenda-item-content">
              <div className="agenda-item-title">{e.title}</div>
              <div className="agenda-item-time">{e.time || 'All day'}</div>
            </div>
            <button 
              className="agenda-item-btn"
              onClick={(ev) => setPopover({ event: e, x: ev.clientX, y: ev.clientY })}
            >
              Open
            </button>
          </div>
        </React.Fragment>
      );
    });
  };

  // Get upcoming events for suggestions
  const getUpcomingEvents = () => {
    const todayISO = fmtDateISO(today);
    return events
      .filter(e => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 3);
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="calendar-container">
      {/* Header */}
      <header className="calendar-header">
        <div className="header-left">
          <div className="month-title">{monthLabel}</div>
        </div>
        <div className="header-center">
          <div className="nav-group">
            <button className="btn btn-icon" onClick={goPrev} aria-label="Previous">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button className="btn btn-today" onClick={goToday}>Today</button>
            <button className="btn btn-icon" onClick={goNext} aria-label="Next">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-schedule"
            onClick={() => setShowScheduler(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Schedule
          </button>
        </div>
      </header>

      <SchedulingModal
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        contacts={contacts}
        defaultDate={fmtDateISO(selectedDate)}
        onSubmit={handleScheduleSubmit}
      />

      {/* Upcoming Events Bar */}
      {upcomingEvents.length > 0 && (
        <div className="upcoming-bar">
          <span className="upcoming-label">Coming up:</span>
          {upcomingEvents.map(ev => (
            <div key={ev.id} className={`upcoming-chip ${ev.category}`}>
              <span className="upcoming-title">{ev.title}</span>
              <span className="upcoming-time">{ev.time || 'All day'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="calendar-content">
        {/* Calendar Grid */}
        <section className="calendar-panel">
          {view === 'month' && (
            <>
              <div className="weekday-header">
                {WEEKDAYS.map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              <div className="month-grid">
                {renderMonthGrid()}
              </div>
            </>
          )}
          {view === 'agenda' && (
            <div className="agenda-view">
              {renderAgenda()}
            </div>
          )}
        </section>

      </div>

      {/* Event Popover */}
      {popover && (
        <>
          <div className="popover-backdrop" onClick={() => setPopover(null)} />
          <div 
            className="event-popover"
            style={{ left: Math.min(window.innerWidth - 300, popover.x + 12), top: Math.min(window.innerHeight - 200, popover.y + 12) }}
          >
            <div className="popover-header">
              <h3>{popover.event.title}</h3>
              <button onClick={() => setPopover(null)}>✕</button>
            </div>
            <p className="popover-date">
              {new Date(popover.event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="popover-time">
              {popover.event.time ? `Time: ${fmtTimeLabel(popover.event.time)}${popover.event.endTime ? ` — ${fmtTimeLabel(popover.event.endTime)}` : ''}` : 'All day'}
            </p>
            {popover.event.location && (
              <p className="popover-location">{popover.event.location}</p>
            )}
            {popover.event.attendees && popover.event.attendees.length > 0 && (
              <div className="popover-attendees">
                <span>Attendees:</span>
                <ul>
                  {popover.event.attendees.map(email => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
            {popover.event.description && (
              <p className="popover-notes">{popover.event.description}</p>
            )}
            <span className={`popover-category ${popover.event.category}`}>
              {CATEGORIES[popover.event.category].label}
            </span>
            {popover.event.source && (
              <span className="popover-source">{popover.event.source === 'google' ? 'Google Calendar' : 'Gatherly'}</span>
            )}
            <div className="popover-actions">
              <button className="btn btn-delete" onClick={() => deleteEvent(popover.event.id)}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

