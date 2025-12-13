import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleTokenSync as getGoogleToken, GOOGLE_OAUTH_SCOPES } from '../lib/supabase';
import { createInvites, sendInviteEmails, deleteNotification as deleteNotificationFromDB, deleteAllNotifications as deleteAllNotificationsFromDB } from '../lib/invites';
import { WeeklyCalendar, type CalendarEvent, type GoogleCalendar, type TimeOption } from '../components/WeeklyCalendar';
import { CreateEventPanel, type CreateEventData, type AvailabilityOption } from '../components/CreateEventPanel';
import { ProfileSidebar } from '../components/ProfileSidebar';
import './Dashboard.css';

// Google Calendar connection prompt for non-OAuth users
const CalendarConnectionPrompt: React.FC<{ onConnect: () => void; onDismiss: () => void }> = ({ onConnect, onDismiss }) => (
  <div className="calendar-connection-prompt">
    <div className="connection-prompt-content">
      <div className="connection-prompt-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <h2>Connect Your Calendar</h2>
      <p>To use Gatherly's scheduling features, you need to connect your Google Calendar.</p>
      <p className="connection-benefits">This allows you to:</p>
      <ul>
        <li>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          See your availability at a glance
        </li>
        <li>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Avoid scheduling conflicts
        </li>
        <li>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Automatically add confirmed events
        </li>
      </ul>
      <div className="connection-prompt-actions">
        <button className="connect-google-btn" onClick={onConnect}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Connect Google Calendar
        </button>
        <button className="dismiss-btn" onClick={onDismiss}>
          I'll do this later
        </button>
      </div>
    </div>
  </div>
);

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
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isGatherly?: boolean;
  photo?: string | null;
  isGoogle?: boolean;
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
  addGoogleMeet?: boolean;
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
          // Ensure both Gatherly calendars exist
          const hasConfirmed = parsed.some((c: GoogleCalendar) => c.id === 'gatherly');
          const hasPending = parsed.some((c: GoogleCalendar) => c.id === 'gatherly-pending');
          if (!hasConfirmed) {
            parsed.unshift({ id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true });
          }
          if (!hasPending) {
            parsed.splice(1, 0, { id: 'gatherly-pending', name: 'Gatherly Pending', color: '#FBBF24', selected: true });
          }
          return parsed;
        }
      }
    } catch {}
    // Default to both Gatherly calendars
    return [
      { id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true },
      { id: 'gatherly-pending', name: 'Gatherly Pending', color: '#FBBF24', selected: true }
    ];
  });
  const [gatherlyEvents, setGatherlyEvents] = useState<GatherlyEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true); // Track calendar loading state
  
  // Editing state
  const [editingMode, setEditingMode] = useState(false);
  const [selectedTimeOptions, setSelectedTimeOptions] = useState<TimeOption[]>([]);
  const [suggestedEventData, setSuggestedEventData] = useState<Partial<CreateEventData> | undefined>();
  const [isCreating, setIsCreating] = useState(false);

  // Event detail modal state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isReminding, setIsReminding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Custom confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);
  
  // Alert modal state (for success/error messages)
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Calendar connection prompt state
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [hasCheckedCalendarConnection, setHasCheckedCalendarConnection] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(true); // Assume true until checked
  
  // Notifications state
  interface Notification {
    id: string;
    type: string;
    title: string;
    message?: string;
    read: boolean;
    created_at: string;
    event_id?: string;
    }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Daily summary state
  interface SuggestedEvent {
    title: string;
    reason: string;
    suggestedDate: string;
    suggestedTime: string;
    duration: number;
  }
  interface DailySummary {
    greeting: string;
    focusSummary: string;
    todayHighlights: string[];
    lookAhead: string;
    suggestedEvents: SuggestedEvent[];
  }
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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
    setCalendarLoading(true);
    const providerToken = getGoogleToken();
    if (!providerToken) {
      console.log('No Google token found, skipping calendar sync');
      // Only set default calendars if we don't already have any
      setCalendars(prev => prev.length > 0 ? prev : [
        { id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true },
        { id: 'gatherly-pending', name: 'Gatherly Pending', color: '#FBBF24', selected: true }
      ]);
      setCalendarLoading(false);
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
        setCalendars(prev => prev.length > 0 ? prev : [
          { id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true },
          { id: 'gatherly-pending', name: 'Gatherly Pending', color: '#FBBF24', selected: true }
        ]);
        setCalendarLoading(false);
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

      // Add Gatherly calendars at the beginning
      googleCalendars.unshift({
        id: 'gatherly-pending',
        name: 'Gatherly Pending',
        color: '#FBBF24',
        selected: savedSelections['gatherly-pending'] !== undefined ? savedSelections['gatherly-pending'] : true
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
        .filter(cal => cal.id !== 'gatherly' && cal.id !== 'gatherly-pending')
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
              return (eventsData.items || []).map((item: any) => {
                // Check if this event was created via Gatherly
                const isGatherlyScheduled = item.description?.includes('[Scheduled with Gatherly]') || false;
                
                // Debug: Log Gatherly-scheduled events
                if (isGatherlyScheduled) {
                  console.log('[Gatherly] Found Gatherly-scheduled event:', item.summary, '| isGatherlyScheduled:', isGatherlyScheduled);
                }
                
                return {
              id: `gcal-${item.id}`,
              title: item.summary || 'Untitled Event',
              date: item.start?.date || item.start?.dateTime?.split('T')[0],
              time: item.start?.dateTime?.split('T')[1]?.slice(0, 5),
              endTime: item.end?.dateTime?.split('T')[1]?.slice(0, 5),
              category: categorizeEvent(item.summary || ''),
              source: 'google' as const,
              calendarId: cal.id,
              calendarName: cal.name,
                  // Use green color for Gatherly-scheduled events, otherwise calendar color
                  color: isGatherlyScheduled ? '#22c55e' : cal.color,
              attendees: (item.attendees || []).filter((a: any) => a.email).map((a: any) => a.email),
              location: item.location,
              description: item.description,
              important: true,
                  isGatherlyScheduled,
                  htmlLink: item.htmlLink, // Store the direct link to view event in Google Calendar
                };
              });
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
      setCalendarLoading(false);
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      // Keep existing calendars on error instead of resetting
      setCalendars(prev => prev.length > 0 ? prev : [
        { id: 'gatherly', name: 'Gatherly Events', color: '#22c55e', selected: true },
        { id: 'gatherly-pending', name: 'Gatherly Pending', color: '#FBBF24', selected: true }
      ]);
      setCalendarLoading(false);
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

  // Check if user has Google Calendar connected
  useEffect(() => {
    if (!authUser || hasCheckedCalendarConnection) return;
    
    setHasCheckedCalendarConnection(true);
    
    // Check if user has a Google token - this is required for calendar access
    const googleToken = getGoogleToken();
    
    // Check if user originally signed up with Google (has google identity)
    const isGoogleUser = authUser.app_metadata?.provider === 'google' || 
                         authUser.identities?.some((i: { provider: string }) => i.provider === 'google');
    
    // Calendar is ONLY connected if we have a valid Google token
    // Even if user is a Google user, they need a token for calendar access
    const calendarConnected = !!googleToken;
    setIsCalendarConnected(calendarConnected);
    
    // Show prompt if no Google token
    // This handles both: non-Google users AND Google users who logged in with email/password
    if (!calendarConnected) {
      setShowCalendarPrompt(true);
      
      // If this is a Google user without a token, they logged in with email/password
      // Log this for debugging
      if (isGoogleUser) {
        console.log('Google user logged in without OAuth - calendar reconnection needed');
      }
    }
  }, [authUser, hasCheckedCalendarConnection]);

  // Handle Google Calendar connection
  const handleConnectGoogleCalendar = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
          scopes: GOOGLE_OAUTH_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Always force consent when explicitly connecting calendar
            // Enable incremental authorization (OAuth 2.0 best practice)
            include_granted_scopes: 'true',
          }
        }
      });

      if (error) {
        console.error('Error connecting Google Calendar:', error);
      }
    } catch (err) {
      console.error('Error connecting Google Calendar:', err);
    }
  };

  // Dismiss calendar connection prompt - but remind again later
  const handleDismissCalendarPrompt = () => {
    setShowCalendarPrompt(false);
    // Don't store permanent dismissal - user needs to connect to use full features
  };

  // Load notifications and subscribe to realtime updates
  useEffect(() => {
    if (!authUser) return;

    // Load existing notifications
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.log('Notifications table may not exist yet:', err);
      }
    };

    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authUser.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  // Fetch daily summary when events are loaded
  useEffect(() => {
    const fetchDailySummary = async () => {
      if (!authUser || calendarLoading || events.length === 0) return;
      
      // Only fetch once per session or when showNotifications opens
      const lastFetch = sessionStorage.getItem('gatherly_summary_fetched');
      const today = new Date().toDateString();
      if (lastFetch === today && dailySummary) return;
      
      setSummaryLoading(true);
      try {
        const response = await fetch('/api/daily-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: events.map(e => ({
              title: e.title,
              date: e.date,
              time: e.time,
              endTime: e.endTime,
              location: e.location,
              isGatherly: e.isGatherlyEvent,
              status: e.status,
              attendees: e.attendees
            })),
            userName: user?.full_name || user?.email?.split('@')[0] || '',
            contacts: contacts.map(c => c.name)
          })
        });
        
        if (response.ok) {
          const summary = await response.json();
          setDailySummary(summary);
          sessionStorage.setItem('gatherly_summary_fetched', today);
        }
      } catch (err) {
        console.log('Could not fetch daily summary:', err);
      } finally {
        setSummaryLoading(false);
      }
    };
    
    if (showNotifications && !dailySummary && !summaryLoading) {
      fetchDailySummary();
    }
  }, [showNotifications, authUser, events, calendarLoading, contacts, user, dailySummary, summaryLoading]);

  // Mark notification as read
  const markNotificationAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', authUser?.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!authUser?.id) {
      console.log('No auth user, cannot clear notifications');
      return;
    }
    
    console.log('Clearing all notifications for user:', authUser.id);
    
    // Save current notifications in case we need to revert
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    // Optimistically update UI
    setNotifications([]);
    setUnreadCount(0);
    
    // Use the dedicated function from invites.ts
    const success = await deleteAllNotificationsFromDB(authUser.id);
    
    if (!success) {
      console.error('Failed to clear notifications, reverting UI');
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  // Dismiss a single notification
  const dismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the notification click
    
    console.log('Dismissing notification:', id);
    
    // Optimistically update UI first
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Use the dedicated function from invites.ts
    const success = await deleteNotificationFromDB(id);

    if (!success && notification) {
      console.error('Failed to dismiss notification, reverting UI');
      setNotifications(prev => [...prev, notification]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  // Fetch Google Contacts using People API
  const fetchGoogleContacts = async () => {
    const googleToken = getGoogleToken();
    if (!googleToken) return [];
    
    try {
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=200',
        {
          headers: { Authorization: `Bearer ${googleToken}` }
        }
      );
      
      if (!response.ok) {
        console.log('Could not fetch Google Contacts');
        return [];
      }
      
      const data = await response.json();
      
      return (data.connections || [])
        .map((person: { names?: { displayName: string }[]; emailAddresses?: { value: string }[]; photos?: { url: string }[] }) => ({
          id: `google-${person.emailAddresses?.[0]?.value || Math.random()}`,
          name: person.names?.[0]?.displayName || '',
          email: person.emailAddresses?.[0]?.value || '',
          photo: person.photos?.[0]?.url || null,
          isGoogle: true
        }))
        .filter((c: { email: string }) => c.email);
    } catch (err) {
      console.log('Error fetching Google Contacts:', err);
      return [];
    }
  };

  // Load contacts from Supabase and merge with Google Contacts
  const loadContacts = async () => {
    if (!authUser) return;
    
    try {
      // Load from Supabase
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', authUser.id);
      
      const supabaseContacts = (!error && data) 
        ? data.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            isGatherly: c.is_gatherly
          }))
        : [];
      
      // Fetch Google Contacts
      const googleContacts = await fetchGoogleContacts();
      
      // Merge contacts, avoiding duplicates by email
      const emailSet = new Set(supabaseContacts.map(c => c.email.toLowerCase()));
      const mergedContacts = [
        ...supabaseContacts,
        ...googleContacts.filter((gc: { email: string }) => !emailSet.has(gc.email.toLowerCase()))
      ];
      
      setContacts(mergedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
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
          responses: e.responses,
          addGoogleMeet: e.add_google_meet || false
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
      // Save all fields including location, description, and Google Meet preference
      const { error } = await supabase.from('gatherly_events').insert({
        id: event.id,
        user_id: authUser.id,
        title: event.title,
        description: event.description || null,
        location: event.location || 'TBD',
        options: event.options,
        participants: event.participants,
        status: event.status,
        created_at: event.createdAt,
        add_google_meet: event.addGoogleMeet || false
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
        createdAt: new Date().toISOString(),
        addGoogleMeet: data.addGoogleMeet
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

  // Handle event click - show event details modal
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Extract real event ID from formatted calendar ID
  const extractEventId = (formattedId: string): string => {
    if (formattedId.startsWith('gatherly-')) {
      let eventId = formattedId.slice(9); // Remove 'gatherly-' prefix
      // Remove -confirmed or -0, -1, -2 suffix
      eventId = eventId.replace(/-confirmed$/, '').replace(/-\d+$/, '');
      return eventId;
    }
    return formattedId;
  };

  // Handle remind for Gatherly events
  const handleRemindEvent = async () => {
    if (!selectedEvent || !selectedEvent.isGatherlyEvent) return;
    setIsReminding(true);
    try {
      const eventId = extractEventId(selectedEvent.id);
      
      // Use bulk reminder endpoint with eventId - it looks up invites and sends reminders with proper tokens
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reminders');
        }
      
      setAlertModal({
        show: true,
        title: 'Reminder Sent',
        message: result.sent > 0 
          ? `Sent ${result.sent} reminder${result.sent > 1 ? 's' : ''} to pending invitees.`
          : 'No pending invitees to remind.',
        type: 'success'
      });
    } catch (error) {
      console.error('Remind error:', error);
      setAlertModal({
        show: true,
        title: 'Failed to Send',
        message: 'Could not send reminder. Please try again.',
        type: 'error'
      });
    } finally {
      setIsReminding(false);
    }
  };

  // Handle cancel for Gatherly events - shows confirm modal
  const handleCancelEvent = () => {
    if (!selectedEvent || !selectedEvent.isGatherlyEvent) return;
    const eventId = extractEventId(selectedEvent.id);
    setConfirmModal({
      show: true,
      title: 'Cancel Event',
      message: `Are you sure you want to cancel "${selectedEvent.title}"? All invitees will be notified.`,
      confirmText: 'Cancel Event',
      cancelText: 'Keep Event',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(null);
        setIsCancelling(true);
        try {
          // Get event details from database for sending notifications
          const { data: eventData } = await supabase
            .from('gatherly_events')
            .select('*')
            .eq('id', eventId)
            .single();
          
          // Check if event is already cancelled - prevent double emails
          if (eventData?.status === 'cancelled') {
            console.log('[Dashboard Cancel] Event already cancelled, skipping emails');
            setSelectedEvent(null);
            setIsCancelling(false);
            return;
          }
          
          if (eventData && eventData.participants) {
            const hostName = user?.full_name || user?.email?.split('@')[0] || 'The organizer';
            const hostEmail = user?.email || '';
            
            // Send cancellation notifications to each participant (deduplicated)
            const participants: string[] = Array.isArray(eventData.participants) ? eventData.participants : [];
            const uniqueParticipants = [...new Set(participants)]; // Deduplicate
            console.log('[Dashboard Cancel] Sending cancellation emails to:', uniqueParticipants);
            await Promise.all(uniqueParticipants.map(async (email) => {
              try {
                console.log('[Dashboard Cancel] Sending cancellation email to:', email);
                await fetch('/api/send-cancel-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: email,
                    eventTitle: selectedEvent.title,
                    hostName,
                    hostEmail,
                  }),
          });
              } catch (err) {
                console.error(`Error sending cancellation to ${email}:`, err);
              }
            }));
          }
          
          // If event was confirmed, delete from Google Calendar first
          if (eventData?.status === 'confirmed' && eventData?.google_event_id) {
            const providerToken = getGoogleToken();
            if (providerToken) {
              try {
                await fetch(
                  `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.google_event_id}?sendUpdates=all`,
                  {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${providerToken}` }
                  }
                );
              } catch (gcalErr) {
                console.error('Error deleting from Google Calendar:', gcalErr);
              }
            }
          }
          
          // Update event status in database
          const { error } = await supabase
            .from('gatherly_events')
            .update({ status: 'cancelled' })
            .eq('id', eventId);
          if (error) throw error;
          
          setSelectedEvent(null);
          setAlertModal({
            show: true,
            title: 'Event Cancelled',
            message: 'The event has been cancelled and all invitees have been notified.',
            type: 'success'
          });
          // Refresh events
          loadGatherlyEvents();
        } catch (error) {
          console.error('Cancel error:', error);
          setAlertModal({
            show: true,
            title: 'Failed to Cancel',
            message: 'Could not cancel event. Please try again.',
            type: 'error'
          });
        } finally {
          setIsCancelling(false);
        }
      }
    });
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
    
    // Track confirmed Gatherly events to filter out duplicates from Google Calendar
    const confirmedGatherlyKeys = new Set<string>();
    
    for (const ge of gatherlyEvents) {
      // For confirmed events, only show the confirmed option
      if (ge.status === 'confirmed' && ge.confirmedOption) {
        const calEvent: CalendarEvent = {
          id: `gatherly-${ge.id}-confirmed`,
          date: ge.confirmedOption.day,
          time: ge.confirmedOption.time,
          endTime: undefined,
          title: ge.title,
          category: 'gatherly',
          duration: ge.confirmedOption.duration,
          attendees: ge.participants,
          location: ge.location,
          source: 'gatherly',
          calendarId: 'gatherly',
          isGatherlyEvent: true,
          status: 'confirmed'
        };
        gatherlyCalEvents.push(calEvent);
        
        // Create a key to identify this event for duplicate detection
        // Key format: date|time|title (lowercased and trimmed)
        const key = `${ge.confirmedOption.day}|${ge.confirmedOption.time}|${ge.title.toLowerCase().trim()}`;
        confirmedGatherlyKeys.add(key);
      } else if (ge.status === 'pending') {
        // For pending events, show all options with option numbers - use 'gatherly-pending' calendar
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
            location: ge.location,
          source: 'gatherly',
            calendarId: 'gatherly-pending', // Use pending calendar for pending events
        isGatherlyEvent: true,
        status: ge.status,
            suggestedTimes: ge.options.map(o => ({ date: o.day, time: o.time, color: o.color })),
            optionNumber: idx + 1, // 1, 2, or 3 for pending event options
            responses: ge.responses // Include participant responses
        };
        gatherlyCalEvents.push(calEvent);
      }
    }
    }

    // Filter Google Calendar events to remove duplicates of confirmed Gatherly events
    // This ensures the Gatherly event displays OVER the personal calendar event
    const filteredGoogleEvents = events.filter(e => {
      // If this is a Gatherly-scheduled event (created via Gatherly), always filter it out
      // when there's a corresponding confirmed Gatherly event
      if (e.isGatherlyScheduled) {
        // Check if there's a matching confirmed Gatherly event by title
        const matchingGatherly = gatherlyEvents.find(ge => 
          ge.status === 'confirmed' && 
          ge.title.toLowerCase().trim() === e.title.toLowerCase().trim()
        );
        if (matchingGatherly) {
          console.log(`[Gatherly] Filtering Gatherly-scheduled Google event: ${e.title}`);
          return false;
        }
      }
      
      // Only filter events that could be duplicates (have date, time, title)
      if (!e.date || !e.time || !e.title) return true;
      
      // Create the same key format
      const key = `${e.date}|${e.time}|${e.title.toLowerCase().trim()}`;
      
      // If this matches a confirmed Gatherly event, filter it out
      if (confirmedGatherlyKeys.has(key)) {
        console.log(`[Gatherly] Filtering duplicate Google Calendar event: ${e.title} on ${e.date} at ${e.time}`);
        return false;
      }
      
      return true;
    });
    
    // Merge with filtered Google calendar events
    const merged: CalendarEvent[] = [...filteredGoogleEvents, ...gatherlyCalEvents];
    return merged;
  }, [events, gatherlyEvents]);

  // Filter events by toggled calendars for scheduling availability check
  // IMPORTANT: Always include pending Gatherly events as busy slots to avoid double-booking
  const filteredEventsForScheduling = useMemo((): CalendarEvent[] => {
    const selectedCalendarIds = calendars.filter(c => c.selected).map(c => c.id);
    const gatherlyCalendar = calendars.find(c => c.id === 'gatherly');
    const showConfirmedGatherly = gatherlyCalendar?.selected !== false;

    return allCalendarEvents.filter(e => {
      // Handle Gatherly confirmed events
      if (e.calendarId === 'gatherly') {
        return showConfirmedGatherly;
      }
      // ALWAYS include pending Gatherly events as busy slots (to avoid double-booking)
      if (e.calendarId === 'gatherly-pending') {
        return true; // Always include pending events for scheduling
      }
      // Handle legacy gatherly events - always include for scheduling
      if (e.isGatherlyEvent && !e.calendarId) {
        return true;
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
          {/* Notification Bell */}
          <div className="notification-bell-container">
            <button 
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                {/* Click-outside overlay */}
                <div 
                  className="notification-overlay"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="notification-dropdown">
                <div className="notification-header">
                  <button 
                    className="notification-close-btn"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                  <h3>Notifications</h3>
                  <div className="notification-actions">
                  {unreadCount > 0 && (
                    <button 
                      className="mark-all-read"
                      onClick={markAllNotificationsAsRead}
                    >
                        Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button 
                        className="clear-all-notifications"
                        onClick={clearAllNotifications}
                      >
                        Clear all
                    </button>
                  )}
                </div>
                </div>
                
                {/* Daily Summary Section */}
                <div className="daily-summary-section">
                  {summaryLoading ? (
                    <div className="summary-loading">
                      <div className="summary-loading-spinner"></div>
                      <span>Getting your day ready...</span>
                    </div>
                  ) : dailySummary ? (
                    <>
                      <div className="summary-greeting">{dailySummary.greeting}</div>
                      <div className="summary-focus">{dailySummary.focusSummary}</div>
                      
                      {dailySummary.todayHighlights.length > 0 && (
                        <div className="summary-highlights">
                          <span className="highlights-label">Today:</span>
                          {dailySummary.todayHighlights.map((h, i) => (
                            <div key={i} className="highlight-item">{h}</div>
                          ))}
                        </div>
                      )}
                      
                      {dailySummary.lookAhead && (
                        <div className="summary-lookahead">{dailySummary.lookAhead}</div>
                      )}
                      
                      {dailySummary.suggestedEvents.length > 0 && (
                        <div className="suggested-events">
                          <span className="suggested-label">Quick add:</span>
                          {dailySummary.suggestedEvents.map((event, i) => (
                            <button
                              key={i}
                              className="suggested-event-btn"
                              onClick={() => {
                                // Populate the create event form with 3 suggested time options
                                const duration = event.duration || 60;
                                const suggestedOptions: { id: string; day: string; time: string; duration: number; color: string }[] = [];
                                
                                if (event.suggestedDate && event.suggestedTime) {
                                  // Generate 3 time options: suggested time, +2 hours, and next day same time
                                  const baseDate = new Date(`${event.suggestedDate}T${event.suggestedTime}`);
                                  
                                  // Option 1: Original suggested time
                                  suggestedOptions.push({
                                    id: crypto.randomUUID(),
                                    day: event.suggestedDate,
                                    time: event.suggestedTime,
                                    duration,
                                    color: '#22c55e'
                                  });
                                  
                                  // Option 2: 2 hours later same day (or next reasonable slot)
                                  const option2Date = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000);
                                  suggestedOptions.push({
                                    id: crypto.randomUUID(),
                                    day: option2Date.toISOString().split('T')[0],
                                    time: option2Date.toTimeString().slice(0, 5),
                                    duration,
                                    color: '#3b82f6'
                                  });
                                  
                                  // Option 3: Next day same time
                                  const option3Date = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
                                  suggestedOptions.push({
                                    id: crypto.randomUUID(),
                                    day: option3Date.toISOString().split('T')[0],
                                    time: event.suggestedTime,
                                    duration,
                                    color: '#f59e0b'
                                  });
                                }
                                
                                setSuggestedEventData({
                                  eventName: event.title,
                                  description: event.reason || '',
                                  location: '',
                                  participants: [],
                                  availabilityOptions: suggestedOptions
                                });
                                // Enter edit mode to show the calendar with the time options
                                if (suggestedOptions.length > 0) {
                                  setEditingMode(true);
                                  setSelectedTimeOptions(suggestedOptions.map(opt => ({
                                    date: opt.day,
                                    time: opt.time,
                                    duration: opt.duration,
                                    color: opt.color
                                  })));
                                }
                                setShowNotifications(false);
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                              <span className="suggested-title">{event.title}</span>
                              <span className="suggested-reason">{event.reason}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="summary-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      <span>Your daily focus will appear here</span>
                    </div>
                  )}
                </div>
                
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <button
                        key={notification.id}
                        className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.type.includes('gatherly') || notification.type === 'invite_received' || notification.type === 'event_scheduled' ? 'gatherly-notification' : ''}`}
                        onClick={() => {
                          markNotificationAsRead(notification.id);
                          if (notification.event_id) {
                            navigate(`/event/${notification.event_id}`);
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <div className="notification-icon">
                          {notification.type === 'invite_received' && (
                            <div className="gatherly-notif-icon">
                              <svg width="16" height="16" viewBox="-2 -2 28 28" fill="none">
                                <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                                <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                                <circle cx="6" cy="16" r="5" fill="none" stroke="#22c55e" strokeWidth="2"/>
                                <path d="M6 14V18M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            </div>
                          )}
                          {notification.type === 'response_received' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <path d="M22 4L12 14.01l-3-3"/>
                            </svg>
                          )}
                          {notification.type === 'event_scheduled' && (
                            <div className="gatherly-notif-icon confirmed">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            </div>
                          )}
                          {notification.type === 'event_cancelled' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M15 9l-6 6M9 9l6 6"/>
                            </svg>
                          )}
                          {notification.type === 'reminder' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                          )}
                          {notification.type === 'event_updated' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          )}
                          {notification.type === 'invitee_response' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                          )}
                        </div>
                        <div className="notification-content">
                          <span className="notification-title">{notification.title}</span>
                          {notification.message && (
                            <span className="notification-message">{notification.message}</span>
                          )}
                          <span className="notification-time">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          className="notification-dismiss"
                          onClick={(e) => dismissNotification(notification.id, e)}
                          title="Dismiss notification"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </div>
              </>
            )}
          </div>

          <button 
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || 'Profile'} 
                className="profile-avatar"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="profile-avatar-placeholder"
              style={{ display: user?.avatar_url ? 'none' : 'flex' }}
            >
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
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
            loading={calendarLoading}
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
          {/* Overlay when calendar not connected */}
          {!isCalendarConnected && (
            <div className="calendar-not-connected-overlay">
              <div className="cnc-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>Connect your Google Calendar to create events</p>
                <button onClick={() => setShowCalendarPrompt(true)} className="cnc-connect-btn">
                  Connect Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Calendar Connection Prompt for non-Google OAuth users */}
      {showCalendarPrompt && (
        <CalendarConnectionPrompt 
          onConnect={handleConnectGoogleCalendar}
          onDismiss={handleDismissCalendarPrompt}
        />
      )}

      {/* Profile Sidebar - opens as overlay, not blocking right panel */}
      <ProfileSidebar 
        isOpen={showProfile}
        user={user}
        contacts={contacts}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        onAddContact={handleAddContact}
        onRemoveContact={handleRemoveContact}
        isCalendarConnected={isCalendarConnected}
        onConnectCalendar={handleConnectGoogleCalendar}
      />

      {/* Event Detail Modal - Compact */}
      {selectedEvent && (
        <div className="event-detail-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="event-detail-close" onClick={() => setSelectedEvent(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            <div className="event-detail-header">
              <div 
                className="event-detail-color-bar" 
                style={{ backgroundColor: selectedEvent.color || '#22c55e' }}
              />
              <div className="event-detail-title-section">
                <h2>{selectedEvent.title}</h2>
                {(selectedEvent.isGatherlyEvent || selectedEvent.isGatherlyScheduled) && (
                  <span className="event-detail-badge gatherly">Gatherly</span>
                )}
              </div>
            </div>
            
            <div className="event-detail-content">
              {/* Date & Time */}
              <div className="event-detail-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span className="event-detail-label">
                  {selectedEvent.date ? new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  }) : 'No date'}
                  {selectedEvent.time && (
                    <span className="event-detail-sub">
                      {new Date(`2000-01-01T${selectedEvent.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {selectedEvent.endTime && ` - ${new Date(`2000-01-01T${selectedEvent.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                    </span>
                  )}
                </span>
              </div>
              
              {/* Location */}
              {selectedEvent.location && (
                <div className="event-detail-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="event-detail-label">{selectedEvent.location}</span>
                </div>
              )}
              
              {/* Calendar */}
              {selectedEvent.calendarName && (
                <div className="event-detail-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  <span className="event-detail-label">{selectedEvent.calendarName}</span>
                </div>
              )}
              
              {/* Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="event-detail-attendees-section">
                  <div className="attendees-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                    <span>{selectedEvent.attendees.length} attendee{selectedEvent.attendees.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="attendees-chips">
                      {selectedEvent.attendees.slice(0, 3).map((email, idx) => (
                        <span key={idx} className="attendee-chip">{email}</span>
                      ))}
                      {selectedEvent.attendees.length > 3 && (
                        <span className="attendee-chip more">+{selectedEvent.attendees.length - 3}</span>
                      )}
                  </div>
                </div>
              )}
              
              {/* Status for Gatherly events */}
              {selectedEvent.isGatherlyEvent && selectedEvent.status && (
                <div className="event-detail-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {selectedEvent.status === 'confirmed' ? (
                      <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></>
                    ) : (
                      <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>
                    )}
                  </svg>
                  <span className={`event-detail-status ${selectedEvent.status}`}>
                    {selectedEvent.status === 'pending' ? 'Pending' : 
                     selectedEvent.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                  </span>
                </div>
              )}

              {/* Actions for Gatherly events */}
              {selectedEvent.isGatherlyEvent && selectedEvent.status !== 'cancelled' && (
                <div className="event-detail-actions">
                  <button
                    className="event-action-btn view"
                    onClick={() => {
                      setSelectedEvent(null);
                      navigate(`/event/${extractEventId(selectedEvent.id)}`);
                    }}
                  >
                    View
                  </button>
                  <button 
                    className="event-action-btn remind"
                    onClick={handleRemindEvent}
                    disabled={isReminding}
                  >
                    {isReminding ? (
                      <span className="btn-spinner" />
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        Remind
                      </>
                    )}
                  </button>
                  <button 
                    className="event-action-btn cancel"
                    onClick={handleCancelEvent}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <span className="btn-spinner" />
                    ) : (
                      'Cancel'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal?.show && (
        <div className="gatherly-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="gatherly-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="gatherly-modal-actions">
              <button 
                className="gatherly-modal-btn secondary"
                onClick={() => setConfirmModal(null)}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button 
                className={`gatherly-modal-btn ${confirmModal.isDestructive ? 'destructive' : 'primary'}`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal?.show && (
        <div className="gatherly-modal-overlay" onClick={() => setAlertModal(null)}>
          <div className={`gatherly-modal alert-modal ${alertModal.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="alert-icon">
              {alertModal.type === 'success' && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
              )}
              {alertModal.type === 'error' && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              )}
              {alertModal.type === 'info' && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              )}
            </div>
            <h3>{alertModal.title}</h3>
            <p>{alertModal.message}</p>
            <button 
              className="gatherly-modal-btn primary"
              onClick={() => setAlertModal(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
