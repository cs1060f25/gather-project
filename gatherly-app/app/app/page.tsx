'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  X,
  Check,
  Clock,
  Users as UsersIcon,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays, startOfWeek, isSameDay, isSameMonth, startOfMonth, eachDayOfInterval, parse, addMinutes } from 'date-fns';

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  time: string;
  duration: string;
  color: string;
}

interface OnboardingData {
  attendees: string[];
  duration: string;
  selectedDate: Date | null;
  selectedTime: string;
  location: string;
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

const quickAttendees = ['Sarah Chen', 'John Doe', 'Alice Wang', 'Bob Smith', 'Carol Lee'];
const quickLocations = ['Zoom', 'Google Meet', 'In Person - Tresidder', 'Teams'];

const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 7; // 7 AM to 12 AM
  return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
});

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
  
  // Onboarding flow state - Duration comes BEFORE time
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'attendees' | 'duration' | 'time' | 'location' | 'confirm'>('attendees');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    attendees: [],
    duration: '30 min',
    selectedDate: null,
    selectedTime: '2:00 PM',
    location: 'Zoom'
  });
  
  // Time selection state
  const [hoveredTimeSlot, setHoveredTimeSlot] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [isSelectingTime, setIsSelectingTime] = useState(false);
  
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
      let matchingSuggestion = suggestions.find(s => 
        s.toLowerCase().startsWith(inputValue.toLowerCase())
      );
      
      if (!matchingSuggestion) {
        if (inputValue.length === 1) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          setCurrentSuggestionIndex(randomIndex);
          matchingSuggestion = suggestions[randomIndex];
        } else if (currentSuggestionIndex >= 0 && currentSuggestionIndex < suggestions.length) {
          matchingSuggestion = suggestions[currentSuggestionIndex];
        } else {
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
        setInputValue(suggestion);
        setShowSuggestion(false);
      }
      return false;
    } else if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setShowOnboarding(true);
    setOnboardingStep('attendees');
    setOnboardingData({
      attendees: [],
      duration: '30 min',
      selectedDate: null,
      selectedTime: '2:00 PM',
      location: 'Zoom'
    });
  };

  const completeOnboarding = () => {
    setIsAnimating(true);
    
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: inputValue.slice(0, 30),
      date: onboardingData.selectedDate || addDays(new Date(), 1),
      time: onboardingData.selectedTime,
      duration: onboardingData.duration,
      color: '#4a8fff'
    };
    
    setTempEvent(newEvent);
    
    setTimeout(() => {
      setEvents(prev => [...prev, newEvent]);
      setTempEvent(null);
    }, 500);
    
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== newEvent.id));
      setIsAnimating(false);
      setInputValue('');
      setSuggestion('');
      setShowSuggestion(false);
      setShowOnboarding(false);
      setOnboardingStep('attendees');
    }, 3000);
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

  const getDurationInSlots = () => {
    const durationMap: { [key: string]: number } = {
      '15 min': 1,
      '30 min': 2,
      '45 min': 3,
      '1 hr': 4,
      '1.5 hr': 6,
      '2 hr': 8
    };
    return durationMap[onboardingData.duration] || 2;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      ` }} />
      <div style={{ height: '100vh', backgroundColor: 'white', overflow: 'hidden', position: 'relative' }}>
        {/* Calendar Layout */}
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Sidebar */}
          <div style={{
            width: '240px',
            backgroundColor: '#fafafa',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#4a8fff'
                }} />
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Gatherly</span>
              </Link>
            </div>

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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'white'
                }}>
                  MN
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, color: '#111827' }}>Milan Naropanth</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Harvard College</p>
                </div>
              </button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Recent People
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Sarah Chen', initials: 'SC', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                  { name: 'Alex Kim', initials: 'AK', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                  { name: 'Michael Davis', initials: 'MD', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
                  { name: 'Emma Wilson', initials: 'EW', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
                  { name: 'James Taylor', initials: 'JT', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
                  { name: 'Olivia Brown', initials: 'OB', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
                  { name: 'Chris Lee', initials: 'CL', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
                  { name: 'Sophie Martin', initials: 'SM', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }
                ].map((person, index) => (
                  <motion.button
                    key={person.name}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: person.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {person.initials}
                    </div>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      color: '#374151',
                      textAlign: 'left'
                    }}>
                      {person.name}
                    </span>
                    {index < 3 && (
                      <div style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981'
                      }} />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

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
            {/* Header */}
            <div style={{
              padding: '20px 32px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
              backgroundColor: 'white'
            }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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

            {/* Grid */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#fafafa', position: 'relative' }}>
              {/* Time Selection Mode Banner */}
              <AnimatePresence>
                {isSelectingTime && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#007AFF',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: 500,
                      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <span>Click on any day to select your meeting time</span>
                    <button
                      onClick={() => setIsSelectingTime(false)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                border: isSelectingTime ? '2px solid #007AFF' : '1px solid #e5e7eb', 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: isSelectingTime ? '0 0 20px rgba(0, 122, 255, 0.2)' : 'none'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)' }}>
                  {getDaysInMonth().map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const isSelectable = isSelectingTime && isCurrentMonth && day >= new Date();
                    
                    return (
                      <motion.div 
                        key={index}
                        whileHover={isSelectable ? { scale: 1.02, backgroundColor: '#f0f9ff' } : {}}
                        onClick={() => {
                          if (isSelectable) {
                            setOnboardingData(prev => ({
                              ...prev,
                              selectedDate: day,
                              selectedTime: '2:00 PM'
                            }));
                            setIsSelectingTime(false);
                            setShowOnboarding(true);
                            setOnboardingStep('location');
                          }
                        }}
                        style={{
                          minHeight: '100px', padding: '8px',
                          borderRight: index % 7 !== 6 ? '1px solid #e5e7eb' : 'none',
                          borderBottom: index < 35 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: !isCurrentMonth ? '#fafafa' : (isToday ? '#eff6ff' : (isSelectable ? 'rgba(0, 122, 255, 0.05)' : 'white')),
                          cursor: isSelectable ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          position: 'relative'
                      }}>
                        {isSelectable && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: '#007AFF',
                              pointerEvents: 'none'
                            }}
                          />
                        )}
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
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Bar at BOTTOM */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '280px',
            right: '24px',
            zIndex: 100
          }}
        >
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  background: 'radial-gradient(circle, rgba(74, 143, 255, 0.25) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  borderRadius: '60px',
                  pointerEvents: 'none'
                }}
              />
            )}
          </AnimatePresence>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px 6px 24px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                {showSuggestion && suggestion && (
                  <div style={{
                    position: 'absolute',
                    left: '2px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ color: 'transparent' }}>{inputValue}</span>
                    <span style={{ color: '#9ca3af' }}>
                      {suggestion.slice(inputValue.length)}
                    </span>
                    <span style={{ marginLeft: '12px', fontSize: '12px', color: '#d1d5db' }}>Tab ↹</span>
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
                    padding: '14px 4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    color: '#111827',
                    position: 'relative',
                    zIndex: 2
                  }}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isAnimating}
                style={{
                  width: '40px',
                  height: '40px',
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
                <Send style={{ height: '18px', width: '18px' }} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Apple Notes-Style Onboarding Modal */}
        <AnimatePresence>
          {showOnboarding && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOnboarding(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 200
                }}
              />

              {/* Onboarding Panel - Apple Notes Style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: "spring", damping: 35, stiffness: 400 }}
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '420px',
                  maxWidth: '90vw',
                  backgroundColor: '#FAFAFA',
                  borderRadius: '10px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08), 0 15px 40px rgba(0, 0, 0, 0.08)',
                  zIndex: 201,
                  overflow: 'hidden',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif'
                }}
              >
                {/* Header - Apple Notes Style */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '0.5px solid #E5E5EA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FBFBFB'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0, 
                    color: '#000',
                    letterSpacing: '-0.3px'
                  }}>
                    {onboardingStep === 'attendees' ? 'Attendees' :
                     onboardingStep === 'duration' ? 'Duration' :
                     onboardingStep === 'time' ? 'When' :
                     onboardingStep === 'location' ? 'Location' :
                     'Review'}
                  </h3>
                  <button
                    onClick={() => setShowOnboarding(false)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#E5E5EA',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <X style={{ height: '13px', width: '13px', color: '#8E8E93' }} />
                  </button>
                </div>

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  {/* Step 1: Attendees */}
                  {onboardingStep === 'attendees' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {quickAttendees.map(name => {
                          const isSelected = onboardingData.attendees.includes(name);
                          return (
                            <motion.button
                              key={name}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (isSelected) {
                                  setOnboardingData(prev => ({
                                    ...prev,
                                    attendees: prev.attendees.filter(a => a !== name)
                                  }));
                                } else {
                                  setOnboardingData(prev => ({
                                    ...prev,
                                    attendees: [...prev.attendees, name]
                                  }));
                                }
                              }}
                              style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isSelected ? '#007aff' : '#f2f2f7',
                                color: isSelected ? 'white' : '#000',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isSelected && <Check style={{ height: '16px', width: '16px' }} />}
                              {name}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Duration */}
                  {onboardingStep === 'duration' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {['15 min', '30 min', '45 min', '1 hr', '1.5 hr', '2 hr'].map(dur => {
                          const isSelected = onboardingData.duration === dur;
                          return (
                            <motion.button
                              key={dur}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setOnboardingData(prev => ({ ...prev, duration: dur }))}
                              style={{
                                padding: '14px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isSelected ? '#007aff' : '#f2f2f7',
                                color: isSelected ? 'white' : '#000',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 500,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {dur}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Time Selection - Prompt to use main calendar */}
                  {onboardingStep === 'time' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Calendar style={{ 
                          height: '48px', 
                          width: '48px', 
                          color: '#007AFF', 
                          margin: '0 auto 16px' 
                        }} />
                        <p style={{ 
                          fontSize: '17px', 
                          color: '#000', 
                          marginBottom: '8px',
                          fontWeight: 500
                        }}>
                          Select a time on the calendar
                        </p>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#8E8E93',
                          marginBottom: '20px'
                        }}>
                          Click on any available time slot
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowOnboarding(false);
                            setIsSelectingTime(true);
                            // Close modal and highlight calendar
                          }}
                          style={{
                            padding: '10px 28px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: '#007AFF',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: 600
                          }}
                        >
                          Choose on Calendar
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Location */}
                  {onboardingStep === 'location' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {quickLocations.map(loc => {
                          const isSelected = onboardingData.location === loc;
                          return (
                            <motion.button
                              key={loc}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setOnboardingData(prev => ({ ...prev, location: loc }))}
                              style={{
                                padding: '14px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isSelected ? '#007aff' : '#f2f2f7',
                                color: isSelected ? 'white' : '#000',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 500,
                                transition: 'all 0.15s ease',
                                textAlign: 'left'
                              }}
                            >
                              {loc}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Confirm */}
                  {onboardingStep === 'confirm' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        padding: '20px'
                      }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#000' }}>
                          {inputValue}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <UsersIcon style={{ height: '16px', width: '16px', color: '#8e8e93', marginTop: '2px' }} />
                            <span style={{ fontSize: '15px', color: '#000' }}>
                              {onboardingData.attendees.join(', ') || 'No attendees'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Clock style={{ height: '16px', width: '16px', color: '#8e8e93' }} />
                            <span style={{ fontSize: '15px', color: '#000' }}>
                              {onboardingData.selectedDate ? format(onboardingData.selectedDate, 'MMM d, yyyy') : 'Not selected'} at {onboardingData.selectedTime} · {onboardingData.duration}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <MapPin style={{ height: '16px', width: '16px', color: '#8e8e93' }} />
                            <span style={{ fontSize: '15px', color: '#000' }}>
                              {onboardingData.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Navigation Footer - Apple Notes Style */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '0.5px solid #E5E5EA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FBFBFB'
                }}>
                  {onboardingStep !== 'attendees' ? (
                    <button
                      onClick={() => {
                        const steps = ['attendees', 'duration', 'time', 'location', 'confirm'] as const;
                        const currentIndex = steps.indexOf(onboardingStep as any);
                        setOnboardingStep(steps[currentIndex - 1] as typeof onboardingStep);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#007AFF',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        letterSpacing: '-0.2px'
                      }}
                    >
                      Back
                    </button>
                  ) : <div />}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onboardingStep === 'confirm') {
                        // Close modal immediately
                        setShowOnboarding(false);
                        // Then complete onboarding in background
                        setTimeout(() => {
                          completeOnboarding();
                        }, 100);
                      } else {
                        const steps = ['attendees', 'duration', 'time', 'location', 'confirm'] as const;
                        const currentIndex = steps.indexOf(onboardingStep as any);
                        setOnboardingStep(steps[currentIndex + 1] as typeof onboardingStep);
                      }
                    }}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#007aff',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {onboardingStep === 'confirm' ? 'Schedule Meeting' : 'Continue'}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}