import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { User } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';

/**
 * DTO for creating a landlord account
 */
export interface CreateLandlordDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * Admin Service
 * Handles admin-specific operations like landlord approval management
 */
class AdminService {
  /**
   * Create a new landlord account (Admin only)
   *
   * @param landlordData - Data for the new landlord
   * @param adminId - ID of the admin creating the account
   * @returns Promise resolving to the created user
   */
  async createLandlord(landlordData: CreateLandlordDTO, adminId: string): Promise<User> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        landlordData.email,
        landlordData.password
      );

      const userId = userCredential.user.uid;

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        uid: userId,
        email: landlordData.email,
        name: landlordData.name,
        role: 'landlord',
        approved: true, // Auto-approved since created by admin
        approvedBy: adminId,
        approvedAt: serverTimestamp() as Timestamp,
        emailVerified: false,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        disabled: false,
      };

      // Only add phone if provided
      if (landlordData.phone) {
        userData.phone = landlordData.phone;
      }

      await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);

      return {
        id: userId,
        ...userData,
      } as User;
    } catch (error: any) {
      console.error('Error creating landlord:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email address is already in use');
      }
      throw new Error('Failed to create landlord account');
    }
  }

  /**
   * Enable a user account
   *
   * @param userId - ID of the user to enable
   * @returns Promise that resolves when account is enabled
   */
  async enableAccount(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        disabled: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error enabling account:', error);
      throw new Error('Failed to enable account');
    }
  }

  /**
   * Disable a user account
   *
   * @param userId - ID of the user to disable
   * @returns Promise that resolves when account is disabled
   */
  async disableAccount(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        disabled: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error disabling account:', error);
      throw new Error('Failed to disable account');
    }
  }

  /**
   * Get all pending landlord registrations awaiting approval
   *
   * @returns Promise resolving to array of pending landlords
   */
  async getPendingLandlords(): Promise<User[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', 'landlord'),
        where('approved', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const landlords: User[] = [];

      querySnapshot.forEach((doc) => {
        landlords.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });

      // Sort by createdAt in memory
      return landlords.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching pending landlords:', error);
      throw new Error('Failed to fetch pending landlords');
    }
  }

  /**
   * Get all approved landlords
   *
   * @returns Promise resolving to array of approved landlords
   */
  async getApprovedLandlords(): Promise<User[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', 'landlord'),
        where('approved', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const landlords: User[] = [];

      querySnapshot.forEach((doc) => {
        landlords.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });

      // Sort by approvedAt in memory
      return landlords.sort((a, b) => {
        const aTime = a.approvedAt?.toMillis?.() || 0;
        const bTime = b.approvedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching approved landlords:', error);
      throw new Error('Failed to fetch approved landlords');
    }
  }

  /**
   * Approve a landlord registration
   *
   * @param landlordId - ID of the landlord to approve
   * @param adminId - ID of the admin approving the landlord
   * @returns Promise that resolves when approval is complete
   */
  async approveLandlord(landlordId: string, adminId: string): Promise<void> {
    try {
      const landlordRef = doc(db, COLLECTIONS.USERS, landlordId);

      await updateDoc(landlordRef, {
        approved: true,
        approvedBy: adminId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error approving landlord:', error);
      throw new Error('Failed to approve landlord');
    }
  }

  /**
   * Reject/revoke a landlord's approval
   *
   * @param landlordId - ID of the landlord to reject
   * @returns Promise that resolves when rejection is complete
   */
  async rejectLandlord(landlordId: string): Promise<void> {
    try {
      const landlordRef = doc(db, COLLECTIONS.USERS, landlordId);

      await updateDoc(landlordRef, {
        approved: false,
        approvedBy: null,
        approvedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error rejecting landlord:', error);
      throw new Error('Failed to reject landlord');
    }
  }

  /**
   * Get all users (for admin user management)
   *
   * @returns Promise resolving to array of all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, COLLECTIONS.USERS));

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });

      // Sort by createdAt in memory
      return users.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get statistics for admin dashboard
   *
   * @returns Promise resolving to dashboard statistics
   */
  async getDashboardStats(): Promise<{
    pendingLandlords: number;
    approvedLandlords: number;
    totalTenants: number;
    totalUsers: number;
  }> {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));

      let pendingLandlords = 0;
      let approvedLandlords = 0;
      let totalTenants = 0;

      usersSnapshot.forEach((doc) => {
        const user = doc.data() as User;
        if (user.role === 'landlord') {
          if (user.approved) {
            approvedLandlords++;
          } else {
            pendingLandlords++;
          }
        } else if (user.role === 'tenant') {
          totalTenants++;
        }
      });

      return {
        pendingLandlords,
        approvedLandlords,
        totalTenants,
        totalUsers: usersSnapshot.size,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;
