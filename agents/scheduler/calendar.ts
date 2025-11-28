// /agents/scheduler/calendar.ts
import { google } from 'googleapis';
import { z } from 'zod';

// Recurrence schema
export const RecurrenceSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  count: z.number().int().positive(),
  interval: z.number().int().positive().optional(),
});

// Calendar request schema - matches team contracts CalendarService interface
export const CalendarRequestSchema = z.object({
  hostId: z.string().min(1),
  slot: z.string().min(1), // ISO-8601 start time
  title: z.string().min(1),
  location: z.string().nullable().optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().default(60),
  inviteeEmails: z.array(z.string().email()).optional(),
  recurrence: RecurrenceSchema.optional(),
  timeZone: z.string().optional().default('UTC'),
});

export type CalendarRequest = z.infer<typeof CalendarRequestSchema>;

// Calendar response schema - matches team contracts
export const CalendarResponseSchema = z.object({
  eventId: z.string(),
  calendarEventId: z.string(), // Google Calendar event ID
});

export type CalendarResponse = z.infer<typeof CalendarResponseSchema>;

// Error types
export class CalendarError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION' | 'AUTH' | 'QUOTA' | 'CONFLICT' | 'API',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

// Busy period schema for free/busy queries
export interface BusyPeriod {
  start: string; // ISO-8601
  end: string;   // ISO-8601
}

/**
 * Calendar Agent - Google Calendar API integration
 * Handles calendar event creation and free/busy queries
 * Called after consensus is reached by the Consensus Coordinator
 */
export class CalendarAgent {
  private oauth2Client: any;
  private calendar: any;

  constructor() {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Initialize Calendar API
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Set OAuth credentials for a specific user
   */
  private setUserCredentials(hostId: string, accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Get host's busy periods for scheduling
   * Used by the Scheduler Agent to avoid conflicts
   */
  async getHostBusy(params: {
    hostId: string;
    timeMin: string; // ISO-8601
    timeMax: string; // ISO-8601
  }): Promise<BusyPeriod[]> {
    const { hostId, timeMin, timeMax } = params;

    try {
      // Retrieve user's OAuth tokens
      const userTokens = await this.getUserTokens(hostId);
      this.setUserCredentials(hostId, userTokens.accessToken, userTokens.refreshToken);

      // Query free/busy information
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: 'primary' }], // Primary calendar
        },
      });

      const busyPeriods = response.data.calendars?.primary?.busy || [];
      return busyPeriods.map((period: any) => ({
        start: period.start,
        end: period.end,
      }));
    } catch (error) {
      console.error('Error fetching busy periods:', error);
      throw new CalendarError(
        `Failed to fetch busy periods for host ${hostId}`,
        'API',
        error
      );
    }
  }

  /**
   * Create confirmed event on host's calendar
   * This is the main function called after consensus is reached
   * Matches the team contracts CalendarService.createHostEvent interface
   */
  async createHostEvent(input: CalendarRequest): Promise<CalendarResponse> {
    // Validate input
    const { hostId, slot, title, location, description, durationMinutes, inviteeEmails } = 
      CalendarRequestSchema.parse(input);

    try {
      // Retrieve user's OAuth tokens
      const userTokens = await this.getUserTokens(hostId);
      this.setUserCredentials(hostId, userTokens.accessToken, userTokens.refreshToken);

      // Calculate end time
      const startTime = new Date(slot);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      // Prepare attendees list
      const attendees = inviteeEmails?.map((email: string) => ({ email })) || [];

      // Create calendar event
      const eventResource: any = {
        summary: title,
        description: description || `Scheduled via Gatherly`,
        location: location || undefined,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: input.timeZone || 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: input.timeZone || 'UTC',
        },
        attendees,
        reminders: {
          useDefault: true,
        },
        // Automatically send invitations to attendees
        sendUpdates: 'all',
      };

      // Add recurrence if specified
      if (input.recurrence) {
        const { frequency, count, interval } = input.recurrence;
        eventResource.recurrence = [
          `RRULE:FREQ=${frequency};COUNT=${count}${interval ? `;INTERVAL=${interval}` : ''}`
        ];
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventResource,
        sendUpdates: 'all', // Send email invitations
      });

      const calendarEventId = response.data.id;
      if (!calendarEventId) {
        throw new CalendarError(
          'Failed to create calendar event - no event ID returned',
          'API'
        );
      }

      // Generate internal event ID
      const eventId = `evt_${Date.now()}_${hostId.slice(0, 8)}`;

      console.log(`✅ Calendar event created: ${calendarEventId} for "${title}"`);
      console.log(`📧 Invitations sent to: ${inviteeEmails?.join(', ') || 'none'}`);
      console.log(`📅 Event time: ${startTime.toISOString()} (${durationMinutes} min)`);
      if (location) console.log(`📍 Location: ${location}`);

      return {
        eventId,
        calendarEventId,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new CalendarError(
        `Failed to create calendar event`,
        'API',
        error
      );
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateHostEvent(
    hostId: string,
    calendarEventId: string,
    updates: Partial<CalendarRequest>
  ): Promise<void> {
    try {
      const userTokens = await this.getUserTokens(hostId);
      this.setUserCredentials(hostId, userTokens.accessToken, userTokens.refreshToken);

      const updateResource: any = {};

      if (updates.title) updateResource.summary = updates.title;
      if (updates.description) updateResource.description = updates.description;
      if (updates.location !== undefined) updateResource.location = updates.location;

      if (updates.slot && updates.durationMinutes) {
        const startTime = new Date(updates.slot);
        const endTime = new Date(startTime.getTime() + updates.durationMinutes * 60 * 1000);
        
        updateResource.start = {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        };
        updateResource.end = {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        };
      }

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId: calendarEventId,
        requestBody: updateResource,
        sendUpdates: 'all',
      });

      console.log(`✅ Calendar event updated: ${calendarEventId}`);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error}`);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteHostEvent(hostId: string, calendarEventId: string): Promise<void> {
    try {
      const userTokens = await this.getUserTokens(hostId);
      this.setUserCredentials(hostId, userTokens.accessToken, userTokens.refreshToken);

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: calendarEventId,
        sendUpdates: 'all',
      });

      console.log(`✅ Calendar event deleted: ${calendarEventId}`);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error}`);
    }
  }

  /**
   * TODO: Implement user token retrieval from your database
   * This should fetch the user's stored OAuth tokens
   */
  private async getUserTokens(hostId: string): Promise<{ accessToken: string; refreshToken?: string }> {
    // PLACEHOLDER: Replace with actual database query
    // Example using your user store:
    // const user = await getUserById(hostId);
    // return {
    //   accessToken: user.googleAuthToken,
    //   refreshToken: user.googleRefreshToken,
    // };
    
    // For development, you can use environment variables:
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!accessToken) {
      throw new Error(`No Google Calendar access token found for user ${hostId}`);
    }
    
    return { accessToken, refreshToken };
  }
}

// Export singleton instance
export const calendarAgent = new CalendarAgent();

/**
 * Convenience function that matches the team contracts interface exactly
 */
export async function createHostEvent(params: CalendarRequest): Promise<CalendarResponse> {
  return calendarAgent.createHostEvent(params);
}
