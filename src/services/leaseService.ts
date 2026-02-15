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
import { Lease, LeaseStatus } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';

/**
 * Data Transfer Object for lease creation
 */
export interface LeaseDTO {
  propertyId: string;
  landlordId: string;
  tenantId: string;
  rentAmount: number;
  deposit: number;
  startDate: Date;
  endDate: Date;
  terms: string;
}

/**
 * Lease Service
 * Handles lease agreement management including creation, signatures, and status tracking
 */
class LeaseService {
  /**
   * Create a new lease agreement
   *
   * @param leaseData - Lease creation data
   * @returns Promise resolving to the created lease
   * @throws Error if creation fails
   */
  async createLease(leaseData: LeaseDTO): Promise<Lease> {
    try {
      // Validate lease data
      this.validateLeaseData(leaseData);

      // Create new document reference with auto-generated ID
      const leaseRef = doc(collection(db, COLLECTIONS.LEASES));

      // Prepare lease document
      const leaseDoc: Omit<Lease, 'id'> = {
        propertyId: leaseData.propertyId,
        landlordId: leaseData.landlordId,
        tenantId: leaseData.tenantId,
        rentAmount: leaseData.rentAmount,
        deposit: leaseData.deposit,
        startDate: Timestamp.fromDate(leaseData.startDate),
        endDate: Timestamp.fromDate(leaseData.endDate),
        terms: leaseData.terms,
        status: 'draft',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(leaseRef, leaseDoc);

      // Return lease with ID
      const lease: Lease = {
        id: leaseRef.id,
        ...leaseDoc,
        createdAt: leaseDoc.createdAt,
        updatedAt: leaseDoc.updatedAt,
      };

      return lease;
    } catch (error: any) {
      console.error('Error creating lease:', error);
      throw new Error(`Failed to create lease: ${error.message}`);
    }
  }

  /**
   * Get a single lease by ID
   *
   * @param leaseId - ID of the lease
   * @returns Promise resolving to the lease or null if not found
   */
  async getLease(leaseId: string): Promise<Lease | null> {
    try {
      const leaseRef = doc(db, COLLECTIONS.LEASES, leaseId);
      const leaseSnap = await getDoc(leaseRef);

      if (!leaseSnap.exists()) {
        return null;
      }

      const leaseData = leaseSnap.data() as Omit<Lease, 'id'>;
      return {
        id: leaseSnap.id,
        ...leaseData,
      };
    } catch (error: any) {
      console.error('Error fetching lease:', error);
      throw new Error(`Failed to fetch lease: ${error.message}`);
    }
  }

  /**
   * Sign a lease agreement
   *
   * @param leaseId - ID of the lease
   * @param userId - ID of the user signing (landlord or tenant)
   * @param signature - Digital signature string
   * @returns Promise resolving to updated lease
   * @throws Error if signing fails or lease not found
   */
  async signLease(leaseId: string, userId: string, signature: string): Promise<Lease> {
    try {
      const leaseRef = doc(db, COLLECTIONS.LEASES, leaseId);

      // Check if lease exists
      const leaseSnap = await getDoc(leaseRef);
      if (!leaseSnap.exists()) {
        throw new Error('Lease not found');
      }

      const lease = leaseSnap.data() as Lease;

      // Validate signature
      if (!signature || signature.trim().length === 0) {
        throw new Error('Signature is required');
      }

      // Determine which signature to update
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (userId === lease.landlordId) {
        if (lease.landlordSignature) {
          throw new Error('Landlord has already signed this lease');
        }
        updateData.landlordSignature = signature;
      } else if (userId === lease.tenantId) {
        if (lease.tenantSignature) {
          throw new Error('Tenant has already signed this lease');
        }
        updateData.tenantSignature = signature;
      } else {
        throw new Error('User is not authorized to sign this lease');
      }

      // Update lease status to pending_signatures if it's still a draft
      if (lease.status === 'draft') {
        updateData.status = 'pending_signatures';
      }

      // Update document
      await updateDoc(leaseRef, updateData);

      // Fetch and return updated lease
      const updatedSnap = await getDoc(leaseRef);
      const leaseData = updatedSnap.data() as Omit<Lease, 'id'>;

      return {
        id: updatedSnap.id,
        ...leaseData,
      };
    } catch (error: any) {
      console.error('Error signing lease:', error);
      throw new Error(`Failed to sign lease: ${error.message}`);
    }
  }

  /**
   * Terminate a lease agreement
   *
   * @param leaseId - ID of the lease
   * @returns Promise resolving to updated lease
   * @throws Error if termination fails or lease not found
   */
  async terminateLease(leaseId: string): Promise<Lease> {
    try {
      const leaseRef = doc(db, COLLECTIONS.LEASES, leaseId);

      // Check if lease exists
      const leaseSnap = await getDoc(leaseRef);
      if (!leaseSnap.exists()) {
        throw new Error('Lease not found');
      }

      const lease = leaseSnap.data() as Lease;

      // Only active leases can be terminated
      if (lease.status !== 'active') {
        throw new Error('Only active leases can be terminated');
      }

      // Update lease status
      await updateDoc(leaseRef, {
        status: 'terminated',
        updatedAt: serverTimestamp(),
      });

      // Fetch and return updated lease
      const updatedSnap = await getDoc(leaseRef);
      const leaseData = updatedSnap.data() as Omit<Lease, 'id'>;

      return {
        id: updatedSnap.id,
        ...leaseData,
      };
    } catch (error: any) {
      console.error('Error terminating lease:', error);
      throw new Error(`Failed to terminate lease: ${error.message}`);
    }
  }

  /**
   * Get all active leases for a specific landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of active leases
   */
  async getActiveLeasesForLandlord(landlordId: string): Promise<Lease[]> {
    try {
      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('landlordId', '==', landlordId),
        where('status', '==', 'active'),
        orderBy('endDate', 'asc')
      );

      const querySnapshot = await getDocs(leasesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lease, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching active leases for landlord:', error);
      throw new Error(`Failed to fetch active leases for landlord: ${error.message}`);
    }
  }

  /**
   * Get all active leases for a specific tenant
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to array of active leases
   */
  async getActiveLeasesForTenant(tenantId: string): Promise<Lease[]> {
    try {
      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('tenantId', '==', tenantId),
        where('status', '==', 'active'),
        orderBy('endDate', 'asc')
      );

      const querySnapshot = await getDocs(leasesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lease, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching active leases for tenant:', error);
      throw new Error(`Failed to fetch active leases for tenant: ${error.message}`);
    }
  }

  /**
   * Get all leases for a specific landlord (all statuses)
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of leases
   */
  async getLeasesForLandlord(landlordId: string): Promise<Lease[]> {
    try {
      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(leasesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lease, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching leases for landlord:', error);
      throw new Error(`Failed to fetch leases for landlord: ${error.message}`);
    }
  }

  /**
   * Get all leases for a specific tenant (all statuses)
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to array of leases
   */
  async getLeasesForTenant(tenantId: string): Promise<Lease[]> {
    try {
      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(leasesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lease, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching leases for tenant:', error);
      throw new Error(`Failed to fetch leases for tenant: ${error.message}`);
    }
  }

  /**
   * Get all leases for a specific property
   *
   * @param propertyId - ID of the property
   * @returns Promise resolving to array of leases
   */
  async getLeasesForProperty(propertyId: string): Promise<Lease[]> {
    try {
      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('propertyId', '==', propertyId),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(leasesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lease, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching leases for property:', error);
      throw new Error(`Failed to fetch leases for property: ${error.message}`);
    }
  }

  /**
   * Check for expiring leases (within 30 days)
   *
   * @returns Promise resolving to array of expiring leases
   */
  async checkExpiringLeases(): Promise<Lease[]> {
    try {
      // Calculate date 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('status', '==', 'active'),
        where('endDate', '<=', Timestamp.fromDate(thirtyDaysFromNow)),
        orderBy('endDate', 'asc')
      );

      const querySnapshot = await getDocs(leasesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Lease, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error checking expiring leases:', error);
      throw new Error(`Failed to check expiring leases: ${error.message}`);
    }
  }

  /**
   * Update lease status
   *
   * @param leaseId - ID of the lease
   * @param status - New status
   * @returns Promise resolving to updated lease
   * @throws Error if update fails or lease not found
   */
  async updateLeaseStatus(leaseId: string, status: LeaseStatus): Promise<Lease> {
    try {
      const leaseRef = doc(db, COLLECTIONS.LEASES, leaseId);

      // Check if lease exists
      const leaseSnap = await getDoc(leaseRef);
      if (!leaseSnap.exists()) {
        throw new Error('Lease not found');
      }

      // Update status
      await updateDoc(leaseRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Fetch and return updated lease
      const updatedSnap = await getDoc(leaseRef);
      const leaseData = updatedSnap.data() as Omit<Lease, 'id'>;

      return {
        id: updatedSnap.id,
        ...leaseData,
      };
    } catch (error: any) {
      console.error('Error updating lease status:', error);
      throw new Error(`Failed to update lease status: ${error.message}`);
    }
  }

  /**
   * Validate lease data
   *
   * @param leaseData - Lease data to validate
   * @throws Error if validation fails
   */
  private validateLeaseData(leaseData: LeaseDTO): void {
    if (!leaseData.propertyId || leaseData.propertyId.trim().length === 0) {
      throw new Error('Property ID is required');
    }

    if (!leaseData.landlordId || leaseData.landlordId.trim().length === 0) {
      throw new Error('Landlord ID is required');
    }

    if (!leaseData.tenantId || leaseData.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (leaseData.rentAmount <= 0) {
      throw new Error('Rent amount must be greater than zero');
    }

    if (leaseData.deposit < 0) {
      throw new Error('Deposit must be a non-negative number');
    }

    if (!leaseData.startDate) {
      throw new Error('Start date is required');
    }

    if (!leaseData.endDate) {
      throw new Error('End date is required');
    }

    if (leaseData.endDate <= leaseData.startDate) {
      throw new Error('End date must be after start date');
    }

    if (!leaseData.terms || leaseData.terms.trim().length === 0) {
      throw new Error('Lease terms are required');
    }
  }
}

// Export singleton instance
export const leaseService = new LeaseService();
export default leaseService;
