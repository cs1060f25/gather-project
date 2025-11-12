'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Send, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  Search,
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays, startOfWeek, isSameDay, isSameMonth, startOfMonth, eachDayOfInterval } from 'date-fns';
import { getUserService, getEventSessionService, getMessageService } from '@/lib/db/services/client-safe';

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  time: string;
  duration: string;
  color: string;
}

const suggestions = [
  "Schedule a team meeting next Tuesday at 2pm",
  "Book a 1:1 with Sarah tomorrow at 10am", 
  "Add coffee chat with John on Friday afternoon",
  "Plan design review for next Wednesday at 3pm",
  "Schedule weekly standup every Monday at 9am",
  "Meet with the team tomorrow afternoon",
  "Call with marketing on Thursday",
  "Lunch meeting next week",
  "Design sync on Friday at 3pm",
  "Quick standup tomorrow morning"
];

// Add spin animation CSS
const spinStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default function Dashboard() {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tempEvent, setTempEvent] = useState<CalendarEvent | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showTestResult, setShowTestResult] = useState(false);
  
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, title: 'Team Sync', date: new Date(), time: '9:00 AM', duration: '30 min', color: '#4a8fff' },
    { id: 2, title: 'Product Review', date: new Date(), time: '2:00 PM', duration: '1 hr', color: '#a855f7' },
    { id: 3, title: '1:1 with Sarah', date: addDays(new Date(), 1), time: '10:00 AM', duration: '45 min', color: '#10b981' },
    { id: 4, title: 'Design Critique', date: addDays(new Date(), 2), time: '3:00 PM', duration: '1 hr', color: '#4a8fff' },
    { id: 5, title: 'Weekly Planning', date: addDays(new Date(), 3), time: '11:00 AM', duration: '1 hr', color: '#10b981' },
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (inputValue.length > 0 && !isAnimating) {
      // Find a suggestion that starts with what the user is typing
      let matchingSuggestion = suggestions.find(s => 
        s.toLowerCase().startsWith(inputValue.toLowerCase())
      );
      
      // If no exact match, use a consistent random suggestion
      if (!matchingSuggestion) {
        // Only pick a new random suggestion when starting fresh
        if (inputValue.length === 1) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          setCurrentSuggestionIndex(randomIndex);
          matchingSuggestion = suggestions[randomIndex];
        } else if (currentSuggestionIndex >= 0 && currentSuggestionIndex < suggestions.length) {
          // Keep showing the same suggestion
          matchingSuggestion = suggestions[currentSuggestionIndex];
        } else {
          // Fallback
          matchingSuggestion = suggestions[0];
        }
      }
      
      setSuggestion(matchingSuggestion);
      setShowSuggestion(true);
    } else {
      setShowSuggestion(false);
      setSuggestion('');
    }
  }, [inputValue, isAnimating, currentSuggestionIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      
      if (showSuggestion && suggestion) {
        // Replace the entire input with the exact suggestion shown
        setInputValue(suggestion);
        setShowSuggestion(false);
        // Keep the suggestion in state so it doesn't change
      }
      return false;
    } else if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setIsAnimating(true);
    
    // Create temporary event
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: inputValue.slice(0, 20),
      date: addDays(new Date(), Math.floor(Math.random() * 7)),
      time: '2:00 PM',
      duration: '1hr',
      color: '#4a8fff'
    };
    
    setTempEvent(newEvent);
    
    // Add event with animation
    setTimeout(() => {
      setEvents(prev => [...prev, newEvent]);
      setTempEvent(null);
    }, 500);
    
    // Remove event after 2 seconds
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== newEvent.id));
      setIsAnimating(false);
      setInputValue('');
      setSuggestion('');
      setShowSuggestion(false);
    }, 2500);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = new Date(start);
    end.setDate(end.getDate() + 41);
    return eachDayOfInterval({ start, end }).slice(0, 42);
  };

  const getEventsForDay = (day: Date) => {
    const dayEvents = events.filter(event => isSameDay(event.date, day));
    if (tempEvent && isSameDay(tempEvent.date, day)) {
      return [...dayEvents, tempEvent];
    }
    return dayEvents;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinStyle }} />
      <div style={{ height: '100vh', backgroundColor: 'white', overflow: 'hidden', position: 'relative' }}>
      {/* Notion Calendar Layout */}
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Logo */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#4a8fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar style={{ height: '20px', width: '20px', color: 'white' }} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Gatherly</span>
            </Link>
          </div>

          {/* User */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <button style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #4a8fff 0%, #7ba3c8 100%)'
              }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, color: '#111827' }}>John Doe</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Pro Plan</p>
              </div>
            </button>
          </div>

          {/* Nav */}
          <div style={{ flex: 1, padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(74, 143, 255, 0.1)',
                color: '#4a8fff',
                border: 'none',
                cursor: 'pointer'
              }}>
                <Calendar style={{ height: '16px', width: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Calendar</span>
              </button>
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: 'none',
                cursor: 'pointer'
              }}>
                <Bell style={{ height: '16px', width: '16px' }} />
                <span style={{ fontSize: '14px' }}>Notifications</span>
              </button>
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: 'none',
                cursor: 'pointer'
              }}>
                <Settings style={{ height: '16px', width: '16px' }} />
                <span style={{ fontSize: '14px' }}>Settings</span>
              </button>
            </div>
          </div>

          {/* Create */}
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#4a8fff',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <Plus style={{ height: '16px', width: '16px' }} />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header with Liquid Glass Input Bar */}
          <div style={{
            padding: '20px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            backgroundColor: 'white'
          }}>
            {/* Left: Month Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#111827' }}>
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => navigateMonth('prev')} style={{
                  padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'
                }}>
                  <ChevronLeft style={{ height: '16px', width: '16px', color: '#6b7280' }} />
                </button>
                <button onClick={() => navigateMonth('next')} style={{
                  padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'
                }}>
                  <ChevronRight style={{ height: '16px', width: '16px', color: '#6b7280' }} />
                </button>
                <button onClick={() => setCurrentDate(new Date())} style={{
                  padding: '6px 12px', fontSize: '14px', fontWeight: 500, color: '#374151', borderRadius: '8px',
                  border: 'none', backgroundColor: 'transparent', cursor: 'pointer', marginLeft: '8px'
                }}>
                  Today
                </button>
              </div>
            </div>

            {/* Center: Liquid Glass Chat Bar */}
            <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
              {/* Glow Effect when focused */}
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      inset: '-8px',
                      background: 'radial-gradient(circle, rgba(74, 143, 255, 0.25) 0%, transparent 70%)',
                      filter: 'blur(16px)',
                      borderRadius: '50px',
                      pointerEvents: 'none',
                      zIndex: -1
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Main Input Container */}
              <div style={{
                position: 'relative',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '50px',
                boxShadow: isFocused 
                  ? '0 8px 24px rgba(74, 143, 255, 0.2), 0 0 0 1px rgba(74, 143, 255, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                border: isFocused ? '1px solid rgba(74, 143, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px 4px 18px' }}>
                  {/* Input with suggestion overlay */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    {/* Suggestion text overlay */}
                    {showSuggestion && suggestion && (
                      <div style={{
                        position: 'absolute',
                        left: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        fontSize: '15px',
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ color: 'transparent' }}>{inputValue}</span>
                        <span style={{ color: '#9ca3af' }}>
                          {suggestion.slice(inputValue.length)}
                        </span>
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#d1d5db' }}>Tab ↹</span>
                      </div>
                    )}
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Schedule something in plain English..."
                      autoComplete="off"
                      tabIndex={0}
                      style={{
                        width: '100%',
                        padding: '10px 2px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '15px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#111827',
                        position: 'relative',
                        zIndex: 2
                      }}
                    />
                  </div>

                  {/* Send button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isAnimating}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: inputValue.trim() && !isAnimating ? '#4a8fff' : '#e5e7eb',
                      color: inputValue.trim() && !isAnimating ? 'white' : '#9ca3af',
                      border: 'none',
                      cursor: inputValue.trim() && !isAnimating ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Send style={{ height: '16px', width: '16px' }} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Right: View Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {/* Test DB Button */}
              <button
                onClick={async () => {
                  setTestStatus('loading');
                  setShowTestResult(true);
                  setTestMessage('Testing Firebase connection...');
                  
                  try {
                    // Test Firebase connection
                    const userService = getUserService();
                    const testUser = await userService.createUser({
                      email: `test-${Date.now()}@gatherly.dev`,
                      name: 'Test User',
                      timezone: 'America/Los_Angeles',
                    });
                    
                    setTestMessage(`✅ Created test user: ${testUser.email}`);
                    
                    // Create test session
                    const sessionService = getEventSessionService();
                    const testSession = await sessionService.createSession({
                      hostUserId: testUser.id,
                      inviteeIds: ['test-invitee'],
                      title: 'Test Meeting',
                      duration: 30,
                      status: 'pending',
                    });
                    
                    setTestMessage(prev => `${prev}\n✅ Created test session: ${testSession.id}`);
                    setTestStatus('success');
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => setShowTestResult(false), 5000);
                  } catch (error) {
                    setTestStatus('error');
                    setTestMessage(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                disabled={testStatus === 'loading'}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: testStatus === 'loading' ? '#fbbf24' : 
                                   testStatus === 'success' ? '#10b981' :
                                   testStatus === 'error' ? '#ef4444' : '#8b5cf6',
                  color: 'white',
                  cursor: testStatus === 'loading' ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {testStatus === 'loading' ? (
                  <>
                    <Database style={{ height: '16px', width: '16px', animation: 'spin 1s linear infinite' }} />
                    Testing...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle style={{ height: '16px', width: '16px' }} />
                    Success!
                  </>
                ) : testStatus === 'error' ? (
                  <>
                    <AlertCircle style={{ height: '16px', width: '16px' }} />
                    Failed
                  </>
                ) : (
                  <>
                    <Database style={{ height: '16px', width: '16px' }} />
                    Test DB
                  </>
                )}
              </button>
              
              <button style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                <Search style={{ height: '16px', width: '16px', color: '#6b7280' }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                <button style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 500, backgroundColor: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>Month</button>
                <button style={{ padding: '6px 12px', fontSize: '14px', color: '#6b7280', backgroundColor: 'transparent', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Week</button>
                <button style={{ padding: '6px 12px', fontSize: '14px', color: '#6b7280', backgroundColor: 'transparent', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Day</button>
              </div>
            </div>
          </div>

          {/* Test Result Message */}
          <AnimatePresence>
            {showTestResult && testMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  padding: '16px 32px',
                  backgroundColor: testStatus === 'success' ? '#dcfce7' :
                                   testStatus === 'error' ? '#fee2e2' : '#fef3c7',
                  borderBottom: '1px solid',
                  borderColor: testStatus === 'success' ? '#86efac' :
                               testStatus === 'error' ? '#fca5a5' : '#fde68a'
                }}
              >
                <pre style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: testStatus === 'success' ? '#166534' :
                         testStatus === 'error' ? '#991b1b' : '#92400e',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {testMessage}
                </pre>
                {testStatus === 'success' && (
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href="https://console.firebase.google.com/project/gatherly-mvp/firestore"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#059669',
                        textDecoration: 'underline',
                        fontSize: '13px'
                      }}
                    >
                      View in Firebase Console →
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {/* Days */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)' }}>
                {getDaysInMonth().map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div key={index} style={{
                      minHeight: '100px', padding: '8px',
                      borderRight: index % 7 !== 6 ? '1px solid #e5e7eb' : 'none',
                      borderBottom: index < 35 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: !isCurrentMonth ? '#fafafa' : (isToday ? '#eff6ff' : 'white'),
                      cursor: 'pointer', transition: 'background-color 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 500,
                          color: !isCurrentMonth ? '#9ca3af' : (isToday ? '#2563eb' : '#374151')
                        }}>{format(day, 'd')}</span>
                        {isToday && (
                          <span style={{ fontSize: '12px', backgroundColor: '#4a8fff', color: 'white', padding: '2px 8px', borderRadius: '9999px' }}>
                            Today
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <AnimatePresence>
                          {dayEvents.slice(0, 2).map(event => (
                            <motion.div
                              key={event.id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{
                                fontSize: '12px', padding: '4px 6px', borderRadius: '4px',
                                backgroundColor: event.color, color: 'white',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{event.time}</span> {event.title}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {dayEvents.length > 2 && (
                          <span style={{ fontSize: '12px', color: '#6b7280', padding: '0 4px' }}>
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}