import { maintenanceService, MaintenanceRequestDTO } from './maintenanceService';
import { MaintenanceRequest, MaintenanceStatus } from '../types/firebase';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {},
}));

jest.mock('firebase/firestore', () => {
  let docIdCounter = 0;
  const mockDoc = jest.fn((...args: any[]) => {
    // Handle doc(collection(...)) - auto-generated ID
    if (args.length === 1) {
      return { id: `mock-maintenance-${++docIdCounter}` };
    }
    // Handle doc(db, collectionName, docId) - specific ID
    if (args.length === 3 && args[2]) {
      return { id: args[2] };
    }
    // Handle doc(db, collectionName) - auto-generated ID
    return { id: `mock-maintenance-${++docIdCounter}` };
  });

  return {
    collection: jest.fn(() => ({})),
    doc: mockDoc,
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(),
    serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
      fromDate: jest.fn((date: Date) => ({
        seconds: date.getTime() / 1000,
        nanoseconds: 0,
      })),
    },
  };
});

jest.mock('./imageUploadService', () => ({
  imageUploadService: {
    uploadImages: jest.fn(),
    deleteImage: jest.fn(),
  },
}));

import * as firestore from 'firebase/firestore';
import { imageUploadService } from './imageUploadService';

describe('MaintenanceService', () => {
  beforeEach(() => {
    // Don't clear mocks - they're defined at module level
    // jest.clearAllMocks();
  });

  describe('createMaintenanceRequest', () => {
    it('should create a maintenance request with valid data', async () => {
      const requestData: MaintenanceRequestDTO = {
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe in the kitchen',
      };

      (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await maintenanceService.createMaintenanceRequest(requestData);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^mock-maintenance-\d+$/);
      expect(result.propertyId).toBe(requestData.propertyId);
      expect(result.tenantId).toBe(requestData.tenantId);
      expect(result.landlordId).toBe(requestData.landlordId);
      expect(result.category).toBe(requestData.category);
      expect(result.priority).toBe(requestData.priority);
      expect(result.description).toBe(requestData.description);
      expect(result.status).toBe('pending');
      expect(result.images).toEqual([]);
      expect(result.notes).toEqual([]);
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should throw error when property ID is missing', async () => {
      const requestData: MaintenanceRequestDTO = {
        propertyId: '',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
      };

      await expect(maintenanceService.createMaintenanceRequest(requestData)).rejects.toThrow(
        'Property ID is required'
      );
    });

    it('should throw error when description is missing', async () => {
      const requestData: MaintenanceRequestDTO = {
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: '',
      };

      await expect(maintenanceService.createMaintenanceRequest(requestData)).rejects.toThrow(
        'Description is required'
      );
    });

    it('should throw error when description exceeds 2000 characters', async () => {
      const requestData: MaintenanceRequestDTO = {
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'a'.repeat(2001),
      };

      await expect(maintenanceService.createMaintenanceRequest(requestData)).rejects.toThrow(
        'Description must be 2000 characters or less'
      );
    });

    it('should throw error when category is invalid', async () => {
      const requestData: any = {
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'invalid-category',
        priority: 'high',
        description: 'Leaking pipe',
      };

      await expect(maintenanceService.createMaintenanceRequest(requestData)).rejects.toThrow(
        'Invalid maintenance category'
      );
    });

    it('should throw error when priority is invalid', async () => {
      const requestData: any = {
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'invalid-priority',
        description: 'Leaking pipe',
      };

      await expect(maintenanceService.createMaintenanceRequest(requestData)).rejects.toThrow(
        'Invalid maintenance priority'
      );
    });
  });

  describe('getRequest', () => {
    it('should return maintenance request when it exists', async () => {
      const mockRequest: Omit<MaintenanceRequest, 'id'> = {
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: [],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'request-123',
        data: () => mockRequest,
      });

      const result = await maintenanceService.getRequest('request-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('request-123');
      expect(result?.propertyId).toBe(mockRequest.propertyId);
    });

    it('should return null when maintenance request does not exist', async () => {
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await maintenanceService.getRequest('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getRequestsForProperty', () => {
    it('should return all maintenance requests for a property', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          propertyId: 'property-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          category: 'plumbing',
          priority: 'high',
          description: 'Leaking pipe',
          status: 'pending',
          images: [],
          notes: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          id: 'request-2',
          propertyId: 'property-123',
          tenantId: 'tenant-456',
          landlordId: 'landlord-123',
          category: 'electrical',
          priority: 'medium',
          description: 'Light not working',
          status: 'in_progress',
          images: [],
          notes: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      (firestore.getDocs as jest.Mock).mockResolvedValue({
        docs: mockRequests.map((req) => ({
          id: req.id,
          data: () => {
            const { id, ...rest } = req;
            return rest;
          },
        })),
      });

      const result = await maintenanceService.getRequestsForProperty('property-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('request-1');
      expect(result[1].id).toBe('request-2');
    });
  });

  describe('getRequestsForLandlord', () => {
    it('should return all maintenance requests for a landlord', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          propertyId: 'property-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          category: 'plumbing',
          priority: 'high',
          description: 'Leaking pipe',
          status: 'pending',
          images: [],
          notes: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      (firestore.getDocs as jest.Mock).mockResolvedValue({
        docs: mockRequests.map((req) => ({
          id: req.id,
          data: () => {
            const { id, ...rest } = req;
            return rest;
          },
        })),
      });

      const result = await maintenanceService.getRequestsForLandlord('landlord-123');

      expect(result).toHaveLength(1);
      expect(result[0].landlordId).toBe('landlord-123');
    });
  });

  describe('updateRequestStatus', () => {
    it('should update maintenance request status', async () => {
      const mockRequest: MaintenanceRequest = {
        id: 'request-123',
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: [],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'request-123',
          data: () => mockRequest,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'request-123',
          data: () => ({ ...mockRequest, status: 'in_progress' }),
        });

      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await maintenanceService.updateRequestStatus('request-123', 'in_progress');

      expect(result.status).toBe('in_progress');
      expect(firestore.updateDoc).toHaveBeenCalled();
    });

    it('should add note when updating status', async () => {
      const mockRequest: MaintenanceRequest = {
        id: 'request-123',
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: [],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'request-123',
          data: () => mockRequest,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'request-123',
          data: () => ({
            ...mockRequest,
            status: 'in_progress',
            notes: [{ userId: 'landlord-123', note: 'Working on it', createdAt: Timestamp.now() }],
          }),
        });

      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await maintenanceService.updateRequestStatus(
        'request-123',
        'in_progress',
        'Working on it',
        'landlord-123'
      );

      expect(result.status).toBe('in_progress');
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].note).toBe('Working on it');
    });

    it('should throw error when maintenance request not found', async () => {
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await expect(
        maintenanceService.updateRequestStatus('nonexistent-id', 'in_progress')
      ).rejects.toThrow('Maintenance request not found');
    });
  });

  describe('uploadMaintenanceImages', () => {
    it('should upload images when under limit', async () => {
      const mockRequest: MaintenanceRequest = {
        id: 'request-123',
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: [],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'request-123',
        data: () => mockRequest,
      });

      (imageUploadService.uploadImages as jest.Mock).mockResolvedValue([
        'https://storage.example.com/image1.jpg',
        'https://storage.example.com/image2.jpg',
      ]);

      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const mockFiles = [new File([''], 'image1.jpg'), new File([''], 'image2.jpg')];

      const result = await maintenanceService.uploadMaintenanceImages('request-123', mockFiles);

      expect(result).toHaveLength(2);
      expect(imageUploadService.uploadImages).toHaveBeenCalledWith(
        mockFiles,
        'maintenance/request-123',
        2
      );
      expect(firestore.updateDoc).toHaveBeenCalled();
    });

    it('should throw error when exceeding max 3 images', async () => {
      const mockRequest: MaintenanceRequest = {
        id: 'request-123',
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: ['https://storage.example.com/existing1.jpg'],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'request-123',
        data: () => mockRequest,
      });

      const mockFiles = [
        new File([''], 'image1.jpg'),
        new File([''], 'image2.jpg'),
        new File([''], 'image3.jpg'),
      ];

      await expect(
        maintenanceService.uploadMaintenanceImages('request-123', mockFiles)
      ).rejects.toThrow('Only 2 slots available');
    });

    it('should throw error when maintenance request not found', async () => {
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const mockFiles = [new File([''], 'image1.jpg')];

      await expect(
        maintenanceService.uploadMaintenanceImages('nonexistent-id', mockFiles)
      ).rejects.toThrow('Maintenance request not found');
    });
  });

  describe('addNote', () => {
    it('should add a note to maintenance request', async () => {
      const mockRequest: MaintenanceRequest = {
        id: 'request-123',
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: [],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'request-123',
          data: () => mockRequest,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'request-123',
          data: () => ({
            ...mockRequest,
            notes: [
              {
                userId: 'landlord-123',
                note: 'Scheduled for tomorrow',
                createdAt: Timestamp.now(),
              },
            ],
          }),
        });

      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await maintenanceService.addNote(
        'request-123',
        'landlord-123',
        'Scheduled for tomorrow'
      );

      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].note).toBe('Scheduled for tomorrow');
      expect(result.notes[0].userId).toBe('landlord-123');
    });

    it('should throw error when note is empty', async () => {
      const mockRequest: MaintenanceRequest = {
        id: 'request-123',
        propertyId: 'property-123',
        tenantId: 'tenant-123',
        landlordId: 'landlord-123',
        category: 'plumbing',
        priority: 'high',
        description: 'Leaking pipe',
        status: 'pending',
        images: [],
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'request-123',
        data: () => mockRequest,
      });

      await expect(maintenanceService.addNote('request-123', 'landlord-123', '')).rejects.toThrow(
        'Note text is required'
      );
    });
  });
});
