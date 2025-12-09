import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './CreateEventPanel.css';

interface Contact {
  id: string;
  name: string;
  email: string;
  isGatherly?: boolean;
}

export interface AvailabilityOption {
  id: string;
  day: string;
  time: string;
  duration: number;
  color: string;
}

export interface CreateEventData {
  eventName: string;
  description: string;
  location: string;
  participants: string[];
  availabilityOptions: AvailabilityOption[];
}

interface CreateEventPanelProps {
  contacts: Contact[];
  currentUserEmail?: string;
  currentUserName?: string;
  onSubmit: (data: CreateEventData) => void;
  onFieldChange?: (data: Partial<CreateEventData>) => void;
  onEditingModeChange?: (editing: boolean) => void;
  suggestedData?: Partial<CreateEventData>;
  isLoading?: boolean;
  events?: any[]; // Calendar events for finding free times
}

// Use subtle indicator colors that match the calendar option badges
const OPTION_COLORS = ['#1A1A1A', '#1A1A1A', '#1A1A1A']; // All black for clean look

// Helper to format date as YYYY-MM-DD in local timezone (not UTC)
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Duration options - includes blank default (shown as "Span" in UI)
const DURATION_OPTIONS = [
  { value: 0, label: 'Span' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];

// SVG Icons as components
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const TimerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2 2"/>
    <path d="M5 3L2 6"/>
    <path d="M22 6l-3-3"/>
    <path d="M12 2v3"/>
  </svg>
);

// Location Icons
const LocationPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="2"/>
    <path d="M16 10l6-4v12l-6-4"/>
  </svg>
);

const PLACEHOLDER_SUGGESTIONS = [
  "Lunch with team Thursday...",
  "Coffee tomorrow at 2pm...",
  "Standup Monday 9am...",
  "Dinner Saturday 7pm...",
  "Sync with @John Friday...",
  "Meeting at Dunster 3pm..."
];

// Custom Picker Types
type PickerType = 'date' | 'time' | 'duration' | null;
interface ActivePicker {
  type: PickerType;
  optionId: string;
}

export const CreateEventPanel: React.FC<CreateEventPanelProps> = ({
  contacts,
  currentUserEmail,
  currentUserName,
  onSubmit,
  onFieldChange,
  onEditingModeChange,
  suggestedData,
  isLoading = false,
  events = []
}) => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<{mainText: string; secondaryText?: string; fullAddress: string}[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Start with completely blank availability options - AI will populate them intelligently
  const [availabilityOptions, setAvailabilityOptions] = useState<AvailabilityOption[]>([
    { id: '1', day: '', time: '', duration: 0, color: OPTION_COLORS[0] },
    { id: '2', day: '', time: '', duration: 0, color: OPTION_COLORS[1] },
    { id: '3', day: '', time: '', duration: 0, color: OPTION_COLORS[2] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  
  // Custom picker state
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  
  // User location from IP (for better location suggestions)
  const [userLocation, setUserLocation] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Load user's location from IP on mount
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const response = await fetch('/api/get-location');
        if (response.ok) {
          const data = await response.json();
          setUserLocation(data.locationString || '');
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

  // Close picker when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePicker(null);
      }
    };

    if (activePicker) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [activePicker]);

  // Handle clicking on overlay backdrop (not the card content)
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setActivePicker(null);
    }
  };

  // Helper to format time from hour/minute/period
  const formatTimeValue = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
    let h = hour;
    if (period === 'PM' && hour !== 12) h += 12;
    if (period === 'AM' && hour === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Helper to parse time string to hour/minute/period
  const parseTimeValue = (time: string) => {
    if (!time) return { hour: 9, minute: 0, period: 'AM' as const };
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' as const : 'AM' as const;
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { hour, minute: m, period };
  };

  // Open date picker
  const openDatePicker = (optionId: string, currentValue: string) => {
    if (currentValue) {
      setPickerMonth(new Date(currentValue + 'T00:00:00'));
    } else {
      setPickerMonth(new Date());
    }
    setActivePicker({ type: 'date', optionId });
    setIsEditing(true);
  };

  // Open time picker
  const openTimePicker = (optionId: string, currentValue: string) => {
    const { hour, minute, period } = parseTimeValue(currentValue);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    setActivePicker({ type: 'time', optionId });
    setIsEditing(true);
  };

  // Open duration picker
  const openDurationPicker = (optionId: string) => {
    setActivePicker({ type: 'duration', optionId });
    setIsEditing(true);
  };

  // Select date from calendar
  const selectDate = (date: Date) => {
    if (!activePicker) return;
    const dateStr = formatLocalDate(date);
    handleOptionChange(activePicker.optionId, 'day', dateStr);
    setActivePicker(null);
  };

  // Confirm time selection
  const confirmTime = () => {
    if (!activePicker) return;
    const timeStr = formatTimeValue(selectedHour, selectedMinute, selectedPeriod);
    
    // Check if the selected date is today and time is in the past
    const currentOption = availabilityOptions.find(opt => opt.id === activePicker.optionId);
    if (currentOption?.day) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      if (currentOption.day === todayStr) {
        // Parse the selected time
        let hour24 = selectedHour;
        if (selectedPeriod === 'PM' && selectedHour !== 12) hour24 += 12;
        if (selectedPeriod === 'AM' && selectedHour === 12) hour24 = 0;
        
        const selectedTimeMinutes = hour24 * 60 + selectedMinute;
        const currentTimeMinutes = today.getHours() * 60 + today.getMinutes();
        
        if (selectedTimeMinutes <= currentTimeMinutes) {
          alert('Cannot select a time that has already passed today. Please choose a future time.');
          return;
        }
      }
    }
    
    handleOptionChange(activePicker.optionId, 'time', timeStr);
    setActivePicker(null);
  };

  // Select duration
  const selectDuration = (duration: number) => {
    if (!activePicker) return;
    handleOptionChange(activePicker.optionId, 'duration', duration);
    setActivePicker(null);
  };

  // Generate calendar days for a month
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];
    
    // Add empty cells for padding
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIdx, d));
    }
    
    return days;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Format display for selected date
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Date';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  // Format display for selected time
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return 'Time';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format display for duration (shown as "Span" in UI)
  const formatDurationDisplay = (duration: number) => {
    if (!duration) return 'Span';
    const opt = DURATION_OPTIONS.find(d => d.value === duration);
    return opt?.label || 'Span';
  };

  // Handle click outside to exit editing mode
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node) && isEditing) {
      // Don't reset if there's content
      if (!eventName && !location && participants.length === 0) {
        setIsEditing(false);
      }
    }
  }, [isEditing, eventName, location, participants]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Cycle through placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Apply suggested data from AI parsing
  useEffect(() => {
    if (suggestedData) {
      if (suggestedData.eventName) setEventName(suggestedData.eventName);
      if (suggestedData.description) setDescription(suggestedData.description);
      if (suggestedData.location) setLocation(suggestedData.location);
      if (suggestedData.participants) setParticipants(suggestedData.participants);
      if (suggestedData.availabilityOptions) setAvailabilityOptions(suggestedData.availabilityOptions);
    }
  }, [suggestedData]);

  // Notify parent of editing mode changes
  useEffect(() => {
    onEditingModeChange?.(isEditing);
  }, [isEditing, onEditingModeChange]);

  // Notify parent of field changes for calendar preview
  useEffect(() => {
    if (isEditing) {
      onFieldChange?.({
        eventName,
        description,
        location,
        participants,
        availabilityOptions
      });
    }
  }, [eventName, description, location, participants, availabilityOptions, isEditing, onFieldChange]);

  // Location autocomplete - virtual meeting platforms and Google Places API
  const handleLocationChange = async (value: string) => {
    setLocation(value);
    setIsEditing(true);

    if (value.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Virtual meeting suggestions - check first
    const virtualPlatforms = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Discord', 'Slack Huddle'];
    const lowercaseValue = value.toLowerCase();
    const matchedPlatforms = virtualPlatforms.filter(p => 
      p.toLowerCase().includes(lowercaseValue)
    );

    // If it looks like a virtual platform query, show those first
    if (matchedPlatforms.length > 0) {
      setLocationSuggestions(matchedPlatforms.map(p => ({ mainText: p, fullAddress: p })));
      setShowLocationSuggestions(true);
      return;
    }

    // Otherwise, try Google Places API via serverless function
    try {
      // Build URL with location bias if we have user coordinates
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
      console.log('Places API call failed, using fallback');
    }

    // Fallback - no suggestions if API fails (don't suggest invalid locations)
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const selectLocation = (loc: { mainText: string; secondaryText?: string; fullAddress: string }) => {
    setLocation(loc.fullAddress);
    setShowLocationSuggestions(false);
  };

  // Filter contact suggestions
  const filteredContacts = useMemo(() => {
    if (!participantInput.trim()) return contacts.slice(0, 6);
    const query = participantInput.toLowerCase();
    return contacts
      .filter(c => 
        (c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)) &&
        !participants.includes(c.email)
      )
      .slice(0, 6);
  }, [contacts, participantInput, participants]);

  const [emailPromptFor, setEmailPromptFor] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  // Recently interacted people (from localStorage)
  const [recentPeople, setRecentPeople] = useState<{email: string; name?: string}[]>([]);
  
  // Load recent people from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gatherly_recent_people');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentPeople(parsed.slice(0, 5)); // Keep only 5 most recent
        }
      }
    } catch (e) {
      console.error('Error loading recent people:', e);
    }
  }, []);

  // Save recent people when participants change on successful submit
  const saveRecentPeople = (emails: string[]) => {
    try {
      const stored = localStorage.getItem('gatherly_recent_people');
      let existing: {email: string; name?: string}[] = [];
      if (stored) {
        existing = JSON.parse(stored) || [];
      }
      
      // Add new emails to the front, removing duplicates
      const newRecent = emails.map(email => {
        // Try to find name from contacts
        const contact = contacts.find(c => c.email === email);
        return { email, name: contact?.name };
      });
      
      const merged = [...newRecent, ...existing.filter(e => !emails.includes(e.email))];
      const trimmed = merged.slice(0, 10); // Keep 10 max
      
      localStorage.setItem('gatherly_recent_people', JSON.stringify(trimmed));
      setRecentPeople(trimmed.slice(0, 5));
    } catch (e) {
      console.error('Error saving recent people:', e);
    }
  };

  // Email validation regex - standard format check
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddParticipant = (emailOrName: string) => {
    const trimmed = emailOrName.trim();
    if (!trimmed || participants.includes(trimmed)) return;

    // Check if it matches a contact
    const contact = contacts.find(c => 
      c.name.toLowerCase() === trimmed.toLowerCase() || 
      c.email.toLowerCase() === trimmed.toLowerCase()
    );

    if (contact) {
      // Contact exists, use their email
      const email = contact.email;
      if (!participants.includes(email)) {
        setParticipants([...participants, email]);
      }
      setParticipantInput('');
      setShowSuggestions(false);
      setIsEditing(true);
    } else if (isValidEmail(trimmed)) {
      // It's a valid email, add directly
      if (!participants.includes(trimmed)) {
        setParticipants([...participants, trimmed]);
      }
      setParticipantInput('');
      setShowSuggestions(false);
      setIsEditing(true);
    } else {
      // It's a name without email - prompt for email
      setEmailPromptFor(trimmed);
      setPendingEmail('');
      setParticipantInput('');
      setShowSuggestions(false);
    }
  };

  const handleEmailPromptSubmit = () => {
    if (!emailPromptFor || !isValidEmail(pendingEmail)) return;
    
    if (!participants.includes(pendingEmail)) {
      setParticipants([...participants, pendingEmail]);
    }
    setEmailPromptFor(null);
    setPendingEmail('');
    setIsEditing(true);
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleOptionChange = (id: string, field: keyof AvailabilityOption, value: string | number) => {
    setAvailabilityOptions(prev => 
      prev.map(opt => opt.id === id ? { ...opt, [field]: value } : opt)
    );
    setIsEditing(true);
  };

  // Check if form is complete (all required fields filled)
  const isFormComplete = useMemo(() => {
    // Check event name
    if (!eventName.trim()) return false;

    // Check that at least one invitee is added (besides the organizer/current user)
    // Participants includes current user as organizer, so we need at least 2
    const inviteeCount = currentUserEmail 
      ? participants.filter(p => p !== currentUserEmail).length 
      : participants.length;
    if (inviteeCount === 0) return false;

    // Check that all 3 availability options are fully filled
    for (const opt of availabilityOptions) {
      if (!opt.day || !opt.time || !opt.duration) {
        return false;
      }
    }

    return true;
  }, [eventName, participants, currentUserEmail, availabilityOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;

    // Use TBD if no location specified
    const finalLocation = location.trim() || 'TBD';

    // Save participants to recent people before submitting
    if (participants.length > 0) {
      saveRecentPeople(participants);
    }

    onSubmit({
      eventName,
      description,
      location: finalLocation,
      participants,
      availabilityOptions
    });

    // Reset form to blank state
    setEventName('');
    setDescription('');
    setLocation('');
    setParticipants([]);
    setAvailabilityOptions([
      { id: '1', day: '', time: '', duration: 0, color: OPTION_COLORS[0] },
      { id: '2', day: '', time: '', duration: 0, color: OPTION_COLORS[1] },
      { id: '3', day: '', time: '', duration: 0, color: OPTION_COLORS[2] }
    ]);
    setIsEditing(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessingChat) return;
    
    setIsProcessingChat(true);
    const message = chatInput;
    setChatInput('');
    
    try {
      // Import and use OpenAI parsing - include current form state in context
      const { parseSchedulingMessage, getSuggestedTimes } = await import('../lib/openai');
      
      const contactNames = contacts.map(c => c.name);
      
      // Extract busy slots from calendar events
      // Calculate proper end times based on duration or default to 1 hour
      const busySlots = events
        .filter(ev => ev.time && ev.date) // Only events with specific times
        .map(ev => {
          let endTime = ev.endTime;
          
          // If no endTime, calculate from duration or default to 1 hour
          if (!endTime && ev.time) {
            const [hours, minutes] = ev.time.split(':').map(Number);
            const durationMins = ev.duration || 60; // Default 1 hour
            const endMinutes = hours * 60 + minutes + durationMins;
            const endHours = Math.floor(endMinutes / 60) % 24;
            const endMins = endMinutes % 60;
            endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
          }
          
          return {
            date: ev.date,
            startTime: ev.time!,
            endTime: endTime || ev.time!,
            title: ev.title
          };
        });
      
      // Log busy slots for debugging
      console.log('[Gatherly] Sending busy slots to AI:', busySlots.length, 'events');
      if (busySlots.length > 0) {
        console.log('[Gatherly] Sample busy slots:', busySlots.slice(0, 5));
      }
      
      // Include current form state in the message for context preservation
      const contextMessage = `Current form state: Event="${eventName}", Location="${location}", Description="${description}", Participants=${JSON.stringify(participants)}, Options=${JSON.stringify(availabilityOptions.map(o => ({ day: o.day, time: o.time, duration: o.duration })))}. User message: ${message}`;
      
      const parsed = await parseSchedulingMessage(contextMessage, contactNames, busySlots, userLocation);
      
      if (parsed.isSchedulingRequest) {
        // Only update fields that the user explicitly wants to change
        // Preserve existing values for fields not mentioned
        if (parsed.title && parsed.title !== 'New Meeting') {
          setEventName(parsed.title);
        }
        
        // Set description from notes if parsed
        if (parsed.notes && parsed.notes.trim()) {
          setDescription(parsed.notes);
        }
        
        // Set location if parsed and different from placeholder
        // Validate location through Places API if it's a physical location
        if (parsed.location && parsed.location !== 'TBD') {
          const virtualPlatforms = ['google meet', 'zoom', 'teams', 'discord', 'slack', 'video call', 'virtual'];
          const isVirtual = virtualPlatforms.some(p => parsed.location!.toLowerCase().includes(p));
          
          if (isVirtual) {
            // Virtual locations don't need validation
            setLocation(parsed.location);
          } else {
            // Validate physical location through Places API
            try {
              let apiUrl = `/api/places-autocomplete?input=${encodeURIComponent(parsed.location)}`;
              if (userCoords) {
                apiUrl += `&lat=${userCoords.lat}&lon=${userCoords.lon}`;
              }
              const locResponse = await fetch(apiUrl);
              if (locResponse.ok) {
                const locData = await locResponse.json();
                if (locData.predictions && locData.predictions.length > 0) {
                  // Use the first validated location
                  setLocation(locData.predictions[0].description);
                } else {
                  // No match found, use TBD
                  setLocation('TBD');
                }
              } else {
                setLocation(parsed.location); // Fallback to raw value
              }
            } catch (err) {
              setLocation(parsed.location); // Fallback to raw value
            }
          }
        }
        
        // Add participants if parsed (merge with existing)
        // Only add if they're a known contact OR a valid email
        if (parsed.participants && parsed.participants.length > 0) {
          const validEmails: string[] = [];
          const unknownNames: string[] = [];
          
          parsed.participants.forEach(p => {
            // Try to find contact by name
            const contact = contacts.find(c => 
              c.name.toLowerCase().includes(p.toLowerCase()) ||
              c.email.toLowerCase().includes(p.toLowerCase())
            );
            
            if (contact) {
              validEmails.push(contact.email);
            } else if (isValidEmail(p)) {
              // It's already a valid email
              validEmails.push(p);
            } else {
              // Unknown name - need to prompt for email
              unknownNames.push(p);
            }
          });
          
          // Add valid emails immediately
          if (validEmails.length > 0) {
            setParticipants(prev => [...new Set([...prev, ...validEmails])]);
          }
          
          // Prompt for email for the first unknown name (one at a time)
          if (unknownNames.length > 0) {
            setEmailPromptFor(unknownNames[0]);
            setPendingEmail('');
          }
        }
        
        // Update availability options if we have date/time suggestions
        if (parsed.suggestedDate || parsed.suggestedTime) {
          const newOptions = [...availabilityOptions];
          const duration = parsed.duration || 60;
          
          // Set first option
          newOptions[0] = { 
            ...newOptions[0], 
            day: parsed.suggestedDate || '', 
            time: parsed.suggestedTime || '',
            duration: duration
          };
          
          // Check if API provided multiple suggestions (for better spacing)
          if (parsed.suggestedDate2 && parsed.suggestedTime2) {
            newOptions[1] = {
              ...newOptions[1],
              day: parsed.suggestedDate2,
              time: parsed.suggestedTime2,
              duration: duration
            };
          }
          
          if (parsed.suggestedDate3 && parsed.suggestedTime3) {
            newOptions[2] = {
              ...newOptions[2],
              day: parsed.suggestedDate3,
              time: parsed.suggestedTime3,
              duration: duration
            };
          }
          
          // If API didn't provide multiple suggestions, try to generate them
          // Only for unfilled slots
          if (!parsed.suggestedDate2 && events.length > 0 && parsed.suggestedDate) {
            const freeTimes = getSuggestedTimes(events, parsed.suggestedDate, duration);
            
            // Fill slot 2 with a different time on the same or next day
            if (!newOptions[1].day && freeTimes.length > 0) {
              const time2 = freeTimes.find(t => t !== parsed.suggestedTime) || freeTimes[0];
              newOptions[1] = { ...newOptions[1], day: parsed.suggestedDate, time: time2, duration };
            }
            
            // Fill slot 3 with another option
            if (!newOptions[2].day && freeTimes.length > 1) {
              const usedTimes = [parsed.suggestedTime, newOptions[1].time];
              const time3 = freeTimes.find(t => !usedTimes.includes(t)) || freeTimes[1];
              newOptions[2] = { ...newOptions[2], day: parsed.suggestedDate, time: time3, duration };
            }
          }
          
          setAvailabilityOptions(newOptions);
        }
        
        setIsEditing(true);
      } else {
        // Not a scheduling request, just append to event name if empty or treat as note
        if (!eventName) {
          setEventName(message);
        }
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error processing chat:', error);
      // Fallback: just set as event name if empty
      if (!eventName) {
        setEventName(message);
      }
      setIsEditing(true);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    // Auto-add current user as organizer when they start editing
    if (currentUserEmail && !participants.includes(currentUserEmail)) {
      setParticipants(prev => [currentUserEmail, ...prev]);
    }
  };

  return (
    <div ref={panelRef} className={`create-event-panel ${isEditing ? 'editing' : ''}`}>
      <div className="cep-header">
        <h2>Create Event</h2>
        <div className="cep-header-actions">
        {isEditing && (
              <button 
              className="cep-cancel-btn"
              onClick={() => {
                setEventName('');
                setDescription('');
                setLocation('');
                setParticipants([]);
                setAvailabilityOptions([
                  { id: '1', day: '', time: '', duration: 0, color: OPTION_COLORS[0] },
                  { id: '2', day: '', time: '', duration: 0, color: OPTION_COLORS[1] },
                  { id: '3', day: '', time: '', duration: 0, color: OPTION_COLORS[2] }
                ]);
                setIsEditing(false);
              }}
              type="button"
            >
              Cancel
            </button>
          )}
          <Link to="/events" className="cep-events-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Events
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="cep-form">
        {/* Event Name */}
        <div className="cep-field">
          <label>Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={e => { setEventName(e.target.value); setIsEditing(true); }}
            onFocus={handleFocus}
            placeholder="Team Lunch, Project Sync..."
            className={suggestedData?.eventName ? 'suggested' : ''}
          />
        </div>

        {/* Description */}
        <div className="cep-field">
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setIsEditing(true); }}
            onFocus={handleFocus}
            placeholder="Add any details about this event..."
            className="cep-description"
            rows={2}
          />
        </div>

        {/* Location */}
        <div className="cep-field cep-location-field">
          <label>Location/Link</label>
          <input
            type="text"
            value={location}
            onChange={e => handleLocationChange(e.target.value)}
            onFocus={() => {
              handleFocus();
              if (location.length >= 2) setShowLocationSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
            placeholder="Office, Zoom, Coffee shop..."
          />
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="cep-location-suggestions">
              {locationSuggestions.map((loc, idx) => {
                const isVirtual = loc.mainText.includes('Meet') || loc.mainText.includes('Zoom') || 
                                  loc.mainText.includes('Teams') || loc.mainText.includes('Discord') || 
                                  loc.mainText.includes('Slack');
                return (
                  <button
                    key={idx}
                    type="button"
                    className="cep-location-suggestion"
                    onMouseDown={() => selectLocation(loc)}
                  >
                    <span className="cep-loc-icon">
                      {isVirtual ? <VideoIcon /> : <LocationPinIcon />}
                    </span>
                    <span className="cep-loc-text">
                      <span className="cep-loc-main">{loc.mainText}</span>
                      {loc.secondaryText && (
                        <span className="cep-loc-secondary">{loc.secondaryText}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* People */}
        <div className="cep-field cep-people-field">
          <label>Who Do You Want to Invite?</label>
          <div className="cep-people-input-row">
            <input
              ref={inputRef}
              type="text"
              value={participantInput}
              onChange={e => {
                setParticipantInput(e.target.value);
                // Only show suggestions if there's input
                setShowSuggestions(e.target.value.length > 0);
                setIsEditing(true);
              }}
              onFocus={() => {
                // Only show suggestions if there's already input
                if (participantInput.length > 0) {
                  setShowSuggestions(true);
                }
                handleFocus();
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddParticipant(participantInput);
                }
              }}
              placeholder="Name or email..."
            />
            <button
              type="button"
              onClick={() => handleAddParticipant(participantInput)}
              className="cep-add-btn"
            >
              Add
            </button>
          </div>

          {/* Selected participants - show first */}
          {participants.length > 0 && (
            <div className="cep-participants">
              {participants.map(email => {
                const contact = contacts.find(c => c.email === email);
                const isCurrentUser = email === currentUserEmail;
                return (
                  <div key={email} className={`cep-participant ${isCurrentUser ? 'is-organizer' : ''}`}>
                    <span>{isCurrentUser ? `${contact?.name || currentUserName || 'You'} (Organizer)` : (contact?.name || email)}</span>
                    {!isCurrentUser && (
                      <button type="button" onClick={() => handleRemoveParticipant(email)}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent people - show when no input and have recent interactions */}
          {!participantInput && recentPeople.length > 0 && !showSuggestions && (
            <div className="cep-suggestions cep-recent-section">
              <div className="cep-recent-header">Recent</div>
              {recentPeople
                .filter(p => !participants.includes(p.email))
                .slice(0, 3)
                .map((person, idx) => (
                <button
                  key={`recent-${idx}`}
                  type="button"
                  className="cep-suggestion"
                  onMouseDown={() => handleAddParticipant(person.email)}
                >
                  <div className="cep-suggestion-avatar cep-recent-avatar">
                    {(person.name || person.email)[0].toUpperCase()}
                  </div>
                  <div className="cep-suggestion-info">
                    <span className="cep-suggestion-name">{person.name || person.email.split('@')[0]}</span>
                    <span className="cep-suggestion-email">{person.email}</span>
                  </div>
                  <span className="cep-recent-badge">⏱</span>
                </button>
              ))}
            </div>
          )}

          {/* Contact suggestions dropdown - positioned after participants */}
          {showSuggestions && filteredContacts.length > 0 && (
            <div className="cep-suggestions">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  className="cep-suggestion"
                  onMouseDown={() => handleAddParticipant(contact.email)}
                >
                  <div className="cep-suggestion-avatar">
                    {contact.name[0].toUpperCase()}
                  </div>
                  <div className="cep-suggestion-info">
                    <span className="cep-suggestion-name">{contact.name}</span>
                    <span className="cep-suggestion-email">{contact.email}</span>
                  </div>
                  {contact.isGatherly && (
                    <span className="cep-gatherly-badge">📅</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Email prompt modal */}
          {emailPromptFor && (
            <div className="cep-email-prompt">
              <p>Enter email for <strong>{emailPromptFor}</strong>:</p>
              <div className="cep-email-prompt-row">
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
                <button type="button" onClick={() => setEmailPromptFor(null)} className="cep-cancel-email">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Availability Options */}
        <div className="cep-field cep-availability">
          <label>
            <span>Availability</span>
            <span className="cep-availability-hint">Select dates and times that work for you</span>
          </label>
          <div className="cep-options">
            {availabilityOptions.map((opt, idx) => (
              <div 
                key={opt.id} 
                className={`cep-option ${opt.day && opt.time ? 'filled' : ''}`}
              >
                <span className="cep-option-badge">{idx + 1}</span>
                
                {/* Date Picker Button */}
                <button
                  type="button"
                  className={`cep-picker-btn ${opt.day ? 'has-value' : ''}`}
                  onClick={() => openDatePicker(opt.id, opt.day)}
                >
                  <CalendarIcon />
                  <span>{formatDateDisplay(opt.day)}</span>
                </button>
                
                {/* Time Picker Button */}
                <button
                  type="button"
                  className={`cep-picker-btn ${opt.time ? 'has-value' : ''}`}
                  onClick={() => openTimePicker(opt.id, opt.time)}
                >
                  <ClockIcon />
                  <span>{formatTimeDisplay(opt.time)}</span>
                </button>
                
                {/* Duration Picker Button */}
                <button
                  type="button"
                  className={`cep-picker-btn cep-duration-btn ${opt.duration ? 'has-value' : ''}`}
                  onClick={() => openDurationPicker(opt.id)}
                >
                  <TimerIcon />
                  <span>{formatDurationDisplay(opt.duration)}</span>
                </button>
              </div>
            ))}
          </div>
          
          {/* Custom Picker Modals */}
          {activePicker && (
            <div className="cep-picker-overlay" onClick={handleOverlayClick}>
              {/* Date Picker - Calendar View */}
              {activePicker.type === 'date' && (
                <div className="cep-calendar-picker">
                  <button 
                    type="button" 
                    className="cep-picker-close"
                    onClick={() => setActivePicker(null)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                  <div className="cep-calendar-header">
                    <button 
                      type="button"
                      onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <span className="cep-calendar-title">
                      {pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                  <div className="cep-calendar-weekdays">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className="cep-calendar-days">
                    {getCalendarDays(pickerMonth).map((date, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`cep-calendar-day ${!date ? 'empty' : ''} ${date && isToday(date) ? 'today' : ''} ${date && isPast(date) ? 'past' : ''}`}
                        disabled={!date || isPast(date)}
                        onClick={() => date && selectDate(date)}
                      >
                        {date?.getDate()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Time Picker - Analog Clock Style */}
              {activePicker.type === 'time' && (
                <div className="cep-time-picker">
                  <button 
                    type="button" 
                    className="cep-picker-close"
                    onClick={() => setActivePicker(null)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                  <div className="cep-time-display">
                    <button 
                      type="button"
                      className="cep-time-value-btn cep-time-hour"
                      onClick={() => setSelectedHour(prev => prev === 12 ? 1 : prev + 1)}
                    >
                      {selectedHour}
                    </button>
                    <span className="cep-time-colon">:</span>
                    <button 
                      type="button"
                      className="cep-time-value-btn cep-time-minute"
                      onClick={() => setSelectedMinute(prev => prev === 45 ? 0 : prev + 15)}
                    >
                      {selectedMinute.toString().padStart(2, '0')}
                    </button>
                    <button 
                      type="button"
                      className="cep-time-value-btn cep-time-period"
                      onClick={() => setSelectedPeriod(prev => prev === 'AM' ? 'PM' : 'AM')}
                    >
                      {selectedPeriod}
                    </button>
                  </div>
                  
                  {/* Analog Clock Face */}
                  <div className="cep-clock-face">
                    {/* Hour numbers around the clock */}
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                      const angle = (i * 30 - 90) * (Math.PI / 180);
                      const radiusPercent = 34; // % from center
                      const centerX = 50;
                      const centerY = 50;
                      const x = centerX + radiusPercent * Math.cos(angle);
                      const y = centerY + radiusPercent * Math.sin(angle);
                      return (
                        <button
                          key={h}
                          type="button"
                          className={`cep-clock-hour ${selectedHour === h ? 'selected' : ''}`}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => setSelectedHour(h)}
                        >
                          {h}
                        </button>
                      );
                    })}
                    
                    {/* Clock hands */}
                    <div 
                      className="cep-clock-hand hour-hand"
                      style={{ transform: `rotate(${(selectedHour % 12) * 30 + selectedMinute * 0.5}deg)` }}
                    />
                    <div 
                      className="cep-clock-hand minute-hand"
                      style={{ transform: `rotate(${selectedMinute * 6}deg)` }}
                    />
                    <div className="cep-clock-center" />
                  </div>
                  
                  {/* Minute wheel */}
                  <div className="cep-minute-wheel">
                    <span className="cep-minute-label">Minutes</span>
                    <div className="cep-minute-options">
                      {[0, 15, 30, 45].map(m => (
                        <button
                          key={m}
                          type="button"
                          className={`cep-minute-btn ${selectedMinute === m ? 'selected' : ''}`}
                          onClick={() => setSelectedMinute(m)}
                        >
                          :{m.toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* AM/PM Toggle */}
                  <div className="cep-period-toggle">
                    <button
                      type="button"
                      className={`cep-period-btn ${selectedPeriod === 'AM' ? 'selected' : ''}`}
                      onClick={() => setSelectedPeriod('AM')}
                    >
                      <svg className="period-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"/>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                      </svg>
                      <span>AM</span>
                    </button>
                    <button
                      type="button"
                      className={`cep-period-btn ${selectedPeriod === 'PM' ? 'selected' : ''}`}
                      onClick={() => setSelectedPeriod('PM')}
                    >
                      <svg className="period-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                      <span>PM</span>
                    </button>
                  </div>
                  
                  <button type="button" className="cep-time-confirm" onClick={confirmTime}>
                    Set Time
                  </button>
                </div>
              )}
              
              {/* Duration Picker */}
              {activePicker.type === 'duration' && (
                <div className="cep-duration-picker">
                  <button 
                    type="button" 
                    className="cep-picker-close"
                    onClick={() => setActivePicker(null)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                  <div className="cep-duration-header">
                    <div className="cep-slot-machine-frame">
                      <span className="cep-slot-title">DURATION</span>
                    </div>
                  </div>
                  <div className="cep-slot-machine">
                    <div className="cep-slot-window">
                      <div className="cep-slot-reel">
                        {DURATION_OPTIONS.filter(d => d.value > 0).map((d) => {
                          const isSelected = availabilityOptions.find(o => o.id === activePicker.optionId)?.duration === d.value;
                          return (
                            <button
                              key={d.value}
                              type="button"
                              className={`cep-slot-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => selectDuration(d.value)}
                            >
                              <div className="cep-slot-content">
                                {d.value <= 15 ? (
                                  <svg className="cep-slot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                  </svg>
                                ) : d.value <= 30 ? (
                                  <svg className="cep-slot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                                    <path d="M6 1v3M10 1v3M14 1v3"/>
                                  </svg>
                                ) : d.value <= 60 ? (
                                  <svg className="cep-slot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                  </svg>
                                ) : d.value <= 90 ? (
                                  <svg className="cep-slot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                  </svg>
                                ) : (
                                  <svg className="cep-slot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                  </svg>
                                )}
                                <span className="cep-slot-value">{d.label}</span>
                                <span className="cep-slot-desc">
                                  {d.value < 60 ? `${d.value} min` : d.value === 60 ? '1 hour' : `${d.value / 60}h`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button - requires event name and all 3 availability options filled */}
        <button 
          type="submit" 
          className="cep-submit"
          disabled={!isFormComplete || isLoading}
          title={
            !eventName.trim() ? 'Enter an event name' :
            (currentUserEmail ? participants.filter(p => p !== currentUserEmail).length : participants.length) === 0 
              ? 'Add at least one invitee' :
            !availabilityOptions.every(opt => opt.day && opt.time && opt.duration) ? 'Fill in all 3 availability options (date, time, and duration)' :
            'Create event'
          }
        >
          {isLoading ? (
            <span className="cep-loading">
              <svg className="cep-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
              </svg>
              Creating...
            </span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create
            </>
          )}
        </button>
      </form>

      {/* Chat Bar */}
      <div className="cep-chat">
        <form onSubmit={handleChatSubmit} className="cep-chat-form">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder={isProcessingChat ? 'Processing...' : PLACEHOLDER_SUGGESTIONS[placeholderIndex]}
            className="cep-chat-input"
            disabled={isProcessingChat}
          />
          <button 
            type="submit" 
            className="cep-chat-submit" 
            disabled={!chatInput.trim() || isProcessingChat}
          >
            {isProcessingChat ? (
              <svg className="cep-chat-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
              </svg>
            ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPanel;

