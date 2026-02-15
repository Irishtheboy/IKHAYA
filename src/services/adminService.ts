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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';

/**
 * Admin Service
 * Handles admin-specific operations like landlord approval management
 */
class AdminService {
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
        where('approved', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const landlords: User[] = [];

      querySnapshot.forEach((doc) => {
        landlords.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });

      return landlords;
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
        where('approved', '==', true),
        orderBy('approvedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const landlords: User[] = [];

      querySnapshot.forEach((doc) => {
        landlords.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });

      return landlords;
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
      const q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });

      return users;
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
