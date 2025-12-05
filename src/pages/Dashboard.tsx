import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleToken } from '../lib/supabase';
import { parseSchedulingMessage, getSuggestedTimes, type ParsedSchedulingData } from '../lib/openai';
import { Calendar } from '../components/Calendar';
import { GlassChatBar } from '../components/GlassChatBar';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { LocalInfo } from '../components/LocalInfo';
import { DayNightToggle } from '../components/DayNightToggle';
import { SchedulingModal, type ParsedEventData, type ScheduledEventData } from '../components/SchedulingModal';
import './Dashboard.css';

// Gatherly Logo SVG Component
const GatherlyLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="-2 -2 28 28" fill="none">
    <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
          stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
    <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isGatherly?: boolean;
}

interface PendingEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  invitees: string[];
  status: 'waiting' | 'partial';
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, signOut, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  // No mock data - start with empty pending events
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [, setCalendarSynced] = useState(false);
  const [, setContactsSynced] = useState(false);
  
  // Scheduling modal state
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [schedulingData, setSchedulingData] = useState<ParsedEventData | null>(null);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [isParsingChat, setIsParsingChat] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
        phone: authUser.user_metadata?.phone || '',
      });
      
      // Load contacts from Supabase
      loadContacts();
      
      // Sync Google Calendar if connected
      syncGoogleCalendar();
      // Sync Google Contacts if connected
      syncGoogleContacts();
    }
  }, [authUser]);

  const loadContacts = async () => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', authUser.id);
      
      if (!error && data) {
        setContacts(data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          isGatherly: c.is_gatherly
        })));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const syncGoogleContacts = async () => {
    const providerToken = getGoogleToken();
    if (!providerToken) return;

    try {
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?' +
        new URLSearchParams({
          personFields: 'names,emailAddresses',
          sortOrder: 'FIRST_NAME_ASCENDING',
          pageSize: '200'
        }),
        {
          headers: {
            Authorization: `Bearer ${providerToken}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('gatherly_google_token');
        }
        return;
      }

      const data = await response.json();
      const googleContacts: Contact[] = (data.connections || [])
        .map((c: any) => {
          const email = c.emailAddresses?.[0]?.value;
          const name = c.names?.[0]?.displayName || email;
          if (!email) return null;
          return { id: `g-${email}`, name, email, isGatherly: false };
        })
        .filter(Boolean);

      setContacts(prev => {
        const merged = [...prev];
        googleContacts.forEach(gc => {
          if (!merged.find(c => c.email === gc!.email)) {
            merged.push(gc as Contact);
          }
        });
        return merged;
      });
      setContactsSynced(true);

      // Persist new contacts to Supabase
      if (authUser) {
        const rows = googleContacts.map(c => ({
          user_id: authUser.id,
          name: c!.name,
          email: c!.email,
          phone: c!.phone,
          is_gatherly: false,
        }));
        await supabase.from('contacts').upsert(rows, { onConflict: 'email' });
      }
    } catch (error) {
      console.error('Error syncing Google Contacts:', error);
    }
  };

  const syncGoogleCalendar = async () => {
    // Get the stored Google token
    const providerToken = getGoogleToken();
    
    if (!providerToken) {
      console.log('No Google token found, skipping calendar sync');
      return;
    }

    try {
      console.log('Syncing Google Calendar...');
      
      // Fetch events from Google Calendar
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?' + 
        new URLSearchParams({
          timeMin: new Date().toISOString(),
          maxResults: '50',
          singleEvents: 'true',
          orderBy: 'startTime'
        }),
        {
          headers: {
            Authorization: `Bearer ${providerToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched', data.items?.length || 0, 'events from Google Calendar');
        
        // Convert Google events to our format
        const events = data.items?.map((item: any) => ({
          id: `gcal-${item.id}`,
          title: item.summary || 'Untitled Event',
          date: item.start?.date || item.start?.dateTime?.split('T')[0],
          time: item.start?.dateTime?.split('T')[1]?.slice(0, 5),
          category: categorizeEvent(item.summary || ''),
          source: 'google',
          attendees: (item.attendees || [])
            .filter((a: any) => a.email)
            .map((a: any) => a.email),
          important: true,
        })) || [];
        
        // Get existing local events (non-google)
        const existingEvents = JSON.parse(localStorage.getItem('gatherly_events') || '[]');
        const localEvents = existingEvents.filter((e: any) => !e.id.startsWith('gcal-'));
        
        // Merge local events with Google events
        localStorage.setItem('gatherly_events', JSON.stringify([...localEvents, ...events]));
        
        // Trigger calendar refresh
        window.dispatchEvent(new Event('gatherly_events_updated'));
        setCalendarSynced(true);
      } else {
        const errorText = await response.text();
        console.error('Google Calendar API error:', response.status, errorText);
        
        // Token might be expired - clear it
        if (response.status === 401) {
          localStorage.removeItem('gatherly_google_token');
        }
      }
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
    }
  };

  const categorizeEvent = (title: string): 'work' | 'personal' | 'travel' => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('flight') || lowerTitle.includes('trip') || lowerTitle.includes('travel')) {
      return 'travel';
    }
    if (lowerTitle.includes('meeting') || lowerTitle.includes('standup') || lowerTitle.includes('sync') || lowerTitle.includes('call')) {
      return 'work';
    }
    return 'personal';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleChatSubmit = async (message: string) => {
    console.log('Schedule request:', message);
    setIsParsingChat(true);
    
    try {
      // Use OpenAI to parse the message
      const contactNames = contacts.map(c => c.name);
      const parsed: ParsedSchedulingData = await parseSchedulingMessage(message, contactNames);
      
      console.log('Parsed scheduling data:', parsed);
      
      if (!parsed.isSchedulingRequest) {
        // Not a scheduling request, just log it
        console.log('Not recognized as a scheduling request');
        setIsParsingChat(false);
        setChatInput('');
        return;
      }
      
      // Convert participants to emails
      const participantEmails = parsed.participants.map(name => {
        const contact = contacts.find(c => 
          c.name.toLowerCase() === name.toLowerCase() || 
          c.email.toLowerCase() === name.toLowerCase()
        );
        return contact?.email || name;
      });
      
      // Get calendar events for time suggestions
      const calendarEvents = JSON.parse(localStorage.getItem('gatherly_events') || '[]');
      const targetDate = parsed.suggestedDate || new Date().toISOString().split('T')[0];
      const timeSuggestions = getSuggestedTimes(calendarEvents, targetDate, parsed.duration || 60);
      setSuggestedTimes(timeSuggestions);
      
      // Prepare data for scheduling modal
      const eventData: ParsedEventData = {
        title: parsed.title,
        participants: participantEmails,
        dates: parsed.suggestedDate ? [parsed.suggestedDate] : undefined,
        time: parsed.suggestedTime,
        duration: parsed.duration,
        location: parsed.location,
        priority: parsed.priority,
        notes: parsed.notes
      };
      
      setSchedulingData(eventData);
      setShowSchedulingModal(true);
      setChatInput('');
    } catch (error) {
      console.error('Error parsing chat:', error);
    } finally {
      setIsParsingChat(false);
    }
  };

  const handleScheduleSubmit = (eventData: ScheduledEventData) => {
    const newEvent = {
      id: crypto.randomUUID(),
      title: eventData.title,
      date: eventData.date,
      time: eventData.startTime || eventData.time,
      endTime: eventData.endTime,
      category: eventData.priority === 'must' ? 'work' : eventData.priority === 'should' ? 'personal' : 'travel',
      attendees: eventData.participants,
      location: eventData.location,
      description: eventData.notes,
      important: eventData.priority !== 'maybe',
      source: 'chat' as const
    };
    
    // Add to localStorage
    const existingEvents = JSON.parse(localStorage.getItem('gatherly_events') || '[]');
    localStorage.setItem('gatherly_events', JSON.stringify([...existingEvents, newEvent]));
    
    // Create pending event if there are participants
    if (eventData.participants.length > 0) {
      const pending: PendingEvent = {
        id: newEvent.id,
        title: eventData.title,
        date: eventData.date,
        time: eventData.startTime,
        invitees: eventData.participants,
        status: 'waiting'
      };
      setPendingEvents(prev => [...prev, pending]);
      
      // TODO: Send actual email invites here
      console.log('Would send invites to:', eventData.participants);
    }
    
    // Trigger calendar refresh
    window.dispatchEvent(new Event('gatherly_events_updated'));
    
    setShowSchedulingModal(false);
    setSchedulingData(null);
  };

  const handleAddContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
    
    // Save to Supabase
    if (authUser) {
      supabase.from('contacts').insert({
        user_id: authUser.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        is_gatherly: contact.isGatherly
      });
    }
  };

  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your calendar...</p>
      </div>
    );
  }

  const dismissPendingEvent = (id: string) => {
    setPendingEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="dashboard-logo"
            onClick={() => window.location.reload()}
            aria-label="Refresh page"
          >
            <GatherlyLogo size={28} />
            <span className="logo-text">Gatherly</span>
          </button>
        </div>
        <div className="header-center">
          <div className="pending-wrapper">
            <button 
              className="pending-events-btn"
              onClick={() => setShowPending(!showPending)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Pending</span>
              {pendingEvents.length > 0 && (
                <span className="pending-badge">{pendingEvents.length}</span>
              )}
            </button>
            
            {showPending && (
              <div className="pending-dropdown">
                <div className="pending-dropdown-header">
                  <h3>Pending Invitations</h3>
                  <button className="close-btn" onClick={() => setShowPending(false)}>✕</button>
                </div>
                {pendingEvents.length === 0 ? (
                  <div className="pending-empty">
                    <p>No pending events! 🎉</p>
                  </div>
                ) : (
                  <ul className="pending-list">
                    {pendingEvents.map(event => (
                      <li key={event.id} className="pending-item">
                        <div className="pending-item-content">
                          <strong>{event.title}</strong>
                          <span className="pending-date">
                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {event.time && ` at ${event.time}`}
                          </span>
                          <span className={`pending-status ${event.status}`}>
                            {event.status === 'partial' ? '1/' + event.invitees.length + ' responded' : 'Waiting for responses'}
                          </span>
                        </div>
                        <div className="pending-item-actions">
                          <button className="btn-send-reminder">Remind</button>
                          <button className="btn-dismiss" onClick={() => dismissPendingEvent(event.id)}>✕</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-right">
          <LocalInfo minimal />
          <DayNightToggle />
          <button 
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || 'Profile'} 
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Calendar */}
      <main className="dashboard-main">
        <Calendar contacts={contacts} />
      </main>

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showProfile}
        user={user}
        contacts={contacts}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        onAddContact={handleAddContact}
        onImportContacts={syncGoogleContacts}
      />

      {/* Scheduling Modal */}
      <SchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false);
          setSchedulingData(null);
        }}
        initialData={schedulingData}
        contacts={contacts.map(c => ({ id: c.id, name: c.name, email: c.email }))}
        onSubmit={handleScheduleSubmit}
        suggestedTimes={suggestedTimes}
      />

      {/* Chat Bar */}
      <GlassChatBar 
        value={chatInput}
        onChange={setChatInput}
        onSubmit={handleChatSubmit}
        contacts={contacts}
        isLoading={isParsingChat}
      />
    </div>
  );
};
