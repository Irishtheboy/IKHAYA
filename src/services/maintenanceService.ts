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
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceNote,
} from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';
import { imageUploadService } from './imageUploadService';

/**
 * Data Transfer Object for maintenance request creation
 */
export interface MaintenanceRequestDTO {
  propertyId: string;
  tenantId: string;
  landlordId: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
}

/**
 * Maintenance Service
 * Handles maintenance request management including creation, status updates, and image uploads
 */
class MaintenanceService {
  /**
   * Create a new maintenance request
   *
   * @param requestData - Maintenance request data
   * @returns Promise resolving to the created maintenance request
   * @throws Error if creation fails
   */
  async createMaintenanceRequest(
    requestData: MaintenanceRequestDTO
  ): Promise<MaintenanceRequest> {
    try {
      // Validate request data
      this.validateMaintenanceRequestData(requestData);

      // Create new document reference with auto-generated ID
      const maintenanceRef = doc(collection(db, COLLECTIONS.MAINTENANCE));

      // Prepare maintenance request document
      const maintenanceDoc: Omit<MaintenanceRequest, 'id'> = {
        propertyId: requestData.propertyId,
        tenantId: requestData.tenantId,
        landlordId: requestData.landlordId,
        category: requestData.category,
        priority: requestData.priority,
        description: requestData.description,
        status: 'pending',
        images: [],
        notes: [],
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(maintenanceRef, maintenanceDoc);

      // Return maintenance request with ID
      const maintenanceRequest: MaintenanceRequest = {
        id: maintenanceRef.id,
        ...maintenanceDoc,
        createdAt: maintenanceDoc.createdAt,
        updatedAt: maintenanceDoc.updatedAt,
      };

      return maintenanceRequest;
    } catch (error: any) {
      console.error('Error creating maintenance request:', error);
      throw new Error(`Failed to create maintenance request: ${error.message}`);
    }
  }

  /**
   * Get a single maintenance request by ID
   *
   * @param requestId - ID of the maintenance request
   * @returns Promise resolving to the maintenance request or null if not found
   */
  async getRequest(requestId: string): Promise<MaintenanceRequest | null> {
    try {
      const maintenanceRef = doc(db, COLLECTIONS.MAINTENANCE, requestId);
      const maintenanceSnap = await getDoc(maintenanceRef);

      if (!maintenanceSnap.exists()) {
        return null;
      }

      const maintenanceData = maintenanceSnap.data() as Omit<MaintenanceRequest, 'id'>;
      return {
        id: maintenanceSnap.id,
        ...maintenanceData,
      };
    } catch (error: any) {
      console.error('Error fetching maintenance request:', error);
      throw new Error(`Failed to fetch maintenance request: ${error.message}`);
    }
  }

  /**
   * Get all maintenance requests for a specific property
   *
   * @param propertyId - ID of the property
   * @returns Promise resolving to array of maintenance requests
   */
  async getRequestsForProperty(propertyId: string): Promise<MaintenanceRequest[]> {
    try {
      const maintenanceQuery = query(
        collection(db, COLLECTIONS.MAINTENANCE),
        where('propertyId', '==', propertyId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(maintenanceQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<MaintenanceRequest, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching maintenance requests for property:', error);
      throw new Error(`Failed to fetch maintenance requests for property: ${error.message}`);
    }
  }

  /**
   * Get all maintenance requests for a specific landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of maintenance requests
   */
  async getRequestsForLandlord(landlordId: string): Promise<MaintenanceRequest[]> {
    try {
      const maintenanceQuery = query(
        collection(db, COLLECTIONS.MAINTENANCE),
        where('landlordId', '==', landlordId),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(maintenanceQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<MaintenanceRequest, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching maintenance requests for landlord:', error);
      throw new Error(`Failed to fetch maintenance requests for landlord: ${error.message}`);
    }
  }

  /**
   * Get all maintenance requests for a specific tenant
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to array of maintenance requests
   */
  async getRequestsForTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    try {
      const maintenanceQuery = query(
        collection(db, COLLECTIONS.MAINTENANCE),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(maintenanceQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<MaintenanceRequest, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching maintenance requests for tenant:', error);
      throw new Error(`Failed to fetch maintenance requests for tenant: ${error.message}`);
    }
  }

  /**
   * Update maintenance request status
   *
   * @param requestId - ID of the maintenance request
   * @param status - New status
   * @param note - Optional note to add with status update
   * @param userId - ID of the user making the update
   * @returns Promise resolving to updated maintenance request
   * @throws Error if update fails or request not found
   */
  async updateRequestStatus(
    requestId: string,
    status: MaintenanceStatus,
    note?: string,
    userId?: string
  ): Promise<MaintenanceRequest> {
    try {
      const maintenanceRef = doc(db, COLLECTIONS.MAINTENANCE, requestId);

      // Check if request exists
      const maintenanceSnap = await getDoc(maintenanceRef);
      if (!maintenanceSnap.exists()) {
        throw new Error('Maintenance request not found');
      }

      const maintenanceData = maintenanceSnap.data() as MaintenanceRequest;

      // Prepare update data
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      // Add note if provided
      if (note && userId) {
        const newNote: MaintenanceNote = {
          userId,
          note,
          createdAt: Timestamp.now(),
        };
        updateData.notes = [...maintenanceData.notes, newNote];
      }

      // Update document
      await updateDoc(maintenanceRef, updateData);

      // Fetch and return updated maintenance request
      const updatedSnap = await getDoc(maintenanceRef);
      const updatedData = updatedSnap.data() as Omit<MaintenanceRequest, 'id'>;

      return {
        id: updatedSnap.id,
        ...updatedData,
      };
    } catch (error: any) {
      console.error('Error updating maintenance request status:', error);
      throw new Error(`Failed to update maintenance request status: ${error.message}`);
    }
  }

  /**
   * Upload images for a maintenance request (max 3)
   *
   * @param requestId - ID of the maintenance request
   * @param images - Array of image files to upload
   * @returns Promise resolving to array of download URLs
   * @throws Error if upload fails, request not found, or max images exceeded
   */
  async uploadMaintenanceImages(requestId: string, images: File[]): Promise<string[]> {
    try {
      // Check if request exists
      const maintenanceRef = doc(db, COLLECTIONS.MAINTENANCE, requestId);
      const maintenanceSnap = await getDoc(maintenanceRef);

      if (!maintenanceSnap.exists()) {
        throw new Error('Maintenance request not found');
      }

      const maintenanceData = maintenanceSnap.data() as MaintenanceRequest;

      // Enforce max 3 images limit
      const maxImages = 3;
      const currentImageCount = maintenanceData.images?.length || 0;
      const remainingSlots = maxImages - currentImageCount;

      if (images.length > remainingSlots) {
        throw new Error(
          `Cannot upload ${images.length} images. Only ${remainingSlots} slots available (max ${maxImages} images per request).`
        );
      }

      // Upload images to Firebase Storage
      const storagePath = `maintenance/${requestId}`;
      const downloadURLs = await imageUploadService.uploadImages(
        images,
        storagePath,
        images.length
      );

      // Update maintenance request with new image URLs
      const updatedImages = [...(maintenanceData.images || []), ...downloadURLs];
      await updateDoc(maintenanceRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });

      return downloadURLs;
    } catch (error: any) {
      console.error('Error uploading maintenance images:', error);
      throw new Error(`Failed to upload maintenance images: ${error.message}`);
    }
  }

  /**
   * Delete an image from a maintenance request
   *
   * @param requestId - ID of the maintenance request
   * @param imageUrl - URL of the image to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if deletion fails or request not found
   */
  async deleteMaintenanceImage(requestId: string, imageUrl: string): Promise<void> {
    try {
      // Check if request exists
      const maintenanceRef = doc(db, COLLECTIONS.MAINTENANCE, requestId);
      const maintenanceSnap = await getDoc(maintenanceRef);

      if (!maintenanceSnap.exists()) {
        throw new Error('Maintenance request not found');
      }

      const maintenanceData = maintenanceSnap.data() as MaintenanceRequest;

      // Remove image URL from maintenance request
      const updatedImages = (maintenanceData.images || []).filter((url) => url !== imageUrl);

      // Delete image from storage
      await imageUploadService.deleteImage(imageUrl);

      // Update maintenance request
      await updateDoc(maintenanceRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error deleting maintenance image:', error);
      throw new Error(`Failed to delete maintenance image: ${error.message}`);
    }
  }

  /**
   * Add a note to a maintenance request
   *
   * @param requestId - ID of the maintenance request
   * @param userId - ID of the user adding the note
   * @param note - Note text
   * @returns Promise resolving to updated maintenance request
   * @throws Error if update fails or request not found
   */
  async addNote(requestId: string, userId: string, note: string): Promise<MaintenanceRequest> {
    try {
      const maintenanceRef = doc(db, COLLECTIONS.MAINTENANCE, requestId);

      // Check if request exists
      const maintenanceSnap = await getDoc(maintenanceRef);
      if (!maintenanceSnap.exists()) {
        throw new Error('Maintenance request not found');
      }

      const maintenanceData = maintenanceSnap.data() as MaintenanceRequest;

      // Validate note
      if (!note || note.trim().length === 0) {
        throw new Error('Note text is required');
      }

      // Create new note
      const newNote: MaintenanceNote = {
        userId,
        note: note.trim(),
        createdAt: Timestamp.now(),
      };

      // Update document with new note
      await updateDoc(maintenanceRef, {
        notes: [...maintenanceData.notes, newNote],
        updatedAt: serverTimestamp(),
      });

      // Fetch and return updated maintenance request
      const updatedSnap = await getDoc(maintenanceRef);
      const updatedData = updatedSnap.data() as Omit<MaintenanceRequest, 'id'>;

      return {
        id: updatedSnap.id,
        ...updatedData,
      };
    } catch (error: any) {
      console.error('Error adding note to maintenance request:', error);
      throw new Error(`Failed to add note to maintenance request: ${error.message}`);
    }
  }

  /**
   * Validate maintenance request data
   *
   * @param requestData - Maintenance request data to validate
   * @throws Error if validation fails
   */
  private validateMaintenanceRequestData(requestData: MaintenanceRequestDTO): void {
    if (!requestData.propertyId || requestData.propertyId.trim().length === 0) {
      throw new Error('Property ID is required');
    }

    if (!requestData.tenantId || requestData.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (!requestData.landlordId || requestData.landlordId.trim().length === 0) {
      throw new Error('Landlord ID is required');
    }

    if (!requestData.description || requestData.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (requestData.description.length > 2000) {
      throw new Error('Description must be 2000 characters or less');
    }

    // Validate category
    const validCategories: MaintenanceCategory[] = [
      'plumbing',
      'electrical',
      'general',
      'appliance',
      'structural',
    ];
    if (!validCategories.includes(requestData.category)) {
      throw new Error('Invalid maintenance category');
    }

    // Validate priority
    const validPriorities: MaintenancePriority[] = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(requestData.priority)) {
      throw new Error('Invalid maintenance priority');
    }
  }
}

// Export singleton instance
export const maintenanceService = new MaintenanceService();
export default maintenanceService;
