import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleToken } from '../lib/supabase';
import { createInvites, sendInviteEmails } from '../lib/invites';
import { WeeklyCalendar, type CalendarEvent, type GoogleCalendar, type TimeOption } from '../components/WeeklyCalendar';
import { CreateEventPanel, type CreateEventData, type AvailabilityOption } from '../components/CreateEventPanel';
import { ProfileSidebar } from '../components/ProfileSidebar';
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

interface GatherlyEventResponse {
  email: string;
  selectedOptions: number[];
}

interface GatherlyEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  options: AvailabilityOption[];
  participants: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedOption?: AvailabilityOption;
  responses?: GatherlyEventResponse[];
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, signOut, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // Initialize calendars from localStorage to prevent losing selections on page refresh
  const [calendars, setCalendars] = useState<GoogleCalendar[]>(() => {
    try {
      const savedCalendars = localStorage.getItem('gatherly_calendars_cache');
      if (savedCalendars) {
        const parsed = JSON.parse(savedCalendars);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    // Default to just Gatherly calendar if nothing saved
    return [{ id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true }];
  });
  const [gatherlyEvents, setGatherlyEvents] = useState<GatherlyEvent[]>([]);
  
  // Editing state
  const [editingMode, setEditingMode] = useState(false);
  const [selectedTimeOptions, setSelectedTimeOptions] = useState<TimeOption[]>([]);
  const [suggestedEventData] = useState<Partial<CreateEventData> | undefined>();
  const [isCreating, setIsCreating] = useState(false);

  // Helper to categorize events
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

  // Sync all Google Calendars - defined first so it can be used in useEffect
  const syncGoogleCalendars = useCallback(async () => {
    const providerToken = getGoogleToken();
    if (!providerToken) {
      console.log('No Google token found, skipping calendar sync');
      // Only set default calendars if we don't already have any
      setCalendars(prev => prev.length > 0 ? prev : [{ id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true }]);
      return;
    }

    try {
      const calendarListResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );

      if (!calendarListResponse.ok) {
        if (calendarListResponse.status === 401) localStorage.removeItem('gatherly_google_token');
        // Keep existing calendars on error instead of resetting
        setCalendars(prev => prev.length > 0 ? prev : [{ id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true }]);
        return;
      }

      const calendarListData = await calendarListResponse.json();
      
      let savedSelections: Record<string, boolean> = {};
      try {
        const saved = localStorage.getItem('gatherly_calendar_selections');
        if (saved) savedSelections = JSON.parse(saved);
      } catch {}
      
      const userEmail = authUser?.email?.toLowerCase() || '';
      const googleCalendars: GoogleCalendar[] = (calendarListData.items || []).map((cal: any) => {
        let calName = cal.summary || 'Unnamed Calendar';
        if (userEmail && calName.toLowerCase() === userEmail) {
          calName = 'Personal';
        }
        return {
          id: cal.id,
          name: calName,
          color: cal.backgroundColor || '#4285f4',
          selected: savedSelections[cal.id] !== undefined ? savedSelections[cal.id] : true
        };
      });

      googleCalendars.unshift({
        id: 'gatherly',
        name: 'Gatherly Events',
        color: '#22c55e',
        selected: savedSelections['gatherly'] !== undefined ? savedSelections['gatherly'] : true
      });

      setCalendars(googleCalendars);
      // Cache calendars to localStorage to preserve across page refreshes
      localStorage.setItem('gatherly_calendars_cache', JSON.stringify(googleCalendars));

      // Fetch 3 years back and 1 year forward to ensure all historical and future events load
      const allEvents: CalendarEvent[] = [];
      const now = new Date();
      const timeMin = new Date(now.getFullYear() - 3, 0, 1).toISOString(); // 3 years ago, Jan 1
      const timeMax = new Date(now.getFullYear() + 1, 11, 31).toISOString(); // 1 year ahead, Dec 31

      const fetchPromises = googleCalendars
        .filter(cal => cal.id !== 'gatherly')
        .map(async (cal) => {
          try {
            const eventsResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?` +
              new URLSearchParams({
                timeMin,
                timeMax,
                maxResults: '2500',
                singleEvents: 'true',
                orderBy: 'startTime'
              }),
              { headers: { Authorization: `Bearer ${providerToken}` } }
            );

            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json();
              return (eventsData.items || []).map((item: any) => ({
                id: `gcal-${item.id}`,
                title: item.summary || 'Untitled Event',
                date: item.start?.date || item.start?.dateTime?.split('T')[0],
                time: item.start?.dateTime?.split('T')[1]?.slice(0, 5),
                endTime: item.end?.dateTime?.split('T')[1]?.slice(0, 5),
                category: categorizeEvent(item.summary || ''),
                source: 'google' as const,
                calendarId: cal.id,
                calendarName: cal.name,
                color: cal.color,
                attendees: (item.attendees || []).filter((a: any) => a.email).map((a: any) => a.email),
                location: item.location,
                description: item.description,
                important: true,
              }));
            }
            return [];
          } catch (err) {
            console.error(`Error fetching events for calendar ${cal.name}:`, err);
            return [];
          }
        });

      const results = await Promise.all(fetchPromises);
      results.forEach(calEvents => allEvents.push(...calEvents));

      setEvents(allEvents);
      console.log(`Synced ${allEvents.length} events from Google Calendar`);
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      // Keep existing calendars on error instead of resetting
      setCalendars(prev => prev.length > 0 ? prev : [{ id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true }]);
    }
  }, [authUser?.email]);

  // Load user data on auth
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
        phone: authUser.user_metadata?.phone || '',
      });
      
      // Load contacts and gatherly events (calendar sync handled by periodic effect)
      loadContacts();
      loadGatherlyEvents();
    }
  }, [authUser]);
  
  // Re-sync Google calendars when returning to the page (handles token refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authUser) {
        syncGoogleCalendars();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authUser, syncGoogleCalendars]);
  
  // Periodic sync - poll Google Calendar every 2 minutes for real-time updates
  useEffect(() => {
    if (!authUser) return;
    
    syncGoogleCalendars();
    
    const syncInterval = setInterval(() => {
      console.log('Periodic calendar sync...');
      syncGoogleCalendars();
    }, 7 * 60 * 1000); // 7 minutes to limit API usage
    
    return () => clearInterval(syncInterval);
  }, [authUser, syncGoogleCalendars]);

  // Load contacts from Supabase
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

  // Sync Google Contacts
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
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );

      if (!response.ok) {
        if (response.status === 401) localStorage.removeItem('gatherly_google_token');
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
    } catch (error) {
      console.error('Error syncing Google Contacts:', error);
    }
  };

  // Load Gatherly events from Supabase
  const loadGatherlyEvents = async () => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase
        .from('gatherly_events')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading Gatherly events:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('gatherly_created_events');
        if (stored) {
          setGatherlyEvents(JSON.parse(stored));
        }
        return;
      }
      
      if (data) {
        const events: GatherlyEvent[] = data.map(e => ({
          id: e.id,
          title: e.title,
          options: e.options || [],
          participants: e.participants || [],
          status: e.status,
          createdAt: e.created_at,
          confirmedOption: e.confirmed_option,
          responses: e.responses
        }));
        setGatherlyEvents(events);
        // Also update localStorage for offline access
        localStorage.setItem('gatherly_created_events', JSON.stringify(events));
      }
    } catch (err) {
      console.error('Error loading Gatherly events:', err);
      // Fallback to localStorage
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      setGatherlyEvents(JSON.parse(stored));
    }
    }
  };

  // Save Gatherly event to Supabase
  const saveGatherlyEvent = async (event: GatherlyEvent) => {
    if (!authUser) {
      // Fallback to localStorage only
      const events = [...gatherlyEvents, event];
      setGatherlyEvents(events);
      localStorage.setItem('gatherly_created_events', JSON.stringify(events));
      return;
    }
    
    try {
      // Save all fields including location and description
      const { error } = await supabase.from('gatherly_events').insert({
        id: event.id,
        user_id: authUser.id,
        title: event.title,
        description: event.description || null,
        location: event.location || 'TBD',
        options: event.options,
        participants: event.participants,
        status: event.status,
        created_at: event.createdAt
      });
      
      if (error) {
        console.error('Error saving event to Supabase:', error);
      }
      
      // Update local state regardless
      const events = [...gatherlyEvents, event];
      setGatherlyEvents(events);
      localStorage.setItem('gatherly_created_events', JSON.stringify(events));
    } catch (err) {
      console.error('Error saving event:', err);
      // Still update local state
      const events = [...gatherlyEvents, event];
    setGatherlyEvents(events);
    localStorage.setItem('gatherly_created_events', JSON.stringify(events));
    }
  };

  // Toggle calendar visibility - persist to localStorage
  const handleCalendarToggle = useCallback((calendarId: string) => {
    setCalendars(prev => {
      const updated = prev.map(cal =>
      cal.id === calendarId ? { ...cal, selected: !cal.selected } : cal
      );
      // Save selected state to localStorage
      const selectedStates: Record<string, boolean> = {};
      updated.forEach(cal => { selectedStates[cal.id] = cal.selected; });
      localStorage.setItem('gatherly_calendar_selections', JSON.stringify(selectedStates));
      // Also update the full calendars cache
      localStorage.setItem('gatherly_calendars_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle editing mode change from CreateEventPanel
  const handleEditingModeChange = useCallback((editing: boolean) => {
    setEditingMode(editing);
    if (!editing) {
      setSelectedTimeOptions([]);
    }
  }, []);

  // Handle field changes for real-time calendar preview
  const handleFieldChange = useCallback((data: Partial<CreateEventData>) => {
    if (data.availabilityOptions) {
      setSelectedTimeOptions(data.availabilityOptions.map(opt => ({
        date: opt.day,
        time: opt.time,
        duration: opt.duration,
        color: opt.color
      })));
    }
  }, []);

  // Handle event creation
  const handleCreateEvent = async (data: CreateEventData) => {
    setIsCreating(true);
    
    try {
      const eventId = crypto.randomUUID();
      
      // Filter out the current user from participants (they're the organizer, not invitee)
      const inviteParticipants = data.participants.filter(p => p !== user?.email);
      
      // Create Gatherly event
      const gatherlyEvent: GatherlyEvent = {
        id: eventId,
        title: data.eventName,
        description: data.description,
        location: data.location,
        options: data.availabilityOptions,
        participants: inviteParticipants,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await saveGatherlyEvent(gatherlyEvent);

      // Create invites for participants (not including organizer)
      // Filter to only valid email addresses
      const validEmailParticipants = inviteParticipants.filter(p => 
        p && p.includes('@') && p.includes('.')
      );
      
      if (validEmailParticipants.length > 0 && user) {
        const { invites, errors } = await createInvites(
          eventId,
          {
            title: data.eventName,
            date: data.availabilityOptions[0]?.day || '',
            time: data.availabilityOptions[0]?.time || '',
            location: data.location || 'TBD',
          },
          user.full_name || user.email?.split('@')[0] || 'Someone',
          user.email || '',
          validEmailParticipants
        );
        
        if (errors.length > 0) {
          console.error('Some invites failed:', errors);
        }
        
        // Log warning for invalid emails
        const invalidParticipants = inviteParticipants.filter(p => !p.includes('@') || !p.includes('.'));
        if (invalidParticipants.length > 0) {
          console.warn('Skipped participants without valid emails:', invalidParticipants);
        }
        
        if (invites.length > 0) {
          // Pass all availability options to the email
          const allSuggestedTimes = data.availabilityOptions
            .filter(opt => opt.day && opt.time) // Only include filled options
            .map(opt => ({
              day: opt.day,
              time: opt.time,
              duration: opt.duration || 60
            }));
          
          await sendInviteEmails(invites, allSuggestedTimes);
          invites.forEach(invite => {
            console.log(`Invite for ${invite.invitee_email}: ${window.location.origin}/invite/${invite.token}`);
          });
        }
      }

      setEditingMode(false);
      setSelectedTimeOptions([]);
      
      // Reload calendars to ensure they stay in sync
      // This prevents the calendar disassociation issue
      await loadGatherlyEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // Could open event details modal
  };

  // Handle time slot click
  const handleTimeSlotClick = (date: string, time: string) => {
    console.log('Time slot clicked:', date, time);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddContact = async (contact: Contact) => {
    // Check if contact already exists
    if (contacts.find(c => c.email.toLowerCase() === contact.email.toLowerCase())) {
      console.log('Contact already exists');
      return;
    }
    
    setContacts(prev => [...prev, contact]);
    
    if (authUser) {
      try {
        const { error } = await supabase.from('contacts').insert({
          id: contact.id,
        user_id: authUser.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        is_gatherly: contact.isGatherly
      });
        
        if (error) {
          console.error('Error saving contact:', error);
        }
      } catch (err) {
        console.error('Error saving contact:', err);
      }
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    
    if (authUser) {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId)
          .eq('user_id', authUser.id);
        
        if (error) {
          console.error('Error removing contact:', error);
        }
      } catch (err) {
        console.error('Error removing contact:', err);
      }
    }
  };

  // Combine Google events with Gatherly events for calendar display
  const allCalendarEvents = useMemo((): CalendarEvent[] => {
    // Convert Gatherly events to calendar events
    const gatherlyCalEvents: CalendarEvent[] = [];
    
    for (const ge of gatherlyEvents) {
      for (let idx = 0; idx < ge.options.length; idx++) {
        const opt = ge.options[idx];
        const calEvent: CalendarEvent = {
          id: `gatherly-${ge.id}-${idx}`,
          date: opt.day,
          time: opt.time,
          endTime: undefined,
          title: ge.title,
          category: 'gatherly',
          duration: opt.duration,
          attendees: ge.participants,
          source: 'gatherly',
          calendarId: 'gatherly',
          isGatherlyEvent: true,
          status: ge.status,
          suggestedTimes: ge.options.map(o => ({ date: o.day, time: o.time, color: o.color })),
          optionNumber: idx + 1 // 1, 2, or 3 for pending event options
        };
        gatherlyCalEvents.push(calEvent);
      }
    }
    
    // Merge with Google calendar events
    const merged: CalendarEvent[] = [...events, ...gatherlyCalEvents];
    return merged;
  }, [events, gatherlyEvents]);

  // Filter events by toggled calendars for scheduling availability check
  const filteredEventsForScheduling = useMemo((): CalendarEvent[] => {
    const selectedCalendarIds = calendars.filter(c => c.selected).map(c => c.id);
    const gatherlyCalendar = calendars.find(c => c.id === 'gatherly');
    const showGatherlyEvents = gatherlyCalendar?.selected !== false;

    return allCalendarEvents.filter(e => {
      // Handle Gatherly events
      if (e.isGatherlyEvent || e.calendarId === 'gatherly') {
        return showGatherlyEvents;
      }
      if (!e.calendarId) return true;
      return selectedCalendarIds.includes(e.calendarId);
    });
  }, [allCalendarEvents, calendars]);

  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your calendar...</p>
      </div>
    );
  }

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
          {/* Events button moved to Create Event panel */}
        </div>
        <div className="header-right">
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

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Calendar - 2/3 width */}
        <div className={`calendar-section ${editingMode ? 'editing-mode' : ''}`}>
          <WeeklyCalendar
            events={allCalendarEvents}
            calendars={calendars}
            onCalendarToggle={handleCalendarToggle}
            selectedTimeOptions={selectedTimeOptions}
            editingMode={editingMode}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </div>

        {/* Create Event Panel - 1/3 width */}
        <div className="create-event-section">
          <CreateEventPanel
            contacts={contacts}
            currentUserEmail={user?.email}
            currentUserName={user?.full_name}
            onSubmit={handleCreateEvent}
            onFieldChange={handleFieldChange}
            onEditingModeChange={handleEditingModeChange}
            suggestedData={suggestedEventData}
            isLoading={isCreating}
            events={filteredEventsForScheduling}
          />
        </div>
      </main>

      {/* Profile Sidebar - opens as overlay, not blocking right panel */}
      <ProfileSidebar 
        isOpen={showProfile}
        user={user}
        contacts={contacts}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        onAddContact={handleAddContact}
        onRemoveContact={handleRemoveContact}
        onImportContacts={syncGoogleContacts}
      />
    </div>
  );
};

export default Dashboard;
