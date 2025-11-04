'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Send, 
  User, 
  Settings, 
  Home,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isSameMonth } from 'date-fns';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  time: string;
  participants: number;
  color: string;
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm Gatherly, your intelligent scheduling assistant. How can I help you plan your next meeting or hangout?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Sample calendar events
  const [events] = useState<CalendarEvent[]>([
    { id: 1, title: 'Team Standup', date: new Date(), time: '10:00 AM', participants: 5, color: 'bg-blue-400' },
    { id: 2, title: 'Coffee Chat', date: addDays(new Date(), 1), time: '2:00 PM', participants: 2, color: 'bg-green-400' },
    { id: 3, title: 'Project Review', date: addDays(new Date(), 2), time: '3:30 PM', participants: 8, color: 'bg-purple-400' },
    { id: 4, title: 'Study Group', date: addDays(new Date(), 3), time: '6:00 PM', participants: 4, color: 'bg-yellow-400' },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: messages.length + 2,
        text: "I appreciate your interest in using Gatherly! This feature is currently under development and will be available soon. In the meantime, you can explore the calendar view and see how your scheduled meetings will appear.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Calendar functions
  const getDaysInMonth = () => {
    const start = startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const days = [];
    
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    
    return days;
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 bg-white border-r border-gray-200 flex flex-col"
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-semibold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Gatherly
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Guest User</p>
                <p className="text-sm text-gray-500">Free Plan</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Link href="/">
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Home className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Home</span>
                </div>
              </Link>
              
              <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-50 text-green-600">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">Chat</span>
              </div>
              
              <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">Calendar</span>
              </div>
              
              <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">Contacts</span>
              </div>
              
              <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">Settings</span>
              </div>
            </div>
          </nav>

          {/* Quick Stats */}
          <div className="p-4 m-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
            <p className="text-sm font-medium text-green-800 mb-2">This Week</p>
            <div className="space-y-1">
              <p className="text-xs text-green-700">4 meetings scheduled</p>
              <p className="text-xs text-green-700">12 hours saved</p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header - Liquid Glass Effect */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="liquid-glass sticky top-0 z-10 px-6 py-4 border-b border-green-100/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-green-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Gatherly Assistant</h2>
                  <p className="text-sm text-gray-600">AI-powered scheduling</p>
                </div>
              </div>
              
              <button className="px-4 py-2 bg-white/50 backdrop-blur text-gray-700 rounded-full text-sm font-medium hover:bg-white/70 transition-all">
                New Meeting
              </button>
            </div>
          </motion.div>

          <div className="flex-1 flex">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-lg px-4 py-3 rounded-2xl ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {format(message.timestamp, 'h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                      <div className="flex space-x-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-t border-gray-100 px-6 py-4"
              >
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me to schedule a meeting..."
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      rows={1}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <button className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    className="p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Send className="h-5 w-5" />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Calendar */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-96 border-l border-gray-200 bg-white p-6 overflow-y-auto"
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="mb-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth().map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        className={`
                          aspect-square p-1 rounded-lg cursor-pointer transition-all
                          ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                          ${isToday ? 'bg-green-50 ring-2 ring-green-500' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className="text-center">
                          <p className="text-xs font-medium">{format(day, 'd')}</p>
                          {dayEvents.length > 0 && (
                            <div className="mt-1 flex justify-center space-x-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <span
                                  key={event.id}
                                  className={`w-1 h-1 rounded-full ${event.color}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Events */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Events</h4>
                <div className="space-y-3">
                  {events.slice(0, 4).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${event.color}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.time}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {event.participants}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                <p className="text-sm font-medium text-green-800 mb-3">Quick Actions</p>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-green-700 hover:text-green-900 transition-colors">
                    → Schedule a new meeting
                  </button>
                  <button className="w-full text-left text-sm text-green-700 hover:text-green-900 transition-colors">
                    → Find common availability
                  </button>
                  <button className="w-full text-left text-sm text-green-700 hover:text-green-900 transition-colors">
                    → Send calendar invite
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
