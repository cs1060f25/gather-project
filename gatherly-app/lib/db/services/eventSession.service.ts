/**
 * EventSession Service (Firestore)
 * Linear Task: GATHER-27
 * 
 * CRUD operations for EventSession entity
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, COLLECTIONS } from '../firebase.config';
import { EventSession, SessionStatus, IEventSessionService } from '../../../types/schema';

/**
 * Mock EventSession Service Implementation
 */
export class EventSessionService implements IEventSessionService {
  private db = getFirestoreDb();
  private collection = collection(this.db, COLLECTIONS.EVENT_SESSIONS);

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<EventSession | null> {
    try {
      const sessionDoc = await getDoc(doc(this.collection, sessionId));
      
      if (!sessionDoc.exists()) {
        return null;
      }
      
      return {
        id: sessionDoc.id,
        ...sessionDoc.data(),
      } as EventSession;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionData: Omit<EventSession, 'id' | 'createdAt'>): Promise<EventSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionDoc = doc(this.collection, sessionId);
      
      const newSession: Omit<EventSession, 'id'> = {
        ...sessionData,
        createdAt: serverTimestamp() as any,
      };
      
      await setDoc(sessionDoc, newSession);
      
      return {
        id: sessionId,
        ...newSession,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updates: Partial<EventSession>): Promise<void> {
    try {
      const sessionDoc = doc(this.collection, sessionId);
      await updateDoc(sessionDoc, updates as any);
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionDoc = doc(this.collection, sessionId);
      await deleteDoc(sessionDoc);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Get sessions by user (as host)
   */
  async getSessionsByUser(userId: string, status?: SessionStatus): Promise<EventSession[]> {
    try {
      let q = query(this.collection, where('hostUserId', '==', userId));
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as EventSession));
    } catch (error) {
      console.error('Error getting sessions by user:', error);
      throw error;
    }
  }
}

// Singleton instance
let eventSessionServiceInstance: EventSessionService | null = null;

export function getEventSessionService(): EventSessionService {
  if (!eventSessionServiceInstance) {
    eventSessionServiceInstance = new EventSessionService();
  }
  return eventSessionServiceInstance;
}

