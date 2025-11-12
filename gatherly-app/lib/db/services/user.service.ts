/**
 * User Service (Firestore)
 * Linear Task: GATHER-27
 * 
 * CRUD operations for User entity
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, COLLECTIONS } from '../firebase.config';
import { User, IUserService } from '../../../types/schema';

/**
 * Mock User Service Implementation
 * Uses Firestore for persistence
 */
export class UserService implements IUserService {
  private db = getFirestoreDb();
  private collection = collection(this.db, COLLECTIONS.USERS);

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.collection, userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const userId = userData.email.split('@')[0]; // Mock ID generation
      const userDoc = doc(this.collection, userId);
      
      const newUser: Omit<User, 'id'> = {
        ...userData,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      
      await setDoc(userDoc, newUser);
      
      return {
        id: userId,
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userDoc = doc(this.collection, userId);
      await updateDoc(userDoc, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const userDoc = doc(this.collection, userId);
      await deleteDoc(userDoc);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Singleton instance
let userServiceInstance: UserService | null = null;

export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
}

