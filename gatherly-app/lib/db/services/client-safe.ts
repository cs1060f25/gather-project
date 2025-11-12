/**
 * Client-Safe Database Services
 * Only includes Firebase services that work in the browser
 * PostgreSQL services require server-side API routes
 */

// Only export Firebase-based services (they work in the browser)
export { UserService, getUserService } from './user.service';
export { EventSessionService, getEventSessionService } from './eventSession.service';
export { MessageService, getMessageService } from './message.service';

// PostgreSQL services need to be called via API routes
// Don't export PreferenceService or SchedulingEventService here
