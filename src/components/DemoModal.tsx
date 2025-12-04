import React, { useState, useEffect, useCallback } from 'react';
import './DemoModal.css';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoEvent {
  id: string;
  title: string;
  time: string;
  day: number;
  color: 'canary' | 'mint' | 'coral' | 'sky';
}

// Gatherly Logo SVG Component
const GatherlyLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="-2 -2 28 28" fill="none">
    <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
          stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
    <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Get current month info
const getMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { year, month, firstDay, daysInMonth, today, monthName };
};

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [highlightDay, setHighlightDay] = useState<number | null>(null);
  
  const monthInfo = getMonthInfo();
  
  // Sample pre-existing events
  const sampleEvents: DemoEvent[] = [
    { id: '1', title: 'Team Sync', time: '10:00', day: monthInfo.today, color: 'canary' },
    { id: '2', title: 'Gym', time: '18:00', day: monthInfo.today + 1, color: 'mint' },
    { id: '3', title: 'NYC', time: '08:30', day: monthInfo.today + 3, color: 'sky' },
  ];
  
  const TYPING_TEXT = "Coffee with Sarah tomorrow 3pm ☕";
  
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startDemo = useCallback(async () => {
    // Reset state
    setStep(0);
    setInputValue('');
    setDemoEvents(sampleEvents);
    setIsTyping(false);
    setShowSuccess(false);
    setHighlightDay(null);
    
    await wait(500);
    
    // Step 1: Start typing
    setStep(1);
    setIsTyping(true);
    
    for (let i = 0; i <= TYPING_TEXT.length; i++) {
      setInputValue(TYPING_TEXT.slice(0, i));
      await wait(35 + Math.random() * 25);
    }
    
    await wait(200);
    setIsTyping(false);
    
    // Step 2: Submit - flash the send button
    setStep(2);
    await wait(300);
    
    // Step 3: Processing
    setStep(3);
    setInputValue('');
    
    // Highlight the target day while processing
    setHighlightDay(monthInfo.today + 1);
    await wait(800);
    
    // Step 4: Event appears directly on calendar
    setStep(4);
    const newEventData: DemoEvent = {
      id: 'new',
      title: '☕ Sarah',
      time: '15:00',
      day: monthInfo.today + 1,
      color: 'coral'
    };
    setDemoEvents(prev => [...prev, newEventData]);
    setShowSuccess(true);
    
    await wait(300);
    setHighlightDay(null);
    
    await wait(1500);
    setStep(5); // Done
  }, [monthInfo.today]);

  useEffect(() => {
    if (isOpen) {
      startDemo();
    }
  }, [isOpen, startDemo]);

  if (!isOpen) return null;

  // Generate calendar grid - compact version
  const renderCalendarDays = () => {
    const days = [];
    const { firstDay, daysInMonth, today } = monthInfo;
    
    // Empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="demo-cal-cell empty" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today;
      const isHighlighted = day === highlightDay;
      const dayEvents = demoEvents.filter(e => e.day === day);
      
      days.push(
        <div key={day} className={`demo-cal-cell ${isToday ? 'today' : ''} ${isHighlighted ? 'highlight' : ''}`}>
          <span className={`day-num ${isToday ? 'today-badge' : ''}`}>
            {day}
          </span>
          {dayEvents.length > 0 && (
            <div className="cell-events">
              {dayEvents.slice(0, 2).map(event => (
                <div key={event.id} className={`mini-event ${event.color} ${event.id === 'new' ? 'new-event' : ''}`}>
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && <span className="more-events">+{dayEvents.length - 2}</span>}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="demo-overlay" onClick={onClose}>
      <div className="demo-container" onClick={e => e.stopPropagation()}>
        {/* Browser Chrome */}
        <div className="demo-chrome">
          <div className="chrome-dots">
            <span className="dot red" onClick={onClose} />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="chrome-url">
            <span className="url-icon">🔒</span>
            <span>gatherly.now/dashboard</span>
          </div>
        </div>

        {/* App Content */}
        <div className="demo-app">
          {/* Header */}
          <header className="demo-app-header">
            <div className="app-logo">
              <GatherlyLogo size={24} />
              <span className="logo-name">Gatherly</span>
            </div>
            <div className="user-avatar">S</div>
          </header>

          {/* Main Content */}
          <div className="demo-app-content">
            {/* Calendar */}
            <div className="demo-calendar">
              {/* Success Toast */}
              {showSuccess && (
                <div className="success-toast">
                  <span className="toast-icon">✓</span>
                  <span>Event scheduled! Sarah notified.</span>
                </div>
              )}
              
              <div className="cal-header">
                <h2 className="cal-title">{monthInfo.monthName}</h2>
                <div className="cal-nav">
                  <button className="cal-nav-btn">◀</button>
                  <button className="cal-nav-btn">▶</button>
                </div>
              </div>
              
              <div className="cal-weekdays">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="weekday">{d}</div>
                ))}
              </div>
              
              <div className="cal-grid">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Sidebar */}
            <div className="demo-sidebar">
              <h3 className="sidebar-title">Upcoming</h3>
              <div className="upcoming-events">
                {demoEvents.map(event => (
                  <div key={event.id} className={`upcoming-item ${event.color} ${event.id === 'new' ? 'new-event' : ''}`}>
                    <div className="upcoming-dot" />
                    <div className="upcoming-info">
                      <span className="upcoming-title">{event.title}</span>
                      <span className="upcoming-meta">
                        {event.day === monthInfo.today ? 'Today' : event.day === monthInfo.today + 1 ? 'Tomorrow' : `Dec ${event.day}`} • {event.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Bar */}
          <div className={`demo-chatbar ${step === 2 ? 'flash' : ''} ${step === 3 ? 'processing' : ''}`}>
            <div className="chatbar-inner">
              <span className="chatbar-icon">💬</span>
              <div className="chatbar-input">
                {inputValue ? (
                  <span className="typed-text">
                    {inputValue}
                    {isTyping && <span className="cursor">|</span>}
                  </span>
                ) : step === 3 ? (
                  <span className="processing-text">
                    <span className="proc-dot" />
                    <span className="proc-dot" />
                    <span className="proc-dot" />
                    <span>Creating event...</span>
                  </span>
                ) : (
                  <span className="placeholder">Schedule something...</span>
                )}
              </div>
              <button className={`chatbar-send ${inputValue ? 'active' : ''} ${step === 2 ? 'clicked' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="demo-bottom-controls">
          <button className="demo-control-btn replay" onClick={startDemo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Replay
          </button>
          <button className="demo-control-btn close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
