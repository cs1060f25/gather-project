import React, { useState, useEffect } from 'react';
import './Calendar.css';

interface CalendarEvent {
  id: string;
  date: string;
  time?: string;
  title: string;
  category: 'work' | 'personal' | 'travel';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORIES = {
  work: { label: 'Work', color: 'canary' },
  personal: { label: 'Personal', color: 'acid' },
  travel: { label: 'Travel', color: 'sky' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const Calendar: React.FC = () => {
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filters, setFilters] = useState({ work: true, personal: true, travel: true });
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState<{ title: string; date: string; time: string; category: 'work' | 'personal' | 'travel' }>({ title: '', date: '', time: '', category: 'work' });
  const [popover, setPopover] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);

  // Load events from localStorage
  const loadEvents = () => {
    const stored = localStorage.getItem('gatherly_events');
    if (stored) {
      setEvents(JSON.parse(stored));
    } else {
      // Sample events
      const sampleEvents: CalendarEvent[] = [
        { id: crypto.randomUUID(), date: fmtDateISO(today), time: '09:00', title: 'Daily Standup', category: 'work' },
        { id: crypto.randomUUID(), date: fmtDateISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)), time: '18:30', title: 'Run 5k', category: 'personal' },
        { id: crypto.randomUUID(), date: fmtDateISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)), time: '12:00', title: 'Flight to NYC', category: 'travel' },
      ];
      setEvents(sampleEvents);
      localStorage.setItem('gatherly_events', JSON.stringify(sampleEvents));
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
    return events.filter(e => e.date === dateISO && filters[e.category]);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddData.title || !quickAddData.date) return;

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      ...quickAddData,
      category: quickAddData.category as 'work' | 'personal' | 'travel',
    };
    saveEvents([...events, newEvent]);
    setQuickAddData({ title: '', date: '', time: '', category: 'work' });
    setShowQuickAdd(false);
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
          className={`calendar-cell ${!inCurrent ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            setSelectedDate(dateObj);
            if (!inCurrent) {
              setCurrent(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
            }
          }}
        >
          <div className="cell-header">
            <span className="day-number">{dayNum}</span>
            {isToday && <span className="today-badge">TODAY</span>}
          </div>
          <div className="cell-events">
            {dayEvents.slice(0, 3).map(ev => (
              <button
                key={ev.id}
                className={`event-dot ${ev.category}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopover({ event: ev, x: e.clientX, y: e.clientY });
                }}
                aria-label={`${ev.title} at ${ev.time || 'all day'}`}
              />
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

  return (
    <div className="calendar-container">
      {/* Header */}
      <header className="calendar-header">
        <div className="header-info">
          <h2 className="calendar-title">Neobrutalist Calendar</h2>
          <p className="calendar-subtitle">Punchy, high-contrast scheduling with unapologetic edges.</p>
        </div>
        <div className="header-controls">
          <button className="btn btn-accent" onClick={goToday}>Today</button>
          <div className="nav-group">
            <button className="btn" onClick={goPrev}>◀</button>
            <div className="month-label">{monthLabel}</div>
            <button className="btn" onClick={goNext}>▶</button>
          </div>
          <div className="view-dropdown">
            <button 
              className="btn" 
              onClick={() => setShowViewMenu(!showViewMenu)}
            >
              {view === 'month' ? 'Month View' : view === 'week' ? 'Week View' : 'Agenda'} ▾
            </button>
            {showViewMenu && (
              <ul className="view-menu">
                <li onClick={() => { setView('month'); setShowViewMenu(false); }}>Month View</li>
                <li onClick={() => { setView('week'); setShowViewMenu(false); }}>Week View</li>
                <li onClick={() => { setView('agenda'); setShowViewMenu(false); }}>Agenda</li>
              </ul>
            )}
          </div>
        </div>
      </header>

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

        {/* Sidebar */}
        <aside className="calendar-sidebar">
          <h3 className="sidebar-title">Filters & Quick Add</h3>
          
          <button 
            className="btn btn-add"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            {showQuickAdd ? 'Cancel' : '+ Add Event'}
          </button>

          {showQuickAdd && (
            <form className="quick-add-form" onSubmit={handleQuickAdd}>
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={quickAddData.title}
                  onChange={e => setQuickAddData({ ...quickAddData, title: e.target.value })}
                  placeholder="Team sync"
                  required
                />
              </label>
              <div className="form-row">
                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={quickAddData.date}
                    onChange={e => setQuickAddData({ ...quickAddData, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Time</span>
                  <input
                    type="time"
                    value={quickAddData.time}
                    onChange={e => setQuickAddData({ ...quickAddData, time: e.target.value })}
                  />
                </label>
              </div>
              <label>
                <span>Category</span>
                <select
                  value={quickAddData.category}
                  onChange={e => setQuickAddData({ ...quickAddData, category: e.target.value as 'work' | 'personal' | 'travel' })}
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="travel">Travel</option>
                </select>
              </label>
              <button type="submit" className="btn btn-submit">Add Event</button>
            </form>
          )}

          <div className="filters-section">
            <h4>Show Categories</h4>
            {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
              <label key={key} className="filter-item">
                <input
                  type="checkbox"
                  checked={filters[key as keyof typeof filters]}
                  onChange={e => setFilters({ ...filters, [key]: e.target.checked })}
                />
                <span className={`filter-pill ${color}`}>{label}</span>
              </label>
            ))}
          </div>

          <div className="legend-section">
            <h4>Legend</h4>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <div key={key} className="legend-item">
                <span className={`event-dot ${key}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </aside>
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
            <p className="popover-time">{popover.event.time ? `Time: ${popover.event.time}` : 'All day'}</p>
            <span className={`popover-category ${popover.event.category}`}>
              {CATEGORIES[popover.event.category].label}
            </span>
            <div className="popover-actions">
              <button className="btn btn-delete" onClick={() => deleteEvent(popover.event.id)}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

