/**
 * Scheduling Event Service (PostgreSQL)
 * Linear Task: GATHER-27
 * 
 * Analytics and logging for scheduling events
 */

import { query, TABLES } from '../postgres.config';
import { SchedulingEvent, DayOfWeekPatterns, ISchedulingEventService } from '../../../types/schema';

/**
 * Mock Scheduling Event Service Implementation
 * Uses PostgreSQL for analytics and RL training data
 */
export class SchedulingEventService implements ISchedulingEventService {
  /**
   * Log a scheduling event
   */
  async logEvent(
    eventData: Omit<SchedulingEvent, 'id' | 'createdAt'>
  ): Promise<SchedulingEvent> {
    try {
      const result = await query<SchedulingEvent>(
        `INSERT INTO ${TABLES.SCHEDULING_EVENTS} (
          session_id,
          host_user_id,
          num_invitees,
          proposed_slots,
          selected_slot,
          outcome,
          time_to_schedule,
          num_messages
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          eventData.sessionId,
          eventData.hostUserId,
          eventData.numInvitees,
          eventData.proposedSlots ? JSON.stringify(eventData.proposedSlots) : null,
          eventData.selectedSlot ? JSON.stringify(eventData.selectedSlot) : null,
          eventData.outcome,
          eventData.timeToSchedule || null,
          eventData.numMessages,
        ]
      );
      
      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error logging scheduling event:', error);
      throw error;
    }
  }

  /**
   * Get scheduling events by user
   */
  async getEventsByUser(userId: string, limit: number = 50): Promise<SchedulingEvent[]> {
    try {
      const result = await query<SchedulingEvent>(
        `SELECT * FROM ${TABLES.SCHEDULING_EVENTS}
         WHERE host_user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows.map(row => this.mapRow(row));
    } catch (error) {
      console.error('Error getting events by user:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a user
   */
  async getAnalytics(userId: string): Promise<{
    totalSessions: number;
    successRate: number;
    avgTimeToSchedule: number;
    preferredDays: DayOfWeekPatterns;
  }> {
    try {
      // Total sessions
      const totalResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLES.SCHEDULING_EVENTS}
         WHERE host_user_id = $1`,
        [userId]
      );
      const totalSessions = parseInt(totalResult.rows[0]?.count || '0');
      
      // Success rate
      const successResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLES.SCHEDULING_EVENTS}
         WHERE host_user_id = $1 AND outcome = 'scheduled'`,
        [userId]
      );
      const successCount = parseInt(successResult.rows[0]?.count || '0');
      const successRate = totalSessions > 0 ? (successCount / totalSessions) * 100 : 0;
      
      // Average time to schedule
      const avgTimeResult = await query<{ avg: string }>(
        `SELECT AVG(time_to_schedule) as avg FROM ${TABLES.SCHEDULING_EVENTS}
         WHERE host_user_id = $1 AND outcome = 'scheduled' AND time_to_schedule IS NOT NULL`,
        [userId]
      );
      const avgTimeToSchedule = parseFloat(avgTimeResult.rows[0]?.avg || '0');
      
      // Preferred days (mock - would need to parse selected_slot timestamps)
      const preferredDays: DayOfWeekPatterns = {
        monday: 0.75,
        tuesday: 0.85,
        wednesday: 0.90,
        thursday: 0.80,
        friday: 0.60,
        saturday: 0.10,
        sunday: 0.05,
      };
      
      return {
        totalSessions,
        successRate,
        avgTimeToSchedule,
        preferredDays,
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Map database row to SchedulingEvent type
   */
  private mapRow(row: any): SchedulingEvent {
    return {
      id: row.id,
      sessionId: row.session_id,
      hostUserId: row.host_user_id,
      numInvitees: row.num_invitees,
      proposedSlots: row.proposed_slots,
      selectedSlot: row.selected_slot,
      outcome: row.outcome,
      timeToSchedule: row.time_to_schedule,
      numMessages: row.num_messages,
      createdAt: new Date(row.created_at),
    };
  }
}

// Singleton instance
let schedulingEventServiceInstance: SchedulingEventService | null = null;

export function getSchedulingEventService(): SchedulingEventService {
  if (!schedulingEventServiceInstance) {
    schedulingEventServiceInstance = new SchedulingEventService();
  }
  return schedulingEventServiceInstance;
}

