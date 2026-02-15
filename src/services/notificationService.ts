import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  UserPreferences,
  NotificationPreferences,
} from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';

/**
 * Data Transfer Object for notification creation
 */
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority: NotificationPriority;
}

/**
 * Notification Service
 * Handles notification creation, retrieval, and user preferences management
 */
class NotificationService {
  /**
   * Create a new notification
   *
   * @param notificationData - Notification creation data
   * @returns Promise resolving to the created notification
   * @throws Error if creation fails
   */
  async createNotification(notificationData: CreateNotificationDTO): Promise<Notification> {
    try {
      // Validate notification data
      this.validateNotificationData(notificationData);

      // Create new document reference with auto-generated ID
      const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));

      // Prepare notification document
      const notificationDoc: Omit<Notification, 'id'> = {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        link: notificationData.link,
        priority: notificationData.priority,
        read: false,
        createdAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(notificationRef, notificationDoc);

      // Return notification with ID
      const notification: Notification = {
        id: notificationRef.id,
        ...notificationDoc,
        createdAt: notificationDoc.createdAt,
      };

      return notification;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Get all notifications for a user
   *
   * @param userId - ID of the user
   * @param unreadOnly - If true, only return unread notifications
   * @returns Promise resolving to array of notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      // Build query
      let notificationsQuery;

      if (unreadOnly) {
        notificationsQuery = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('userId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else {
        notificationsQuery = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(notificationsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Notification, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching user notifications:', error);
      throw new Error(`Failed to fetch user notifications: ${error.message}`);
    }
  }

  /**
   * Mark a notification as read
   *
   * @param notificationId - ID of the notification
   * @returns Promise that resolves when notification is marked as read
   * @throws Error if notification not found or update fails
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);

      // Check if notification exists
      const notificationSnap = await getDoc(notificationRef);
      if (!notificationSnap.exists()) {
        throw new Error('Notification not found');
      }

      // Update read status
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - ID of the user
   * @returns Promise that resolves when all notifications are marked as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      // Get all unread notifications
      const unreadNotifications = await this.getUserNotifications(userId, true);

      // Mark each as read
      const updatePromises = unreadNotifications.map((notification) =>
        this.markAsRead(notification.id)
      );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Get unread notification count for a user
   *
   * @param userId - ID of the user
   * @returns Promise resolving to count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.getUserNotifications(userId, true);
      return unreadNotifications.length;
    } catch (error: any) {
      console.error('Error getting unread notification count:', error);
      throw new Error(`Failed to get unread notification count: ${error.message}`);
    }
  }

  /**
   * Update user notification preferences
   *
   * @param userId - ID of the user
   * @param preferences - Notification preferences to update
   * @returns Promise resolving to updated preferences
   * @throws Error if update fails
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<UserPreferences> {
    try {
      // Validate preferences
      this.validatePreferences(preferences);

      const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);

      // Check if preferences document exists
      const preferencesSnap = await getDoc(preferencesRef);

      if (preferencesSnap.exists()) {
        // Update existing preferences
        await updateDoc(preferencesRef, {
          notifications: preferences,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new preferences document
        const preferencesDoc: Omit<UserPreferences, 'id'> = {
          userId,
          notifications: preferences,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(preferencesRef, preferencesDoc);
      }

      // Fetch and return updated preferences
      const updatedSnap = await getDoc(preferencesRef);
      const preferencesData = updatedSnap.data() as Omit<UserPreferences, 'id'>;

      return {
        id: updatedSnap.id,
        ...preferencesData,
      };
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }

  /**
   * Get user notification preferences
   *
   * @param userId - ID of the user
   * @returns Promise resolving to user preferences or default preferences if not found
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
      const preferencesSnap = await getDoc(preferencesRef);

      if (!preferencesSnap.exists()) {
        // Return default preferences
        return this.getDefaultPreferences(userId);
      }

      const preferencesData = preferencesSnap.data() as Omit<UserPreferences, 'id'>;
      return {
        id: preferencesSnap.id,
        ...preferencesData,
      };
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      throw new Error(`Failed to fetch notification preferences: ${error.message}`);
    }
  }

  /**
   * Delete a notification
   *
   * @param notificationId - ID of the notification to delete
   * @returns Promise that resolves when notification is deleted
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);

      // Check if notification exists
      const notificationSnap = await getDoc(notificationRef);
      if (!notificationSnap.exists()) {
        throw new Error('Notification not found');
      }

      // Delete notification
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Get default notification preferences
   *
   * @param userId - ID of the user
   * @returns Default user preferences
   */
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      id: userId,
      userId,
      notifications: {
        email: true,
        sms: false,
        inApp: true,
        types: {
          new_lead: true,
          new_message: true,
          maintenance_request: true,
          lease_expiring: true,
          payment_due: true,
          payment_received: true,
          listing_approved: true,
        },
      },
      updatedAt: Timestamp.now(),
    };
  }

  /**
   * Validate notification data
   *
   * @param notificationData - Notification data to validate
   * @throws Error if validation fails
   */
  private validateNotificationData(notificationData: CreateNotificationDTO): void {
    if (!notificationData.userId || notificationData.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!notificationData.type) {
      throw new Error('Notification type is required');
    }

    if (!notificationData.title || notificationData.title.trim().length === 0) {
      throw new Error('Notification title is required');
    }

    if (notificationData.title.length > 100) {
      throw new Error('Notification title must be 100 characters or less');
    }

    if (!notificationData.message || notificationData.message.trim().length === 0) {
      throw new Error('Notification message is required');
    }

    if (notificationData.message.length > 500) {
      throw new Error('Notification message must be 500 characters or less');
    }

    if (!notificationData.priority) {
      throw new Error('Notification priority is required');
    }
  }

  /**
   * Validate notification preferences
   *
   * @param preferences - Preferences to validate
   * @throws Error if validation fails
   */
  private validatePreferences(preferences: NotificationPreferences): void {
    if (typeof preferences.email !== 'boolean') {
      throw new Error('Email preference must be a boolean');
    }

    if (typeof preferences.sms !== 'boolean') {
      throw new Error('SMS preference must be a boolean');
    }

    if (typeof preferences.inApp !== 'boolean') {
      throw new Error('In-app preference must be a boolean');
    }

    if (!preferences.types || typeof preferences.types !== 'object') {
      throw new Error('Notification types must be an object');
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
