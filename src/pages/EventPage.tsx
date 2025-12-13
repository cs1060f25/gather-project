import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase, getGoogleToken } from '../lib/supabase';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { getEventInvites, createNotification, type Invite } from '../lib/invites';
import { AvailabilityPicker, type AvailabilityOption } from '../components/AvailabilityPicker';
import '../components/AvailabilityPicker.css';
import './EventPage.css';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isGatherly?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

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

interface GatherlyEvent {
  id: string;
  title: string;
  location?: string;
  description?: string;
  options: { day: string; time: string; duration: number; color: string }[];
  participants: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedOption?: { day: string; time: string; duration: number };
  responses?: { email: string; selectedOptions: number[]; respondedAt: string }[];
  addGoogleMeet?: boolean;
}

interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: { email: string; responseStatus: string }[];
}

export const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const [event, setEvent] = useState<GatherlyEvent | null>(null);
  const [googleEvent, setGoogleEvent] = useState<GoogleEvent | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGatherlyEvent, setIsGatherlyEvent] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  // Edit event state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOptions, setEditOptions] = useState<AvailabilityOption[]>([
    { id: '1', day: '', time: '', duration: 0, color: '#1A1A1A' },
    { id: '2', day: '', time: '', duration: 0, color: '#1A1A1A' },
    { id: '3', day: '', time: '', duration: 0, color: '#1A1A1A' }
  ]);
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editAddGoogleMeet, setEditAddGoogleMeet] = useState(false);
  
  // Email prompt state (same as CreateEventPanel)
  const [emailPromptFor, setEmailPromptFor] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  
  // Location autocomplete state (same as CreateEventPanel)
  const [locationSuggestions, setLocationSuggestions] = useState<{mainText: string; secondaryText?: string; fullAddress: string}[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const user: UserProfile | null = authUser ? {
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
  } : null;

  useEffect(() => {
    loadEvent();
    loadContacts();
  }, [eventId, authUser]);

  // Load user's location from IP on mount (for better location suggestions)
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const response = await fetch('/api/get-location');
        if (response.ok) {
          const data = await response.json();
          if (data.lat && data.lon) {
            setUserCoords({ lat: data.lat, lon: data.lon });
          }
        }
      } catch (err) {
        console.log('Could not load user location from IP');
      }
    };
    loadUserLocation();
  }, []);

  // Location autocomplete - same as CreateEventPanel
  const handleLocationChange = async (value: string) => {
    setEditLocation(value);

    if (value.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Virtual meeting suggestions
    const virtualPlatforms = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Discord', 'Slack Huddle'];
    const lowercaseValue = value.toLowerCase();
    const matchedPlatforms = virtualPlatforms.filter(p => 
      p.toLowerCase().includes(lowercaseValue)
    );

    if (matchedPlatforms.length > 0) {
      setLocationSuggestions(matchedPlatforms.map(p => ({ mainText: p, fullAddress: p })));
      setShowLocationSuggestions(true);
      return;
    }

    // Google Places API
    try {
      let apiUrl = `/api/places-autocomplete?input=${encodeURIComponent(value)}`;
      if (userCoords) {
        apiUrl += `&lat=${userCoords.lat}&lon=${userCoords.lon}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
          const placeSuggestions = data.predictions.slice(0, 5).map((p: any) => ({
            mainText: p.mainText || p.description.split(',')[0],
            secondaryText: p.secondaryText || p.description.split(',').slice(1).join(',').trim(),
            fullAddress: p.description
          }));
          setLocationSuggestions(placeSuggestions);
          setShowLocationSuggestions(true);
          return;
        }
      }
    } catch (error) {
      console.log('Places API call failed');
    }

    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const selectLocation = (loc: { mainText: string; secondaryText?: string; fullAddress: string }) => {
    setEditLocation(loc.fullAddress);
    setShowLocationSuggestions(false);
  };

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
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const loadEvent = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // First try to load from Supabase
    try {
      const { data: supabaseEvent, error } = await supabase
        .from('gatherly_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (!error && supabaseEvent) {
        const gatherlyEvent: GatherlyEvent = {
          id: supabaseEvent.id,
          title: supabaseEvent.title,
          location: supabaseEvent.location || 'TBD',
          description: supabaseEvent.description,
          options: supabaseEvent.options || [],
          participants: supabaseEvent.participants || [],
          status: supabaseEvent.status,
          createdAt: supabaseEvent.created_at,
          confirmedOption: supabaseEvent.confirmed_option,
          responses: supabaseEvent.responses,
          addGoogleMeet: supabaseEvent.add_google_meet || false
        };
        setEvent(gatherlyEvent);
        setIsGatherlyEvent(true);
        
        // Load invites for this event
        const eventInvites = await getEventInvites(eventId);
        setInvites(eventInvites);
        
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error loading from Supabase:', err);
    }

    // Fallback: Check localStorage Gatherly events
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const gatherlyEvents: GatherlyEvent[] = JSON.parse(stored);
      const found = gatherlyEvents.find(e => e.id === eventId);
      if (found) {
        setEvent(found);
        setIsGatherlyEvent(true);
        
        // Load invites for this event
        const eventInvites = await getEventInvites(eventId);
        setInvites(eventInvites);
        
        setLoading(false);
        return;
      }
    }

    // If not found, try Google Calendar (search across all calendars)
    const providerToken = await getGoogleToken();
    if (providerToken) {
      try {
        // First try primary calendar
        let response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        if (response.ok) {
          const data = await response.json();
          setGoogleEvent(data);
          setIsGatherlyEvent(false);
          setLoading(false);
          return;
        }

        // If not found in primary, search other calendars
        const calendarListResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );

        if (calendarListResponse.ok) {
          const calendarList = await calendarListResponse.json();
          
          for (const cal of (calendarList.items || [])) {
            if (cal.id === 'primary') continue; // Already tried primary
            
            try {
              response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events/${eventId}`,
                { headers: { Authorization: `Bearer ${providerToken}` } }
              );

              if (response.ok) {
                const data = await response.json();
                setGoogleEvent(data);
                setIsGatherlyEvent(false);
                setLoading(false);
                return;
              }
            } catch (err) {
              // Continue to next calendar
            }
          }
        }
      } catch (error) {
        console.error('Error loading Google event:', error);
      }
    }

    setLoading(false);
  };

  // Handle opening edit modal
  const openEditModal = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditLocation(event.location || '');
    setEditDescription(event.description || '');
    setEditAddGoogleMeet(event.addGoogleMeet || false);
    // Always ensure exactly 3 time options with id and color (like CreateEventPanel - all black)
    const OPTION_COLORS = ['#1A1A1A', '#1A1A1A', '#1A1A1A'];
    const existingOptions: AvailabilityOption[] = event.options.slice(0, 3).map((o, idx) => ({ 
      id: String(idx + 1), 
      day: o.day, 
      time: o.time, 
      duration: o.duration,
      color: OPTION_COLORS[idx]
    }));
    while (existingOptions.length < 3) {
      const idx = existingOptions.length;
      existingOptions.push({ id: String(idx + 1), day: '', time: '', duration: 60, color: OPTION_COLORS[idx] });
    }
    setEditOptions(existingOptions);
    setEditParticipants([...event.participants]);
    setNewParticipant('');
    setShowEditModal(true);
  };

  // Handle removing a participant - also removes their invite
  const handleRemoveParticipant = async (email: string) => {
    // Remove from edit state
    setEditParticipants(prev => prev.filter(p => p.toLowerCase() !== email.toLowerCase()));
  };

  // Email validation (same as CreateEventPanel)
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle adding a participant (same as CreateEventPanel - prompts for email if name without email)
  const handleAddEditParticipant = (emailOrName: string) => {
    const trimmed = emailOrName.trim();
    if (!trimmed || editParticipants.includes(trimmed.toLowerCase())) return;

    // Check if it matches a contact
    const contact = contacts.find(c => 
      c.name.toLowerCase() === trimmed.toLowerCase() || 
      c.email.toLowerCase() === trimmed.toLowerCase()
    );

    if (contact) {
      // Contact exists, use their email
      const email = contact.email.toLowerCase();
      if (!editParticipants.includes(email)) {
        setEditParticipants([...editParticipants, email]);
      }
      setNewParticipant('');
    } else if (isValidEmail(trimmed)) {
      // It's a valid email, add directly
      if (!editParticipants.includes(trimmed.toLowerCase())) {
        setEditParticipants([...editParticipants, trimmed.toLowerCase()]);
      }
      setNewParticipant('');
    } else {
      // It's a name without email - prompt for email
      setEmailPromptFor(trimmed);
      setPendingEmail('');
    }
  };

  // Handle email prompt submit (same as CreateEventPanel)
  const handleEmailPromptSubmit = () => {
    if (!emailPromptFor || !isValidEmail(pendingEmail)) return;
    
    if (!editParticipants.includes(pendingEmail.toLowerCase())) {
      setEditParticipants([...editParticipants, pendingEmail.toLowerCase()]);
    }
    setEmailPromptFor(null);
    setPendingEmail('');
  };

  // Handle saving event edits
  const handleSaveEdit = async () => {
    if (!event || !authUser) return;
    
    setIsSaving(true);
    try {
      // Check for new and removed participants
      const newParticipants = editParticipants.filter(p => !event.participants.includes(p));
      const removedParticipants = event.participants.filter(p => !editParticipants.includes(p));
      
      // Delete invites for removed participants and send cancellation emails
      if (removedParticipants.length > 0) {
        const hostName = user?.full_name || user?.email?.split('@')[0] || 'The organizer';
        const hostEmail = user?.email || '';
        
        for (const email of removedParticipants) {
          // Delete the invite
          await supabase
            .from('invites')
            .delete()
            .eq('event_id', event.id)
            .eq('invitee_email', email.toLowerCase());
          
          // Send cancellation email to removed participant
          try {
            await fetch('/api/send-cancel-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                eventTitle: event.title,
                hostName,
                hostEmail,
              }),
            });
            console.log(`Cancellation email sent to removed participant: ${email}`);
          } catch (err) {
            console.error(`Error sending cancellation to ${email}:`, err);
          }
        }
        
        // Also update the responses in the event to remove the removed participants
        const updatedResponses = (event.responses || []).filter(
          r => !removedParticipants.includes(r.email.toLowerCase())
        );
        await supabase
          .from('gatherly_events')
          .update({ responses: updatedResponses })
          .eq('id', event.id);
      }
      
      // Build updated options with colors
      const updatedOptions = editOptions.map((opt, idx) => ({
        ...opt,
        color: event.options[idx]?.color || ['#22c55e', '#3b82f6', '#f59e0b'][idx] || '#22c55e'
      }));
      
      // Update gatherly_events table with all fields
      const { error } = await supabase
        .from('gatherly_events')
        .update({
          title: editTitle.trim(),
          location: editLocation.trim() || null,
          description: editDescription.trim() || null,
          options: updatedOptions,
          participants: editParticipants,
          add_google_meet: editAddGoogleMeet,
        })
        .eq('id', event.id);
      
      if (error) throw error;
      
      // Also update invites table so invitees see updated details
      const { error: inviteError } = await supabase
        .from('invites')
        .update({
          event_title: editTitle.trim(),
          event_location: editLocation.trim() || null,
        })
        .eq('event_id', event.id);
      
      if (inviteError) {
        console.error('Error updating invites:', inviteError);
      }
      
      // Send invites to new participants
      if (newParticipants.length > 0) {
        const { createInvites, sendInviteEmails } = await import('../lib/invites');
        const hostName = user?.full_name || user?.email?.split('@')[0] || 'Anonymous';
        const hostEmail = user?.email || '';
        
        const { invites } = await createInvites(
          event.id,
          { title: editTitle.trim(), date: editOptions[0]?.day || '', time: editOptions[0]?.time, location: editLocation.trim() },
          hostName,
          hostEmail,
          newParticipants
        );
        
        if (invites.length > 0) {
          await sendInviteEmails(invites, updatedOptions);
        }
      }
      
      // Update local state
      setEvent({
        ...event,
        title: editTitle.trim(),
        location: editLocation.trim() || undefined,
        description: editDescription.trim() || undefined,
        options: updatedOptions,
        participants: editParticipants,
        addGoogleMeet: editAddGoogleMeet,
      });
      
      // Update invites list if new invites were created
      if (newParticipants.length > 0) {
        const updatedInvites = await getEventInvites(event.id);
        setInvites(updatedInvites);
      }
      
      // Send update notification to existing participants
      const hostName = user?.full_name || user?.email?.split('@')[0] || 'The organizer';
      for (const email of event.participants) {
        try {
          const { data: inviteeProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();
          
          if (inviteeProfile) {
            await createNotification(
              inviteeProfile.id,
              'event_updated',
              `${editTitle.trim()} has been updated`,
              `${hostName} updated the event details`,
              event.id
            );
          }
        } catch (err) {
          console.error(`Error notifying ${email}:`, err);
        }
      }
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!event) return;

    try {
      // Check if event is already cancelled in DB - prevent double emails
      const { data: currentStatus } = await supabase
        .from('gatherly_events')
        .select('status')
        .eq('id', event.id)
        .single();
      
      if (currentStatus?.status === 'cancelled') {
        console.log('[EventPage Cancel] Event already cancelled, skipping emails');
        setShowCancelConfirm(false);
        navigate('/app');
        return;
      }
      
      // Send cancellation emails to all participants
      const hostName = user?.full_name || user?.email?.split('@')[0] || 'The organizer';
      const hostEmail = user?.email || '';
      
      // Send cancellation notification to each participant (deduplicated)
      const uniqueParticipants = [...new Set(event.participants)];
      console.log('[EventPage Cancel] Sending cancellation emails to:', uniqueParticipants);
      const emailPromises = uniqueParticipants.map(async (email) => {
        try {
          console.log('[EventPage Cancel] Sending cancellation email to:', email);
          const response = await fetch('/api/send-cancel-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: email,
              eventTitle: event.title,
              hostName,
              hostEmail,
            }),
          });
          
          if (!response.ok) {
            console.error(`Failed to send cancellation email to ${email}`);
          } else {
            console.log(`Cancellation notification sent to ${email}`);
          }
        } catch (err) {
          console.error(`Error sending cancellation to ${email}:`, err);
        }
      });
      
      // Wait for all emails to be sent
      await Promise.all(emailPromises);
      
      // If event was confirmed, try to delete from Google Calendar
      if (event.status === 'confirmed') {
        const providerToken = await getGoogleToken();
        if (providerToken) {
          try {
            // First get the Google event ID from the database
            const { data: eventData } = await supabase
              .from('gatherly_events')
              .select('google_event_id')
              .eq('id', event.id)
              .single();
            
            if (eventData?.google_event_id) {
              // Delete from Google Calendar
              const deleteResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.google_event_id}?sendUpdates=all`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${providerToken}` }
                }
              );
              
              if (deleteResponse.ok || deleteResponse.status === 204) {
                console.log('Google Calendar event deleted successfully');
              } else {
                console.error('Failed to delete from Google Calendar:', deleteResponse.status);
              }
            }
          } catch (gcalErr) {
            console.error('Error deleting from Google Calendar:', gcalErr);
          }
        }
      }
      
      // Update status to cancelled in Supabase (instead of deleting)
      const { error } = await supabase
        .from('gatherly_events')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', event.id);
      
      if (error) {
        console.error('Error cancelling event in Supabase:', error);
        // If update fails, try delete as fallback
        await supabase.from('gatherly_events').delete().eq('id', event.id);
      }
    } catch (err) {
      console.error('Error cancelling event:', err);
    }

    // Also update localStorage
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const events: GatherlyEvent[] = JSON.parse(stored);
      const updated = events.map(e => 
        e.id === event.id ? { ...e, status: 'cancelled' as const } : e
      );
      localStorage.setItem('gatherly_created_events', JSON.stringify(updated));
    }

    // Navigate back to events page
    setShowCancelConfirm(false);
    navigate('/events');
  };

  const handleConfirmTime = async () => {
    if (!event || selectedOption === null) return;

    setIsConfirming(true);
    const confirmedOption = event.options[selectedOption];
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('gatherly_events')
        .update({ 
          status: 'confirmed', 
          confirmed_option: confirmedOption,
          updated_at: new Date().toISOString() 
        })
        .eq('id', event.id);
      
      if (error) {
        console.error('Error confirming event in Supabase:', error);
      }
      
      // Try to create Google Calendar event for the organizer
      const providerToken = await getGoogleToken();
      console.log('Google token available:', !!providerToken);
      if (providerToken && confirmedOption) {
        try {
          const startDate = new Date(`${confirmedOption.day}T${confirmedOption.time}`);
          const endDate = new Date(startDate.getTime() + (confirmedOption.duration || 60) * 60000);
          
          // Build the calendar event with all details
          // Add Gatherly marker to description so we can identify it later
          const gatherlyMarker = '\n\n[Scheduled with Gatherly]';
          const descriptionWithMarker = event.description 
            ? event.description + gatherlyMarker 
            : gatherlyMarker.trim();
          
          // Get organizer email for proper attribution
          const organizerEmail = user?.email || authUser?.email || '';
          const organizerName = user?.full_name || authUser?.user_metadata?.full_name || '';
          
          const calendarEvent: {
            summary: string;
            description: string;
            location?: string;
            start: { dateTime: string; timeZone: string };
            end: { dateTime: string; timeZone: string };
            attendees: { email: string }[];
            conferenceData?: {
              createRequest: {
                requestId: string;
                conferenceSolutionKey: { type: string };
              };
            };
            guestsCanModify?: boolean;
            guestsCanInviteOthers?: boolean;
          } = {
            summary: event.title,
            description: descriptionWithMarker,
            start: {
              dateTime: startDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            // Only add participants as attendees - NOT the organizer
            // The authenticated user is automatically the organizer via the API
            // Adding organizer to attendees causes "unknown sender" warnings
            attendees: event.participants
              .filter(email => email.toLowerCase() !== organizerEmail.toLowerCase()) // Exclude organizer
              .map(email => ({ email })),
            guestsCanModify: false,
            guestsCanInviteOthers: false
          };
          
          // Add location if it exists
          if (event.location && event.location !== 'TBD') {
            calendarEvent.location = event.location;
          }
          
          // Add Google Meet if requested
          if (event.addGoogleMeet) {
            calendarEvent.conferenceData = {
              createRequest: {
                requestId: `gatherly-${event.id}-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            };
          }
          
          console.log('Creating Google Calendar event:', calendarEvent);
          
          // Add conferenceDataVersion=1 to enable Google Meet creation
          const apiUrl = event.addGoogleMeet 
            ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1'
            : 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all';
          
          const response = await fetch(
            apiUrl,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(calendarEvent)
            }
          );
          
          if (response.ok) {
            const createdEvent = await response.json();
            console.log('Google Calendar event created successfully:', createdEvent.id);
            
            // Create notifications for all participants
            for (const participantEmail of event.participants) {
              // Find participant's user ID from profiles table
              const { data: participantProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', participantEmail.toLowerCase())
                .single();
              
              if (participantProfile?.id) {
                const dateStr = confirmedOption.day;
                const timeStr = confirmedOption.time;
                const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                const formattedTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                });
                
                await createNotification(
                  participantProfile.id,
                  'event_scheduled',
                  `${event.title} has been scheduled`,
                  `${formattedDate} at ${formattedTime}`,
                  event.id
                );
              }
              
              // Send Gatherly scheduled email notification to this participant
              try {
                await fetch('/api/send-scheduled-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: participantEmail,
                    eventTitle: event.title,
                    hostName: organizerName || organizerEmail,
                    hostEmail: organizerEmail,
                    scheduledDate: confirmedOption.day,
                    scheduledTime: confirmedOption.time,
                    duration: confirmedOption.duration || 60,
                    location: event.location,
                    meetLink: createdEvent.hangoutLink || null
                  })
                });
              } catch (emailErr) {
                console.error(`Error sending scheduled email to ${participantEmail}:`, emailErr);
              }
            }
            
            // Update the Gatherly event status to 'confirmed' and save Google Calendar event ID
            await supabase
              .from('gatherly_events')
              .update({ 
                status: 'confirmed', 
                confirmed_option: confirmedOption,
                google_event_id: createdEvent.id
              })
              .eq('id', event.id);
            
            // Update localStorage
            const storedEvents = localStorage.getItem('gatherly_created_events');
            if (storedEvents) {
              const events: GatherlyEvent[] = JSON.parse(storedEvents);
              const updated = events.map(e => 
                e.id === event.id 
                  ? { ...e, status: 'confirmed' as const, confirmedOption } 
                  : e
              );
              localStorage.setItem('gatherly_created_events', JSON.stringify(updated));
            }
            
            // Navigate back to events page
            navigate('/events');
            return;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to create Google Calendar event:', response.status, errorData);
            // If it's a scope/permission error, show a helpful message
            if (response.status === 403 || response.status === 401) {
              alert('Unable to create calendar event. Please try signing out and signing back in to refresh permissions.');
            }
          }
        } catch (gcalError) {
          console.error('Error creating Google Calendar event:', gcalError);
        }
      }
    } catch (err) {
      console.error('Error confirming event:', err);
    }
    
    // Fallback: Update localStorage if GCal creation failed
    const stored = localStorage.getItem('gatherly_created_events');
    if (stored) {
      const events: GatherlyEvent[] = JSON.parse(stored);
      const updated = events.map(e => 
        e.id === event.id ? { ...e, status: 'confirmed' as const, confirmedOption } : e
      );
      localStorage.setItem('gatherly_created_events', JSON.stringify(updated));
    }

    setEvent({ ...event, status: 'confirmed', confirmedOption });
    setIsConfirming(false);
  };

  // Send reminder to specific invitee(s)
  const sendReminder = async (emails: string[]) => {
    if (!event || emails.length === 0) return;
    
    setSendingReminders(true);
    setReminderSuccess(null);
    
    const hostName = user?.full_name || user?.email?.split('@')[0] || 'The organizer';
    const hostEmail = user?.email || '';
    
    const reminderType = event.status === 'pending' ? 'pending' : 'scheduled';
    
    let successCount = 0;
    
    for (const email of emails) {
      try {
        // Find invite token for this email (for pending events)
        const invite = invites.find(i => i.invitee_email.toLowerCase() === email.toLowerCase());
        
        const response = await fetch('/api/send-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            eventTitle: event.title,
            hostName,
            hostEmail,
            reminderType,
            inviteToken: invite?.token,
            scheduledDate: event.confirmedOption?.day,
            scheduledTime: event.confirmedOption?.time,
            location: event.location
          }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          console.error(`Failed to send reminder to ${email}`);
        }
      } catch (err) {
        console.error(`Error sending reminder to ${email}:`, err);
      }
    }
    
    setSendingReminders(false);
    setShowReminderModal(false);
    
    if (successCount > 0) {
      setReminderSuccess(`Reminder sent to ${successCount} participant${successCount > 1 ? 's' : ''}`);
      setTimeout(() => setReminderSuccess(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="event-loading">
          <div className="loading-spinner"></div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event && !googleEvent) {
    return (
      <div className="event-page">
        <div className="event-not-found">
          <h1>Event Not Found</h1>
          <p>This event doesn't exist or has been deleted.</p>
          <Link to="/events" className="btn-back">Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="event-page">
      {/* Header */}
      <header className="event-header">
        <div className="header-left">
          <button 
            className="event-back-btn"
            onClick={() => navigate('/app')}
            aria-label="Back to Calendar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <Link to="/app" className="event-logo">
            <GatherlyLogo size={28} />
            <span>Gatherly</span>
          </Link>
        </div>
        <div className="header-center">
          <h1>Event</h1>
        </div>
        <div className="header-right">
          {isGatherlyEvent && event?.status !== 'cancelled' && (
            <>
              <button 
                className="remind-btn"
                onClick={() => setShowReminderModal(true)}
                title="Send reminder to invitees"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Remind
              </button>
            <button 
              className="cancel-btn"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Event
            </button>
            </>
          )}
          <button 
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
            title="Profile"
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Profile" 
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
      <main className="event-main">
        {isGatherlyEvent && event ? (
          // Gatherly Event View
          <div className="event-content">
            <div className={`event-status-banner ${event.status}${event.status === 'pending' && invites.filter(i => i.status !== 'pending').length === event.participants.length ? ' ready' : ''}`}>
              {event.status === 'pending' && (
                invites.filter(i => i.status !== 'pending').length === event.participants.length
                  ? 'All responses in - Ready to confirm!'
                  : `Waiting for responses (${invites.filter(i => i.status !== 'pending').length}/${event.participants.length})`
              )}
              {event.status === 'confirmed' && 'Event confirmed'}
              {event.status === 'cancelled' && 'Event cancelled'}
            </div>

            <div className="event-nav">
              <Link to="/events" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back to Events
              </Link>
            </div>

            <div className="event-title-section">
              <div className="title-row">
              <h2>{event.title}</h2>
                {event.status === 'pending' && (
                  <button 
                    className="edit-event-btn" 
                    onClick={openEditModal}
                    title="Edit event details"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
              <span className="gatherly-tag">Gatherly Event</span>
            </div>

            {/* Location */}
            {event.location && event.location !== 'TBD' && (
              <div className="event-location-display">
                <span className="location-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <span>{event.location}</span>
              </div>
            )}

            {/* Time Options */}
            <div className="event-section">
              <h3>Schedule Event</h3>
              <div className="time-options">
                {event.options.map((opt, idx) => (
                  <button
                    key={idx}
                    className={`time-option ${selectedOption === idx ? 'selected' : ''} ${event.status === 'confirmed' && event.confirmedOption?.day === opt.day && event.confirmedOption?.time === opt.time ? 'confirmed' : ''}`}
                    style={{ '--option-color': opt.color } as React.CSSProperties}
                    onClick={() => event.status === 'pending' && setSelectedOption(idx)}
                    disabled={event.status !== 'pending'}
                  >
                    <span className="option-date">{formatDate(opt.day)}</span>
                    <span className="option-time">{formatTime(opt.time)}</span>
                    <span className="option-duration">{formatDuration(opt.duration)}</span>
                  </button>
                ))}
              </div>

              {event.status === 'pending' && (
                <button 
                  className="confirm-btn"
                  onClick={handleConfirmTime}
                  disabled={selectedOption === null || isConfirming}
                >
                  {isConfirming ? 'Confirming...' : 'Confirm Selected Time'}
                </button>
              )}
            </div>

            {/* Responses */}
            <div className="event-section">
              <h3>Responses ({invites.filter(i => i.status !== 'pending').length}/{event.participants.length})</h3>
              <div className="responses-list">
                {event.participants.map(email => {
                  const invite = invites.find(i => i.invitee_email.toLowerCase() === email.toLowerCase());
                  const status = invite?.status || 'pending';
                  const suggestedTimes = invite?.suggested_times || [];
                  
                  // Get per-option responses if available
                  const optionResponses = (invite as any)?.option_responses as Record<string, 'yes' | 'maybe' | 'no'> | undefined;
                  
                  return (
                    <div key={email} className="response-item-card">
                      <div className="response-item-header">
                      <div className={`response-avatar ${status}`}>
                        {email[0].toUpperCase()}
                      </div>
                        <div className="response-header-info">
                        <span className="response-email">{email}</span>
                          <span className={`response-status-badge ${status}`}>
                            {status === 'accepted' && 'Responded'}
                            {status === 'declined' && 'Declined All'}
                            {status === 'maybe' && 'Responded'}
                          {status === 'pending' && 'Waiting...'}
                        </span>
                        </div>
                        {invite?.responded_at && (
                          <span className="response-date">
                            {new Date(invite.responded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Show detailed per-option responses */}
                      {status !== 'pending' && (
                        <div className="response-options-grid">
                          {event.options.map((opt, idx) => {
                            // Check option_responses first, fall back to suggestedTimes
                            let optResponse: 'yes' | 'maybe' | 'no' | undefined;
                            if (optionResponses && optionResponses[idx.toString()]) {
                              optResponse = optionResponses[idx.toString()];
                            } else if (suggestedTimes.length > 0) {
                              const isSelected = suggestedTimes.some(t => t.includes(opt.day) && t.includes(opt.time));
                              optResponse = isSelected ? (status === 'maybe' ? 'maybe' : 'yes') : 'no';
                            } else if (status === 'declined') {
                              optResponse = 'no';
                            }
                            
                            if (!optResponse) optResponse = 'no';
                            
                            // Format the date/time for display
                            const optDate = new Date(opt.day + 'T00:00:00');
                            const dayStr = optDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            const timeStr = formatTime(opt.time);
                            
                              return (
                              <div 
                                  key={idx} 
                                className={`response-option-row ${optResponse}`}
                              >
                                <span className="option-label">Option {idx + 1}</span>
                                <span className="option-datetime">{dayStr} • {timeStr}</span>
                                <span className={`option-answer ${optResponse}`}>
                                  {optResponse === 'yes' && (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> Yes</>
                                  )}
                                  {optResponse === 'maybe' && (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Maybe</>
                                  )}
                                  {optResponse === 'no' && (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg> No</>
                                  )}
                                </span>
                              </div>
                              );
                            })}
                          </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : googleEvent ? (
          // Google Calendar Event View
          <div className="event-content google-event">
            <div className="event-nav">
              <Link to="/events" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back to Events
              </Link>
            </div>

            <div className="event-title-section">
              <h2>{googleEvent.summary}</h2>
              <span className="google-tag">Google Calendar</span>
            </div>

            <div className="event-details">
              <div className="detail-item">
                <span className="detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <span>{formatDate(googleEvent.start.dateTime?.split('T')[0] || googleEvent.start.date || '')}</span>
              </div>
              {googleEvent.start.dateTime && (
                <div className="detail-item">
                  <span className="detail-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </span>
                  <span>{formatTime(googleEvent.start.dateTime.split('T')[1].slice(0, 5))}</span>
                </div>
              )}
              {googleEvent.location && (
                <div className="detail-item">
                  <span className="detail-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span>{googleEvent.location}</span>
                </div>
              )}
            </div>

            {googleEvent.description && (
              <div className="event-description">
                <h3>Description</h3>
                <p>{googleEvent.description}</p>
              </div>
            )}

            {googleEvent.attendees && googleEvent.attendees.length > 0 && (
              <div className="event-section">
                <h3>Attendees</h3>
                <div className="attendees-list">
                  {googleEvent.attendees.map(attendee => (
                    <div key={attendee.email} className="attendee-item">
                      <div className="attendee-avatar">
                        {attendee.email[0].toUpperCase()}
                      </div>
                      <span className="attendee-email">{attendee.email}</span>
                      <span className={`attendee-status ${attendee.responseStatus}`}>
                        {attendee.responseStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Reminder Success Toast */}
      {reminderSuccess && (
        <div className="reminder-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {reminderSuccess}
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && event && (
        <div className="modal-overlay">
          <div className="modal reminder-modal">
            <h3>Send Reminder</h3>
            <p>
              {event.status === 'pending' 
                ? 'Remind invitees to pick their available times.'
                : 'Remind participants about this upcoming event.'}
            </p>
            
            <div className="reminder-options">
              <button 
                className="btn-primary"
                onClick={() => sendReminder(event.participants)}
                disabled={sendingReminders}
              >
                {sendingReminders ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Remind All ({event.participants.length})
                  </>
                )}
              </button>
              
              {event.status === 'pending' && (
                <div className="reminder-individual">
                  <p className="reminder-subtitle">Or remind specific invitees who haven't responded:</p>
                  <div className="reminder-invitee-list">
                    {event.participants.map(email => {
                      const invite = invites.find(i => i.invitee_email.toLowerCase() === email.toLowerCase());
                      const hasResponded = invite?.status !== 'pending';
                      
                      return (
                        <div key={email} className={`reminder-invitee ${hasResponded ? 'responded' : ''}`}>
                          <span className="invitee-email">{email}</span>
                          <span className={`invitee-status ${hasResponded ? 'responded' : 'pending'}`}>
                            {hasResponded ? 'Responded' : 'Pending'}
                          </span>
                          {!hasResponded && (
                            <button 
                              className="remind-individual-btn"
                              onClick={() => sendReminder([email])}
                              disabled={sendingReminders}
                            >
                              Remind
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowReminderModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cancel Event?</h3>
            <p>Are you sure you want to cancel "{event?.title}"? This will notify all invited participants.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                Keep Event
              </button>
              <button className="btn-danger" onClick={handleCancel}>
                Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && event && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowEditModal(false)}>
          <div className="edit-event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Event</h3>
              <button 
                className="modal-close" 
                onClick={() => !isSaving && setShowEditModal(false)}
                disabled={isSaving}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="edit-title">Event Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Enter event title"
                  disabled={isSaving}
                />
              </div>
              
              <div className="form-group location-field">
                <label htmlFor="edit-location">Location</label>
                <div className="location-autocomplete-wrapper">
                  <input
                    id="edit-location"
                    type="text"
                    value={editLocation}
                    onChange={e => handleLocationChange(e.target.value)}
                    onFocus={() => editLocation.length >= 2 && setShowLocationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    placeholder="Office, Zoom, Coffee shop..."
                    disabled={isSaving}
                    autoComplete="off"
                  />
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="location-suggestions">
                      {locationSuggestions.map((loc, idx) => {
                        const isVirtual = loc.mainText.includes('Meet') || loc.mainText.includes('Zoom') || 
                                          loc.mainText.includes('Teams') || loc.mainText.includes('Discord') || 
                                          loc.mainText.includes('Slack');
                        return (
                          <button
                            key={idx}
                            type="button"
                            className="location-suggestion"
                            onMouseDown={() => selectLocation(loc)}
                          >
                            <span className="location-icon">
                              {isVirtual ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="6" width="14" height="12" rx="2"/>
                                  <path d="M16 10l6-4v12l-6-4"/>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                              )}
                            </span>
                            <span className="location-text">
                              <span className="location-main">{loc.mainText}</span>
                              {loc.secondaryText && <span className="location-secondary">{loc.secondaryText}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Google Meet Toggle - same as CreateEventPanel */}
                <label className="edit-meet-toggle">
                  <input
                    type="checkbox"
                    checked={editAddGoogleMeet}
                    onChange={(e) => setEditAddGoogleMeet(e.target.checked)}
                    disabled={isSaving}
                  />
                  <span className="edit-meet-toggle-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M15 10l5-5m0 0v4m0-4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="3" y="7" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M15 12l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span className="edit-meet-toggle-text">Add Google Meet</span>
                </label>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              
              {/* Availability Options (for pending events) - Uses shared AvailabilityPicker */}
              {event.status === 'pending' && (
                <div className="form-group">
                  <AvailabilityPicker
                    options={editOptions}
                    onChange={setEditOptions}
                    disabled={isSaving}
                    showLabel={true}
                    labelText="Availability"
                  />
                </div>
              )}
              
              {/* Participants - styled exactly like CreateEventPanel */}
              {event.status === 'pending' && (
                <div className="form-group edit-people-field">
                  <label>Who Do You Want to Invite?</label>
                  <div className="edit-people-input-row">
                    <input
                      type="text"
                      value={newParticipant}
                      onChange={e => setNewParticipant(e.target.value)}
                      placeholder="Name or email..."
                      disabled={isSaving}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newParticipant.trim()) {
                          e.preventDefault();
                          handleAddEditParticipant(newParticipant);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="edit-add-btn"
                      onClick={() => handleAddEditParticipant(newParticipant)}
                      disabled={isSaving || !newParticipant.trim()}
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Selected participants - chips like CreateEventPanel */}
                  {editParticipants.length > 0 && (
                    <div className="edit-participants-list">
                      {editParticipants.map((email, idx) => {
                        const contact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
                        const displayName = contact?.name || email;
                        return (
                          <div key={idx} className="edit-participant-chip">
                            <span>{displayName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(email)}
                              disabled={isSaving}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Contact suggestions dropdown - styled like CreateEventPanel */}
                  {newParticipant.length >= 1 && (
                    <div className="edit-suggestions">
                      {contacts
                        .filter(c => 
                          (c.name.toLowerCase().includes(newParticipant.toLowerCase()) ||
                           c.email.toLowerCase().includes(newParticipant.toLowerCase())) &&
                          !editParticipants.includes(c.email.toLowerCase()) &&
                          c.email.toLowerCase() !== user?.email?.toLowerCase()
                        )
                        .slice(0, 5)
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className="edit-suggestion"
                            onClick={() => {
                              if (!editParticipants.includes(c.email.toLowerCase())) {
                                setEditParticipants([...editParticipants, c.email.toLowerCase()]);
                              }
                              setNewParticipant('');
                            }}
                          >
                            <div className="edit-suggestion-avatar">
                              {c.name[0].toUpperCase()}
                            </div>
                            <div className="edit-suggestion-info">
                              <span className="edit-suggestion-name">{c.name}</span>
                              <span className="edit-suggestion-email">{c.email}</span>
                            </div>
                            {c.isGatherly && (
                              <span className="edit-gatherly-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                              </span>
                            )}
                          </button>
                        ))
                      }
                    </div>
                  )}
                  
                  {/* Email prompt modal - same as CreateEventPanel */}
                  {emailPromptFor && (
                    <div className="edit-email-prompt">
                      <p>Enter email for <strong>{emailPromptFor}</strong>:</p>
                      <div className="edit-email-prompt-row">
                        <input
                          type="email"
                          value={pendingEmail}
                          onChange={e => setPendingEmail(e.target.value)}
                          placeholder="email@example.com"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleEmailPromptSubmit();
                            } else if (e.key === 'Escape') {
                              setEmailPromptFor(null);
                            }
                          }}
                        />
                        <button type="button" onClick={handleEmailPromptSubmit}>Add</button>
                        <button type="button" onClick={() => setEmailPromptFor(null)} className="edit-cancel-email">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSaveEdit}
                disabled={isSaving || !editTitle.trim()}
              >
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showProfile}
        user={user}
        contacts={contacts}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        onAddContact={async () => {}}
        onRemoveContact={async () => {}}
        onImportContacts={async () => {}}
      />
    </div>
  );
};

export default EventPage;

