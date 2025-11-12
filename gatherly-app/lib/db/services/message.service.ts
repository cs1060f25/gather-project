/**
 * Message Service (Firestore Subcollection)
 * Linear Task: GATHER-27
 * 
 * CRUD operations for Message entity
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, COLLECTIONS } from '../firebase.config';
import { Message, IMessageService } from '../../../types/schema';

/**
 * Mock Message Service Implementation
 * Messages are stored as subcollections under EventSessions
 */
export class MessageService implements IMessageService {
  private db = getFirestoreDb();

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const messagesRef = collection(
        this.db,
        COLLECTIONS.EVENT_SESSIONS,
        sessionId,
        COLLECTIONS.MESSAGES
      );
      
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Add a message to a session
   */
  async addMessage(
    sessionId: string,
    messageData: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message> {
    try {
      const messagesRef = collection(
        this.db,
        COLLECTIONS.EVENT_SESSIONS,
        sessionId,
        COLLECTIONS.MESSAGES
      );
      
      const newMessage: Omit<Message, 'id'> = {
        ...messageData,
        timestamp: serverTimestamp() as any,
      };
      
      const docRef = await addDoc(messagesRef, newMessage);
      
      return {
        id: docRef.id,
        ...newMessage,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Delete all messages in a session
   */
  async deleteMessages(sessionId: string): Promise<void> {
    try {
      const messagesRef = collection(
        this.db,
        COLLECTIONS.EVENT_SESSIONS,
        sessionId,
        COLLECTIONS.MESSAGES
      );
      
      const snapshot = await getDocs(messagesRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting messages:', error);
      throw error;
    }
  }
}

// Singleton instance
let messageServiceInstance: MessageService | null = null;

export function getMessageService(): MessageService {
  if (!messageServiceInstance) {
    messageServiceInstance = new MessageService();
  }
  return messageServiceInstance;
}

