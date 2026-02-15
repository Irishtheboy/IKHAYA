import { notificationService, CreateNotificationDTO } from './notificationService';
import { NotificationPreferences } from '../types/firebase';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(() => ({ id: 'mock-id' })),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, toDate: () => new Date() })),
  },
}));

describe('NotificationService', () => {
  let mockDoc: jest.Mock;
  let mockSetDoc: jest.Mock;
  let mockGetDoc: jest.Mock;
  let mockUpdateDoc: jest.Mock;
  let mockGetDocs: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const firestore = require('firebase/firestore');
    mockDoc = firestore.doc as jest.Mock;
    mockSetDoc = firestore.setDoc as jest.Mock;
    mockGetDoc = firestore.getDoc as jest.Mock;
    mockUpdateDoc = firestore.updateDoc as jest.Mock;
    mockGetDocs = firestore.getDocs as jest.Mock;
    mockDoc.mockReturnValue({ id: 'mock-id' });
  });

  describe('createNotification', () => {
    it('should create a notification with valid data', async () => {
      mockSetDoc.mockResolvedValue(undefined);

      const notificationData: CreateNotificationDTO = {
        userId: 'user123',
        type: 'new_lead',
        title: 'New Lead',
        message: 'You have a new lead for your property',
        priority: 'high',
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(notificationData.userId);
      expect(result.type).toBe(notificationData.type);
      expect(result.title).toBe(notificationData.title);
      expect(result.message).toBe(notificationData.message);
      expect(result.priority).toBe(notificationData.priority);
      expect(result.read).toBe(false);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should throw error if userId is missing', async () => {
      const notificationData: CreateNotificationDTO = {
        userId: '',
        type: 'new_lead',
        title: 'New Lead',
        message: 'You have a new lead',
        priority: 'high',
      };

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should throw error if title is missing', async () => {
      const notificationData: CreateNotificationDTO = {
        userId: 'user123',
        type: 'new_lead',
        title: '',
        message: 'You have a new lead',
        priority: 'high',
      };

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow(
        'Notification title is required'
      );
    });

    it('should throw error if message is missing', async () => {
      const notificationData: CreateNotificationDTO = {
        userId: 'user123',
        type: 'new_lead',
        title: 'New Lead',
        message: '',
        priority: 'high',
      };

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow(
        'Notification message is required'
      );
    });

    it('should throw error if title exceeds 100 characters', async () => {
      const notificationData: CreateNotificationDTO = {
        userId: 'user123',
        type: 'new_lead',
        title: 'a'.repeat(101),
        message: 'You have a new lead',
        priority: 'high',
      };

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow(
        'Notification title must be 100 characters or less'
      );
    });

    it('should throw error if message exceeds 500 characters', async () => {
      const notificationData: CreateNotificationDTO = {
        userId: 'user123',
        type: 'new_lead',
        title: 'New Lead',
        message: 'a'.repeat(501),
        priority: 'high',
      };

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow(
        'Notification message must be 500 characters or less'
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should fetch all notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user123',
          type: 'new_lead',
          title: 'New Lead',
          message: 'You have a new lead',
          priority: 'high',
          read: false,
          createdAt: { seconds: Date.now() / 1000 },
        },
        {
          id: 'notif2',
          userId: 'user123',
          type: 'new_message',
          title: 'New Message',
          message: 'You have a new message',
          priority: 'medium',
          read: true,
          createdAt: { seconds: Date.now() / 1000 },
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map((notif) => ({
          id: notif.id,
          data: () => notif,
        })),
      });

      const result = await notificationService.getUserNotifications('user123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('notif1');
      expect(result[1].id).toBe('notif2');
    });

    it('should fetch only unread notifications when unreadOnly is true', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user123',
          type: 'new_lead',
          title: 'New Lead',
          message: 'You have a new lead',
          priority: 'high',
          read: false,
          createdAt: { seconds: Date.now() / 1000 },
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map((notif) => ({
          id: notif.id,
          data: () => notif,
        })),
      });

      const result = await notificationService.getUserNotifications('user123', true);

      expect(result).toHaveLength(1);
      expect(result[0].read).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotificationRef = { id: 'notif123' };
      mockDoc.mockReturnValue(mockNotificationRef);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'user123',
          type: 'new_lead',
          title: 'New Lead',
          message: 'You have a new lead',
          priority: 'high',
          read: false,
        }),
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      await notificationService.markAsRead('notif123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockNotificationRef, {
        read: true,
      });
    });

    it('should throw error if notification not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(notificationService.markAsRead('notif123')).rejects.toThrow(
        'Notification not found'
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            userId: 'user123',
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
          }),
        })
        .mockResolvedValueOnce({
          id: 'user123',
          exists: () => true,
          data: () => ({
            userId: 'user123',
            notifications: {
              email: false,
              sms: true,
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
          }),
        });

      mockUpdateDoc.mockResolvedValue(undefined);

      const preferences: NotificationPreferences = {
        email: false,
        sms: true,
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
      };

      const result = await notificationService.updatePreferences('user123', preferences);

      expect(result).toBeDefined();
      expect(result.notifications.email).toBe(false);
      expect(result.notifications.sms).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should create new preferences if they do not exist', async () => {
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => false,
        })
        .mockResolvedValueOnce({
          id: 'user123',
          exists: () => true,
          data: () => ({
            userId: 'user123',
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
          }),
        });

      mockSetDoc.mockResolvedValue(undefined);

      const preferences: NotificationPreferences = {
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
      };

      const result = await notificationService.updatePreferences('user123', preferences);

      expect(result).toBeDefined();
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('getPreferences', () => {
    it('should fetch user preferences', async () => {
      mockGetDoc.mockResolvedValue({
        id: 'user123',
        exists: () => true,
        data: () => ({
          userId: 'user123',
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
        }),
      });

      const result = await notificationService.getPreferences('user123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.notifications.email).toBe(true);
    });

    it('should return default preferences if not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await notificationService.getPreferences('user123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.notifications.email).toBe(true);
      expect(result.notifications.sms).toBe(false);
      expect(result.notifications.inApp).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user123',
          type: 'new_lead',
          title: 'New Lead',
          message: 'You have a new lead',
          priority: 'high',
          read: false,
          createdAt: { seconds: Date.now() / 1000 },
        },
        {
          id: 'notif2',
          userId: 'user123',
          type: 'new_message',
          title: 'New Message',
          message: 'You have a new message',
          priority: 'medium',
          read: false,
          createdAt: { seconds: Date.now() / 1000 },
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map((notif) => ({
          id: notif.id,
          data: () => notif,
        })),
      });

      const count = await notificationService.getUnreadCount('user123');

      expect(count).toBe(2);
    });
  });
});
