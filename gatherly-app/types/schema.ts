/**
 * Gatherly Database Schema Types
 * Linear Task: GATHER-27
 * 
 * TypeScript interfaces for Firestore and PostgreSQL entities
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// User Entity (Firestore + Firebase Auth)
// ============================================================================

export type CalendarProvider = 'google' | 'outlook' | 'apple';

export interface CalendarConnection {
  provider: CalendarProvider;
  calendarId: string;
  isPrimary: boolean;
  readOnly: boolean;
  syncedAt: Date | Timestamp;
}

export interface DefaultPreferences {
  preferredDuration: number; // minutes
  bufferTime: number; // minutes between meetings
  workingHours: {
    start: string; // HH:mm format (e.g., "09:00")
    end: string;   // HH:mm format (e.g., "17:00")
  };
  excludeWeekends?: boolean;
}

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  name: string;
  avatarURL?: string;
  timezone: string; // IANA timezone (e.g., "America/New_York")
  googleAuthToken?: string; // Encrypted OAuth token
  calendars?: CalendarConnection[];
  defaultPreferences?: DefaultPreferences;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// EventSession Entity (Firestore)
// ============================================================================

export type SessionStatus = 'pending' | 'scheduled' | 'cancelled' | 'failed';

export interface TimeSlot {
  start: Date | Timestamp;
  end: Date | Timestamp;
  confidence?: number; // 0-1 score for AI suggestions
  conflicts?: string[]; // Human-readable conflict descriptions
}

export interface SchedulingConstraints {
  daysOfWeek?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  timeRange?: {
    start: string; // HH:mm format
    end: string;
  };
  excludeDates?: string[]; // ISO date strings
  minDuration?: number;
  maxDuration?: number;
  location?: string;
  isVirtual?: boolean;
}

export interface EventSession {
  id: string;
  hostUserId: string;
  inviteeIds: string[];
  title: string;
  duration: number; // minutes
  status: SessionStatus;
  proposedTimes?: TimeSlot[];
  finalTime?: TimeSlot;
  constraints?: SchedulingConstraints;
  createdAt: Date | Timestamp;
  scheduledAt?: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  metadata?: {
    failureReason?: string;
    suggestions?: string[];
    [key: string]: any;
  };
}

// ============================================================================
// Message Entity (Firestore Subcollection)
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ExtractedEntities {
  attendees?: string[];
  timeframe?: string;
  preference?: string;
  dates?: string[];
  times?: string[];
  duration?: number;
  [key: string]: any;
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata?: {
    extractedEntities?: ExtractedEntities;
    [key: string]: any;
  };
  timestamp: Date | Timestamp;
}

// ============================================================================
// AvailabilityBlock (Computed, Runtime Only)
// ============================================================================

export type AvailabilitySource = 'calendar' | 'preference' | 'constraint';

export interface AvailabilityBlock {
  userId: string;
  start: Date;
  end: Date;
  source: AvailabilitySource;
  isBusy: boolean;
  metadata?: {
    eventTitle?: string;
    preferredTime?: boolean;
    constraintReason?: string;
    [key: string]: any;
  };
}

// ============================================================================
// PreferenceProfile Entity (PostgreSQL)
// ============================================================================

export interface DayOfWeekPatterns {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface TimeOfDayPatterns {
  [hour: string]: number; // "09": 0.5, "14": 0.9, etc.
}

export interface DurationPreferences {
  [duration: string]: number; // "30": 0.6, "60": 0.3, etc.
}

export interface PreferenceProfile {
  userId: string;
  dayOfWeekPatterns: DayOfWeekPatterns;
  timeOfDayPatterns: TimeOfDayPatterns;
  durationPreferences: DurationPreferences;
  acceptanceRate: number; // 0-100
  avgResponseTime: number; // minutes
  lastUpdated: Date;
  sampleSize: number;
  createdAt: Date;
}

// ============================================================================
// SchedulingEvent Entity (PostgreSQL - Analytics)
// ============================================================================

export type SchedulingOutcome = 'scheduled' | 'cancelled' | 'failed';

export interface SchedulingEvent {
  id: string; // UUID
  sessionId: string;
  hostUserId: string;
  numInvitees: number;
  proposedSlots?: TimeSlot[];
  selectedSlot?: TimeSlot;
  outcome: SchedulingOutcome;
  timeToSchedule?: number; // minutes
  numMessages: number;
  createdAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  inviteeEmails: string[];
  title: string;
  duration: number;
  constraints?: SchedulingConstraints;
  initialMessage: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  proposedTimes: TimeSlot[];
  message: string;
}

export interface AcceptTimeSlotRequest {
  sessionId: string;
  selectedTime: TimeSlot;
}

export interface AcceptTimeSlotResponse {
  success: boolean;
  calendarEventIds: string[];
  message: string;
}

// ============================================================================
// Database Service Interfaces
// ============================================================================

export interface IUserService {
  getUser(userId: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}

export interface IEventSessionService {
  getSession(sessionId: string): Promise<EventSession | null>;
  createSession(session: Omit<EventSession, 'id' | 'createdAt'>): Promise<EventSession>;
  updateSession(sessionId: string, updates: Partial<EventSession>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  getSessionsByUser(userId: string, status?: SessionStatus): Promise<EventSession[]>;
}

export interface IMessageService {
  getMessages(sessionId: string): Promise<Message[]>;
  addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message>;
  deleteMessages(sessionId: string): Promise<void>;
}

export interface IPreferenceService {
  getProfile(userId: string): Promise<PreferenceProfile | null>;
  createProfile(profile: Omit<PreferenceProfile, 'createdAt'>): Promise<PreferenceProfile>;
  updateProfile(userId: string, updates: Partial<PreferenceProfile>): Promise<void>;
  computeProfile(userId: string): Promise<PreferenceProfile>;
}

export interface ISchedulingEventService {
  logEvent(event: Omit<SchedulingEvent, 'id' | 'createdAt'>): Promise<SchedulingEvent>;
  getEventsByUser(userId: string, limit?: number): Promise<SchedulingEvent[]>;
  getAnalytics(userId: string): Promise<{
    totalSessions: number;
    successRate: number;
    avgTimeToSchedule: number;
    preferredDays: DayOfWeekPatterns;
  }>;
}

