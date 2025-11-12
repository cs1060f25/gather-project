/**
 * Preference Profile Service (PostgreSQL)
 * Linear Task: GATHER-27
 * 
 * CRUD operations for PreferenceProfile entity
 */

import { query, TABLES } from '../postgres.config';
import { PreferenceProfile, IPreferenceService } from '../../../types/schema';

/**
 * Mock Preference Service Implementation
 * Uses PostgreSQL for structured analytics data
 */
export class PreferenceService implements IPreferenceService {
  /**
   * Get preference profile by user ID
   */
  async getProfile(userId: string): Promise<PreferenceProfile | null> {
    try {
      const result = await query<PreferenceProfile>(
        `SELECT * FROM ${TABLES.PREFERENCE_PROFILES} WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error getting preference profile:', error);
      throw error;
    }
  }

  /**
   * Create a new preference profile
   */
  async createProfile(
    profileData: Omit<PreferenceProfile, 'createdAt'>
  ): Promise<PreferenceProfile> {
    try {
      const result = await query<PreferenceProfile>(
        `INSERT INTO ${TABLES.PREFERENCE_PROFILES} (
          user_id,
          day_of_week_patterns,
          time_of_day_patterns,
          duration_preferences,
          acceptance_rate,
          avg_response_time,
          last_updated,
          sample_size
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          profileData.userId,
          JSON.stringify(profileData.dayOfWeekPatterns),
          JSON.stringify(profileData.timeOfDayPatterns),
          JSON.stringify(profileData.durationPreferences),
          profileData.acceptanceRate,
          profileData.avgResponseTime,
          profileData.lastUpdated,
          profileData.sampleSize,
        ]
      );
      
      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error creating preference profile:', error);
      throw error;
    }
  }

  /**
   * Update preference profile
   */
  async updateProfile(userId: string, updates: Partial<PreferenceProfile>): Promise<void> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (updates.dayOfWeekPatterns) {
        setClauses.push(`day_of_week_patterns = $${paramIndex++}`);
        values.push(JSON.stringify(updates.dayOfWeekPatterns));
      }
      if (updates.timeOfDayPatterns) {
        setClauses.push(`time_of_day_patterns = $${paramIndex++}`);
        values.push(JSON.stringify(updates.timeOfDayPatterns));
      }
      if (updates.durationPreferences) {
        setClauses.push(`duration_preferences = $${paramIndex++}`);
        values.push(JSON.stringify(updates.durationPreferences));
      }
      if (updates.acceptanceRate !== undefined) {
        setClauses.push(`acceptance_rate = $${paramIndex++}`);
        values.push(updates.acceptanceRate);
      }
      if (updates.avgResponseTime !== undefined) {
        setClauses.push(`avg_response_time = $${paramIndex++}`);
        values.push(updates.avgResponseTime);
      }
      if (updates.sampleSize !== undefined) {
        setClauses.push(`sample_size = $${paramIndex++}`);
        values.push(updates.sampleSize);
      }
      
      setClauses.push(`last_updated = NOW()`);
      values.push(userId);
      
      const sql = `
        UPDATE ${TABLES.PREFERENCE_PROFILES}
        SET ${setClauses.join(', ')}
        WHERE user_id = $${paramIndex}
      `;
      
      await query(sql, values);
    } catch (error) {
      console.error('Error updating preference profile:', error);
      throw error;
    }
  }

  /**
   * Compute preference profile from user's scheduling history
   * This would analyze past scheduling_events in a real implementation
   */
  async computeProfile(userId: string): Promise<PreferenceProfile> {
    try {
      // Mock computation - in production, this would:
      // 1. Query scheduling_events for this user
      // 2. Analyze patterns in selected_slot times
      // 3. Calculate acceptance rate from outcomes
      // 4. Compute histograms
      
      const mockProfile: Omit<PreferenceProfile, 'createdAt'> = {
        userId,
        dayOfWeekPatterns: {
          monday: 0.75,
          tuesday: 0.85,
          wednesday: 0.90,
          thursday: 0.80,
          friday: 0.60,
          saturday: 0.10,
          sunday: 0.05,
        },
        timeOfDayPatterns: {
          '09': 0.20,
          '10': 0.35,
          '11': 0.45,
          '14': 0.80,
          '15': 0.90,
          '16': 0.75,
        },
        durationPreferences: {
          '30': 0.60,
          '60': 0.35,
          '90': 0.05,
        },
        acceptanceRate: 75.0,
        avgResponseTime: 42,
        lastUpdated: new Date(),
        sampleSize: 20,
      };
      
      // Check if profile exists
      const existing = await this.getProfile(userId);
      
      if (existing) {
        await this.updateProfile(userId, mockProfile);
        return this.getProfile(userId) as Promise<PreferenceProfile>;
      } else {
        return this.createProfile(mockProfile);
      }
    } catch (error) {
      console.error('Error computing preference profile:', error);
      throw error;
    }
  }

  /**
   * Map database row to PreferenceProfile type
   */
  private mapRow(row: any): PreferenceProfile {
    return {
      userId: row.user_id,
      dayOfWeekPatterns: row.day_of_week_patterns,
      timeOfDayPatterns: row.time_of_day_patterns,
      durationPreferences: row.duration_preferences,
      acceptanceRate: parseFloat(row.acceptance_rate),
      avgResponseTime: row.avg_response_time,
      lastUpdated: new Date(row.last_updated),
      sampleSize: row.sample_size,
      createdAt: new Date(row.created_at),
    };
  }
}

// Singleton instance
let preferenceServiceInstance: PreferenceService | null = null;

export function getPreferenceService(): PreferenceService {
  if (!preferenceServiceInstance) {
    preferenceServiceInstance = new PreferenceService();
  }
  return preferenceServiceInstance;
}

