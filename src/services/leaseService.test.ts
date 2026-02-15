import { leaseService, LeaseDTO } from './leaseService';
import { Lease, LeaseStatus } from '../types/firebase';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {},
}));

const mockDocRef = { id: 'test-lease-id' };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => mockDocRef),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
    })),
  },
}));

describe('LeaseService', () => {
  const mockLeaseData: LeaseDTO = {
    propertyId: 'property-123',
    landlordId: 'landlord-123',
    tenantId: 'tenant-123',
    rentAmount: 5000,
    deposit: 10000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    terms: 'Standard lease terms and conditions',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLease', () => {
    it('should create a new lease with valid data', async () => {
      const { setDoc, doc, collection } = require('firebase/firestore');
      
      // Mock collection to return an object
      collection.mockReturnValue({ _type: 'collection' });
      
      // Mock doc to return a reference with an id
      doc.mockReturnValue(mockDocRef);
      
      // Mock setDoc to resolve successfully
      setDoc.mockResolvedValue(undefined);

      const lease = await leaseService.createLease(mockLeaseData);

      expect(lease).toBeDefined();
      expect(lease.id).toBe('test-lease-id');
      expect(lease.propertyId).toBe(mockLeaseData.propertyId);
      expect(lease.landlordId).toBe(mockLeaseData.landlordId);
      expect(lease.tenantId).toBe(mockLeaseData.tenantId);
      expect(lease.rentAmount).toBe(mockLeaseData.rentAmount);
      expect(lease.deposit).toBe(mockLeaseData.deposit);
      expect(lease.status).toBe('draft');
      expect(setDoc).toHaveBeenCalled();
    });

    it('should throw error if property ID is missing', async () => {
      const invalidData = { ...mockLeaseData, propertyId: '' };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'Property ID is required'
      );
    });

    it('should throw error if landlord ID is missing', async () => {
      const invalidData = { ...mockLeaseData, landlordId: '' };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'Landlord ID is required'
      );
    });

    it('should throw error if tenant ID is missing', async () => {
      const invalidData = { ...mockLeaseData, tenantId: '' };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'Tenant ID is required'
      );
    });

    it('should throw error if rent amount is zero or negative', async () => {
      const invalidData = { ...mockLeaseData, rentAmount: 0 };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'Rent amount must be greater than zero'
      );
    });

    it('should throw error if deposit is negative', async () => {
      const invalidData = { ...mockLeaseData, deposit: -100 };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'Deposit must be a non-negative number'
      );
    });

    it('should throw error if end date is before start date', async () => {
      const invalidData = {
        ...mockLeaseData,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'End date must be after start date'
      );
    });

    it('should throw error if terms are missing', async () => {
      const invalidData = { ...mockLeaseData, terms: '' };

      await expect(leaseService.createLease(invalidData)).rejects.toThrow(
        'Lease terms are required'
      );
    });
  });

  describe('getLease', () => {
    it('should return lease when it exists', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        id: 'lease-123',
        data: () => ({
          propertyId: 'property-123',
          landlordId: 'landlord-123',
          tenantId: 'tenant-123',
          rentAmount: 5000,
          deposit: 10000,
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          endDate: Timestamp.fromDate(new Date('2024-12-31')),
          terms: 'Standard lease terms',
          status: 'active',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);

      const lease = await leaseService.getLease('lease-123');

      expect(lease).toBeDefined();
      expect(lease?.id).toBe('lease-123');
      expect(lease?.propertyId).toBe('property-123');
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null when lease does not exist', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      const lease = await leaseService.getLease('non-existent-id');

      expect(lease).toBeNull();
    });
  });

  describe('signLease', () => {
    it('should allow landlord to sign lease', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        id: 'lease-123',
        data: () => ({
          propertyId: 'property-123',
          landlordId: 'landlord-123',
          tenantId: 'tenant-123',
          rentAmount: 5000,
          deposit: 10000,
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          endDate: Timestamp.fromDate(new Date('2024-12-31')),
          terms: 'Standard lease terms',
          status: 'draft',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);
      updateDoc.mockResolvedValue(undefined);

      const signedLease = await leaseService.signLease(
        'lease-123',
        'landlord-123',
        'landlord-signature-data'
      );

      expect(updateDoc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
    });

    it('should allow tenant to sign lease', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        id: 'lease-123',
        data: () => ({
          propertyId: 'property-123',
          landlordId: 'landlord-123',
          tenantId: 'tenant-123',
          rentAmount: 5000,
          deposit: 10000,
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          endDate: Timestamp.fromDate(new Date('2024-12-31')),
          terms: 'Standard lease terms',
          status: 'pending_signatures',
          landlordSignature: 'landlord-signature-data',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);
      updateDoc.mockResolvedValue(undefined);

      await leaseService.signLease('lease-123', 'tenant-123', 'tenant-signature-data');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if lease not found', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      await expect(
        leaseService.signLease('non-existent-id', 'landlord-123', 'signature')
      ).rejects.toThrow('Lease not found');
    });

    it('should throw error if user is not authorized', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        data: () => ({
          landlordId: 'landlord-123',
          tenantId: 'tenant-123',
          status: 'draft',
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);

      await expect(
        leaseService.signLease('lease-123', 'unauthorized-user', 'signature')
      ).rejects.toThrow('User is not authorized to sign this lease');
    });

    it('should throw error if landlord already signed', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        data: () => ({
          landlordId: 'landlord-123',
          tenantId: 'tenant-123',
          landlordSignature: 'existing-signature',
          status: 'pending_signatures',
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);

      await expect(
        leaseService.signLease('lease-123', 'landlord-123', 'new-signature')
      ).rejects.toThrow('Landlord has already signed this lease');
    });
  });

  describe('terminateLease', () => {
    it('should terminate an active lease', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        id: 'lease-123',
        data: () => ({
          propertyId: 'property-123',
          landlordId: 'landlord-123',
          tenantId: 'tenant-123',
          status: 'active',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);
      updateDoc.mockResolvedValue(undefined);

      await leaseService.terminateLease('lease-123', 'Early termination');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if lease is not active', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockLeaseDoc = {
        exists: () => true,
        data: () => ({
          status: 'draft',
        }),
      };

      getDoc.mockResolvedValue(mockLeaseDoc);

      await expect(leaseService.terminateLease('lease-123')).rejects.toThrow(
        'Only active leases can be terminated'
      );
    });

    it('should throw error if lease not found', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      await expect(leaseService.terminateLease('non-existent-id')).rejects.toThrow(
        'Lease not found'
      );
    });
  });

  describe('getActiveLeasesForLandlord', () => {
    it('should return active leases for landlord', async () => {
      const { getDocs } = require('firebase/firestore');
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'lease-1',
            data: () => ({
              propertyId: 'property-1',
              landlordId: 'landlord-123',
              tenantId: 'tenant-1',
              status: 'active',
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
            }),
          },
          {
            id: 'lease-2',
            data: () => ({
              propertyId: 'property-2',
              landlordId: 'landlord-123',
              tenantId: 'tenant-2',
              status: 'active',
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
            }),
          },
        ],
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const leases = await leaseService.getActiveLeasesForLandlord('landlord-123');

      expect(leases).toHaveLength(2);
      expect(leases[0].id).toBe('lease-1');
      expect(leases[1].id).toBe('lease-2');
    });
  });

  describe('getActiveLeasesForTenant', () => {
    it('should return active leases for tenant', async () => {
      const { getDocs } = require('firebase/firestore');
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'lease-1',
            data: () => ({
              propertyId: 'property-1',
              landlordId: 'landlord-1',
              tenantId: 'tenant-123',
              status: 'active',
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
            }),
          },
        ],
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const leases = await leaseService.getActiveLeasesForTenant('tenant-123');

      expect(leases).toHaveLength(1);
      expect(leases[0].tenantId).toBe('tenant-123');
    });
  });

  describe('checkExpiringLeases', () => {
    it('should return leases expiring within 30 days', async () => {
      const { getDocs } = require('firebase/firestore');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'lease-1',
            data: () => ({
              propertyId: 'property-1',
              landlordId: 'landlord-1',
              tenantId: 'tenant-1',
              status: 'active',
              endDate: Timestamp.fromDate(futureDate),
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
            }),
          },
        ],
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const expiringLeases = await leaseService.checkExpiringLeases();

      expect(expiringLeases).toHaveLength(1);
      expect(expiringLeases[0].status).toBe('active');
    });
  });
});
