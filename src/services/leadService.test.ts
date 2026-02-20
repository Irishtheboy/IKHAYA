import { leadService, CreateLeadDTO, SendMessageDTO } from './leadService';
import { Lead, LeadStatus, Message } from '../types/firebase';
import { Timestamp } from 'firebase/firestore';

import * as firestore from 'firebase/firestore';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
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
      seconds: date.getTime() / 1000,
      nanoseconds: 0,
    })),
    now: jest.fn(() => ({
      seconds: Date.now() / 1000,
      nanoseconds: 0,
    })),
  },
}));

describe('LeadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a new lead with valid data', async () => {
      const leadData: CreateLeadDTO = {
        tenantId: 'tenant123',
        propertyId: 'property123',
        landlordId: 'landlord123',
        initialMessage: 'I am interested in this property',
      };

      const mockLeadRef = { id: 'lead123' };
      (firestore.collection as jest.Mock).mockReturnValue({});
      (firestore.doc as jest.Mock).mockReturnValue(mockLeadRef);
      (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await leadService.createLead(leadData);

      expect(result).toMatchObject({
        id: 'lead123',
        tenantId: 'tenant123',
        propertyId: 'property123',
        landlordId: 'landlord123',
        status: 'new',
        initialMessage: 'I am interested in this property',
      });
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should throw error if tenant ID is missing', async () => {
      const leadData: CreateLeadDTO = {
        tenantId: '',
        propertyId: 'property123',
        landlordId: 'landlord123',
        initialMessage: 'Test message',
      };

      await expect(leadService.createLead(leadData)).rejects.toThrow('Tenant ID is required');
    });

    it('should throw error if property ID is missing', async () => {
      const leadData: CreateLeadDTO = {
        tenantId: 'tenant123',
        propertyId: '',
        landlordId: 'landlord123',
        initialMessage: 'Test message',
      };

      await expect(leadService.createLead(leadData)).rejects.toThrow('Property ID is required');
    });

    it('should throw error if initial message is missing', async () => {
      const leadData: CreateLeadDTO = {
        tenantId: 'tenant123',
        propertyId: 'property123',
        landlordId: 'landlord123',
        initialMessage: '',
      };

      await expect(leadService.createLead(leadData)).rejects.toThrow('Initial message is required');
    });

    it('should throw error if initial message exceeds 1000 characters', async () => {
      const leadData: CreateLeadDTO = {
        tenantId: 'tenant123',
        propertyId: 'property123',
        landlordId: 'landlord123',
        initialMessage: 'a'.repeat(1001),
      };

      await expect(leadService.createLead(leadData)).rejects.toThrow(
        'Initial message must be 1000 characters or less'
      );
    });
  });

  describe('getLeadsForProperty', () => {
    it('should return leads for a specific property', async () => {
      const mockLeads = [
        {
          id: 'lead1',
          tenantId: 'tenant1',
          propertyId: 'property123',
          landlordId: 'landlord1',
          status: 'new' as LeadStatus,
          initialMessage: 'Message 1',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          id: 'lead2',
          tenantId: 'tenant2',
          propertyId: 'property123',
          landlordId: 'landlord1',
          status: 'contacted' as LeadStatus,
          initialMessage: 'Message 2',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      const mockDocs = mockLeads.map((lead) => ({
        id: lead.id,
        data: () => {
          const { id, ...rest } = lead;
          return rest;
        },
      }));

      (firestore.collection as jest.Mock).mockReturnValue({});
      (firestore.query as jest.Mock).mockReturnValue({});
      (firestore.where as jest.Mock).mockReturnValue({});
      (firestore.orderBy as jest.Mock).mockReturnValue({});
      (firestore.getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const result = await leadService.getLeadsForProperty('property123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('lead1');
      expect(result[1].id).toBe('lead2');
    });
  });

  describe('getLeadsForLandlord', () => {
    it('should return leads for a specific landlord', async () => {
      const mockLeads = [
        {
          id: 'lead1',
          tenantId: 'tenant1',
          propertyId: 'property1',
          landlordId: 'landlord123',
          status: 'new' as LeadStatus,
          initialMessage: 'Message 1',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      const mockDocs = mockLeads.map((lead) => ({
        id: lead.id,
        data: () => {
          const { id, ...rest } = lead;
          return rest;
        },
      }));

      (firestore.collection as jest.Mock).mockReturnValue({});
      (firestore.query as jest.Mock).mockReturnValue({});
      (firestore.where as jest.Mock).mockReturnValue({});
      (firestore.orderBy as jest.Mock).mockReturnValue({});
      (firestore.getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const result = await leadService.getLeadsForLandlord('landlord123');

      expect(result).toHaveLength(1);
      expect(result[0].landlordId).toBe('landlord123');
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead status successfully', async () => {
      const mockLead = {
        tenantId: 'tenant1',
        propertyId: 'property1',
        landlordId: 'landlord1',
        status: 'contacted' as LeadStatus,
        initialMessage: 'Test',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const mockLeadRef = { id: 'lead123' };
      (firestore.doc as jest.Mock).mockReturnValue(mockLeadRef);
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'lead123',
        data: () => mockLead,
      });
      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await leadService.updateLeadStatus('lead123', 'contacted');

      expect(result.status).toBe('contacted');
      expect(firestore.updateDoc).toHaveBeenCalled();
    });

    it('should throw error if lead not found', async () => {
      (firestore.doc as jest.Mock).mockReturnValue({ id: 'lead123' });
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await expect(leadService.updateLeadStatus('lead123', 'contacted')).rejects.toThrow(
        'Lead not found'
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const messageData: SendMessageDTO = {
        leadId: 'lead123',
        senderId: 'user123',
        content: 'Hello, is this property still available?',
      };

      const mockLeadRef = { id: 'lead123' };
      const mockMessageRef = { id: 'message123' };

      (firestore.doc as jest.Mock).mockReturnValue(mockLeadRef);
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
      });
      (firestore.collection as jest.Mock).mockReturnValue({});
      (firestore.doc as jest.Mock).mockReturnValue(mockMessageRef);
      (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);
      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await leadService.sendMessage(messageData);

      expect(result).toMatchObject({
        id: 'message123',
        senderId: 'user123',
        content: 'Hello, is this property still available?',
        read: false,
      });
      expect(firestore.setDoc).toHaveBeenCalled();
      expect(firestore.updateDoc).toHaveBeenCalled();
    });

    it('should throw error if lead not found', async () => {
      const messageData: SendMessageDTO = {
        leadId: 'lead123',
        senderId: 'user123',
        content: 'Test message',
      };

      (firestore.doc as jest.Mock).mockReturnValue({ id: 'lead123' });
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await expect(leadService.sendMessage(messageData)).rejects.toThrow('Lead not found');
    });

    it('should throw error if message content is empty', async () => {
      const messageData: SendMessageDTO = {
        leadId: 'lead123',
        senderId: 'user123',
        content: '',
      };

      await expect(leadService.sendMessage(messageData)).rejects.toThrow(
        'Message content is required'
      );
    });

    it('should throw error if message content exceeds 1000 characters', async () => {
      const messageData: SendMessageDTO = {
        leadId: 'lead123',
        senderId: 'user123',
        content: 'a'.repeat(1001),
      };

      await expect(leadService.sendMessage(messageData)).rejects.toThrow(
        'Message content must be 1000 characters or less'
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages for a lead in chronological order', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          senderId: 'user1',
          content: 'First message',
          read: false,
          createdAt: Timestamp.now(),
        },
        {
          id: 'msg2',
          senderId: 'user2',
          content: 'Second message',
          read: true,
          createdAt: Timestamp.now(),
        },
      ];

      const mockDocs = mockMessages.map((msg) => ({
        id: msg.id,
        data: () => {
          const { id, ...rest } = msg;
          return rest;
        },
      }));

      (firestore.doc as jest.Mock).mockReturnValue({ id: 'lead123' });
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
      });
      (firestore.collection as jest.Mock).mockReturnValue({});
      (firestore.query as jest.Mock).mockReturnValue({});
      (firestore.orderBy as jest.Mock).mockReturnValue({});
      (firestore.getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const result = await leadService.getMessages('lead123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('First message');
      expect(result[1].content).toBe('Second message');
    });

    it('should throw error if lead not found', async () => {
      (firestore.doc as jest.Mock).mockReturnValue({ id: 'lead123' });
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await expect(leadService.getMessages('lead123')).rejects.toThrow('Lead not found');
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      (firestore.doc as jest.Mock).mockReturnValue({ id: 'message123' });
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
      });
      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      await leadService.markMessageAsRead('lead123', 'message123');

      expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { read: true });
    });

    it('should throw error if message not found', async () => {
      (firestore.doc as jest.Mock).mockReturnValue({ id: 'message123' });
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await expect(leadService.markMessageAsRead('lead123', 'message123')).rejects.toThrow(
        'Message not found'
      );
    });
  });
});
