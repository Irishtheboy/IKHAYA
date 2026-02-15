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
import { Lead, LeadStatus, Message } from '../types/firebase';
import { COLLECTIONS, getCollectionPath } from '../types/firestore-schema';

/**
 * Data Transfer Object for lead creation
 */
export interface CreateLeadDTO {
  tenantId: string;
  propertyId: string;
  landlordId: string;
  initialMessage: string;
}

/**
 * Data Transfer Object for sending messages
 */
export interface SendMessageDTO {
  leadId: string;
  senderId: string;
  content: string;
}

/**
 * Lead Service
 * Handles lead management and messaging between tenants and landlords
 */
class LeadService {
  /**
   * Create a new lead (tenant inquiry)
   *
   * @param leadData - Lead creation data
   * @returns Promise resolving to the created lead
   * @throws Error if creation fails
   */
  async createLead(leadData: CreateLeadDTO): Promise<Lead> {
    try {
      // Validate lead data
      this.validateLeadData(leadData);

      // Create new document reference with auto-generated ID
      const leadRef = doc(collection(db, COLLECTIONS.LEADS));

      // Prepare lead document
      const leadDoc: Omit<Lead, 'id'> = {
        tenantId: leadData.tenantId,
        propertyId: leadData.propertyId,
        landlordId: leadData.landlordId,
        status: 'new',
        initialMessage: leadData.initialMessage,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(leadRef, leadDoc);

      // Return lead with ID
      const lead: Lead = {
        id: leadRef.id,
        ...leadDoc,
        createdAt: leadDoc.createdAt,
        updatedAt: leadDoc.updatedAt,
      };

      return lead;
    } catch (error: any) {
      console.error('Error creating lead:', error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }
  }

  /**
   * Get all leads for a specific property
   *
   * @param propertyId - ID of the property
   * @returns Promise resolving to array of leads
   */
  async getLeadsForProperty(propertyId: string): Promise<Lead[]> {
    try {
      const leadsQuery = query(
        collection(db, COLLECTIONS.LEADS),
        where('propertyId', '==', propertyId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(leadsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lead, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching leads for property:', error);
      throw new Error(`Failed to fetch leads for property: ${error.message}`);
    }
  }

  /**
   * Get all leads for a specific landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of leads
   */
  async getLeadsForLandlord(landlordId: string): Promise<Lead[]> {
    try {
      const leadsQuery = query(
        collection(db, COLLECTIONS.LEADS),
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(leadsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lead, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching leads for landlord:', error);
      throw new Error(`Failed to fetch leads for landlord: ${error.message}`);
    }
  }

  /**
   * Get all leads for a specific tenant
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to array of leads
   */
  async getLeadsForTenant(tenantId: string): Promise<Lead[]> {
    try {
      const leadsQuery = query(
        collection(db, COLLECTIONS.LEADS),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(leadsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lead, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching leads for tenant:', error);
      throw new Error(`Failed to fetch leads for tenant: ${error.message}`);
    }
  }

  /**
   * Get a single lead by ID
   *
   * @param leadId - ID of the lead
   * @returns Promise resolving to the lead or null if not found
   */
  async getLead(leadId: string): Promise<Lead | null> {
    try {
      const leadRef = doc(db, COLLECTIONS.LEADS, leadId);
      const leadSnap = await getDoc(leadRef);

      if (!leadSnap.exists()) {
        return null;
      }

      const leadData = leadSnap.data() as Omit<Lead, 'id'>;
      return {
        id: leadSnap.id,
        ...leadData,
      };
    } catch (error: any) {
      console.error('Error fetching lead:', error);
      throw new Error(`Failed to fetch lead: ${error.message}`);
    }
  }

  /**
   * Update lead status
   *
   * @param leadId - ID of the lead
   * @param status - New status
   * @returns Promise resolving to updated lead
   * @throws Error if update fails or lead not found
   */
  async updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead> {
    try {
      const leadRef = doc(db, COLLECTIONS.LEADS, leadId);

      // Check if lead exists
      const leadSnap = await getDoc(leadRef);
      if (!leadSnap.exists()) {
        throw new Error('Lead not found');
      }

      // Update status
      await updateDoc(leadRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Fetch and return updated lead
      const updatedSnap = await getDoc(leadRef);
      const leadData = updatedSnap.data() as Omit<Lead, 'id'>;

      return {
        id: updatedSnap.id,
        ...leadData,
      };
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      throw new Error(`Failed to update lead status: ${error.message}`);
    }
  }

  /**
   * Send a message in a lead conversation
   *
   * @param messageData - Message data
   * @returns Promise resolving to the created message
   * @throws Error if message creation fails
   */
  async sendMessage(messageData: SendMessageDTO): Promise<Message> {
    try {
      // Validate message data
      this.validateMessageData(messageData);

      // Check if lead exists
      const leadRef = doc(db, COLLECTIONS.LEADS, messageData.leadId);
      const leadSnap = await getDoc(leadRef);
      if (!leadSnap.exists()) {
        throw new Error('Lead not found');
      }

      // Create message in subcollection
      const messagesCollectionPath = getCollectionPath.messages(messageData.leadId);
      const messageRef = doc(collection(db, messagesCollectionPath));

      // Prepare message document
      const messageDoc: Omit<Message, 'id'> = {
        senderId: messageData.senderId,
        content: messageData.content,
        read: false,
        createdAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(messageRef, messageDoc);

      // Update lead's updatedAt timestamp
      await updateDoc(leadRef, {
        updatedAt: serverTimestamp(),
      });

      // Return message with ID
      const message: Message = {
        id: messageRef.id,
        ...messageDoc,
        createdAt: messageDoc.createdAt,
      };

      return message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get all messages for a lead
   *
   * @param leadId - ID of the lead
   * @returns Promise resolving to array of messages in chronological order
   */
  async getMessages(leadId: string): Promise<Message[]> {
    try {
      // Check if lead exists
      const leadRef = doc(db, COLLECTIONS.LEADS, leadId);
      const leadSnap = await getDoc(leadRef);
      if (!leadSnap.exists()) {
        throw new Error('Lead not found');
      }

      // Query messages subcollection
      const messagesCollectionPath = getCollectionPath.messages(leadId);
      const messagesQuery = query(
        collection(db, messagesCollectionPath),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(messagesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Message, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  /**
   * Mark a message as read
   *
   * @param leadId - ID of the lead
   * @param messageId - ID of the message
   * @returns Promise that resolves when message is marked as read
   */
  async markMessageAsRead(leadId: string, messageId: string): Promise<void> {
    try {
      const messagesCollectionPath = getCollectionPath.messages(leadId);
      const messageRef = doc(db, messagesCollectionPath, messageId);

      // Check if message exists
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        throw new Error('Message not found');
      }

      // Update read status
      await updateDoc(messageRef, {
        read: true,
      });
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  /**
   * Get unread message count for a lead
   *
   * @param leadId - ID of the lead
   * @param userId - ID of the user (to exclude their own messages)
   * @returns Promise resolving to count of unread messages
   */
  async getUnreadMessageCount(leadId: string, userId: string): Promise<number> {
    try {
      const messagesCollectionPath = getCollectionPath.messages(leadId);
      const unreadQuery = query(
        collection(db, messagesCollectionPath),
        where('read', '==', false),
        where('senderId', '!=', userId)
      );

      const querySnapshot = await getDocs(unreadQuery);
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error getting unread message count:', error);
      throw new Error(`Failed to get unread message count: ${error.message}`);
    }
  }

  /**
   * Validate lead data
   *
   * @param leadData - Lead data to validate
   * @throws Error if validation fails
   */
  private validateLeadData(leadData: CreateLeadDTO): void {
    if (!leadData.tenantId || leadData.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (!leadData.propertyId || leadData.propertyId.trim().length === 0) {
      throw new Error('Property ID is required');
    }

    if (!leadData.landlordId || leadData.landlordId.trim().length === 0) {
      throw new Error('Landlord ID is required');
    }

    if (!leadData.initialMessage || leadData.initialMessage.trim().length === 0) {
      throw new Error('Initial message is required');
    }

    if (leadData.initialMessage.length > 1000) {
      throw new Error('Initial message must be 1000 characters or less');
    }
  }

  /**
   * Validate message data
   *
   * @param messageData - Message data to validate
   * @throws Error if validation fails
   */
  private validateMessageData(messageData: SendMessageDTO): void {
    if (!messageData.leadId || messageData.leadId.trim().length === 0) {
      throw new Error('Lead ID is required');
    }

    if (!messageData.senderId || messageData.senderId.trim().length === 0) {
      throw new Error('Sender ID is required');
    }

    if (!messageData.content || messageData.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    if (messageData.content.length > 1000) {
      throw new Error('Message content must be 1000 characters or less');
    }
  }
}

// Export singleton instance
export const leadService = new LeadService();
export default leadService;
