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
import { Subscription, SubscriptionStatus, SubscriptionTier, Property } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';

/**
 * Data Transfer Object for subscription creation
 */
export interface SubscriptionDTO {
  landlordId: string;
  tier: SubscriptionTier;
  durationMonths: number;
  autoRenew?: boolean;
}

/**
 * Subscription Service
 * Handles premium subscription management for landlords
 */
class SubscriptionService {
  /**
   * Create a new subscription for a landlord
   *
   * @param subscriptionData - Subscription details
   * @returns Promise resolving to the created subscription
   * @throws Error if creation fails
   */
  async createSubscription(subscriptionData: SubscriptionDTO): Promise<Subscription> {
    try {
      const { landlordId, tier, durationMonths, autoRenew = false } = subscriptionData;

      // Check if landlord already has an active subscription
      const existingSubscription = await this.getActiveSubscription(landlordId);
      if (existingSubscription) {
        throw new Error('Landlord already has an active subscription');
      }

      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Create new document reference with auto-generated ID
      const subscriptionRef = doc(collection(db, COLLECTIONS.SUBSCRIPTIONS));

      // Prepare subscription document
      const subscriptionDoc: Omit<Subscription, 'id'> = {
        landlordId,
        tier,
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        autoRenew,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(subscriptionRef, subscriptionDoc);

      // If premium subscription, update all landlord's properties
      if (tier === 'premium') {
        await this.updateLandlordPropertiesPremiumStatus(landlordId, true);
      }

      // Return subscription with ID
      const subscription: Subscription = {
        id: subscriptionRef.id,
        ...subscriptionDoc,
        createdAt: subscriptionDoc.createdAt,
        updatedAt: subscriptionDoc.updatedAt,
      };

      return subscription;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Get active subscription for a landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to the active subscription or null
   */
  async getActiveSubscription(landlordId: string): Promise<Subscription | null> {
    try {
      const subscriptionsQuery = query(
        collection(db, COLLECTIONS.SUBSCRIPTIONS),
        where('landlordId', '==', landlordId),
        where('status', '==', 'active'),
        orderBy('endDate', 'desc')
      );

      const querySnapshot = await getDocs(subscriptionsQuery);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data() as Omit<Subscription, 'id'>;

      return {
        id: doc.id,
        ...data,
      };
    } catch (error: any) {
      console.error('Error fetching active subscription:', error);
      throw new Error(`Failed to fetch active subscription: ${error.message}`);
    }
  }

  /**
   * Get subscription by ID
   *
   * @param subscriptionId - ID of the subscription
   * @returns Promise resolving to the subscription or null
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
      const subscriptionSnap = await getDoc(subscriptionRef);

      if (!subscriptionSnap.exists()) {
        return null;
      }

      const data = subscriptionSnap.data() as Omit<Subscription, 'id'>;
      return {
        id: subscriptionSnap.id,
        ...data,
      };
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }
  }

  /**
   * Upgrade a landlord to premium subscription
   *
   * @param landlordId - ID of the landlord
   * @param durationMonths - Duration of the subscription in months
   * @returns Promise resolving to the created subscription
   */
  async upgradeToPremium(landlordId: string, durationMonths: number = 12): Promise<Subscription> {
    return this.createSubscription({
      landlordId,
      tier: 'premium',
      durationMonths,
      autoRenew: false,
    });
  }

  /**
   * Cancel a subscription
   *
   * @param subscriptionId - ID of the subscription to cancel
   * @returns Promise resolving to the updated subscription
   * @throws Error if subscription not found or already cancelled
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
      const subscriptionSnap = await getDoc(subscriptionRef);

      if (!subscriptionSnap.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionSnap.data() as Subscription;

      if (subscription.status === 'cancelled') {
        throw new Error('Subscription is already cancelled');
      }

      // Update subscription status
      await updateDoc(subscriptionRef, {
        status: 'cancelled',
        autoRenew: false,
        updatedAt: serverTimestamp(),
      });

      // If premium subscription, revert properties to standard
      if (subscription.tier === 'premium') {
        await this.updateLandlordPropertiesPremiumStatus(subscription.landlordId, false);
      }

      // Fetch and return updated subscription
      const updatedSnap = await getDoc(subscriptionRef);
      const data = updatedSnap.data() as Omit<Subscription, 'id'>;

      return {
        id: updatedSnap.id,
        ...data,
      };
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Renew a subscription
   *
   * @param subscriptionId - ID of the subscription to renew
   * @param durationMonths - Duration of the renewal in months
   * @returns Promise resolving to the updated subscription
   * @throws Error if subscription not found
   */
  async renewSubscription(
    subscriptionId: string,
    durationMonths: number = 12
  ): Promise<Subscription> {
    try {
      const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
      const subscriptionSnap = await getDoc(subscriptionRef);

      if (!subscriptionSnap.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionSnap.data() as Subscription;

      // Calculate new end date
      const currentEndDate = subscription.endDate.toDate();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      // Update subscription
      await updateDoc(subscriptionRef, {
        status: 'active',
        endDate: Timestamp.fromDate(newEndDate),
        updatedAt: serverTimestamp(),
      });

      // If premium subscription, ensure properties are premium
      if (subscription.tier === 'premium') {
        await this.updateLandlordPropertiesPremiumStatus(subscription.landlordId, true);
      }

      // Fetch and return updated subscription
      const updatedSnap = await getDoc(subscriptionRef);
      const data = updatedSnap.data() as Omit<Subscription, 'id'>;

      return {
        id: updatedSnap.id,
        ...data,
      };
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      throw new Error(`Failed to renew subscription: ${error.message}`);
    }
  }

  /**
   * Check and expire subscriptions that have passed their end date
   * This should be called by a scheduled Cloud Function
   *
   * @returns Promise resolving to array of expired subscription IDs
   */
  async checkAndExpireSubscriptions(): Promise<string[]> {
    try {
      const now = Timestamp.now();
      const expiredIds: string[] = [];

      // Query for active subscriptions that have passed their end date
      const subscriptionsQuery = query(
        collection(db, COLLECTIONS.SUBSCRIPTIONS),
        where('status', '==', 'active'),
        where('endDate', '<=', now)
      );

      const querySnapshot = await getDocs(subscriptionsQuery);

      // Expire each subscription
      for (const docSnap of querySnapshot.docs) {
        const subscription = docSnap.data() as Subscription;

        // Update subscription status
        await updateDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, docSnap.id), {
          status: 'expired',
          updatedAt: serverTimestamp(),
        });

        // If premium subscription, revert properties to standard
        if (subscription.tier === 'premium') {
          await this.updateLandlordPropertiesPremiumStatus(subscription.landlordId, false);
        }

        expiredIds.push(docSnap.id);
      }

      return expiredIds;
    } catch (error: any) {
      console.error('Error checking and expiring subscriptions:', error);
      throw new Error(`Failed to check and expire subscriptions: ${error.message}`);
    }
  }

  /**
   * Get all subscriptions for a landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of subscriptions
   */
  async getLandlordSubscriptions(landlordId: string): Promise<Subscription[]> {
    try {
      const subscriptionsQuery = query(
        collection(db, COLLECTIONS.SUBSCRIPTIONS),
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(subscriptionsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Subscription, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching landlord subscriptions:', error);
      throw new Error(`Failed to fetch landlord subscriptions: ${error.message}`);
    }
  }

  /**
   * Check if a landlord has an active premium subscription
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to boolean indicating premium status
   */
  async isPremiumLandlord(landlordId: string): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(landlordId);
      return (
        subscription !== null && subscription.tier === 'premium' && subscription.status === 'active'
      );
    } catch (error: any) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Update isPremium flag for all properties owned by a landlord
   *
   * @param landlordId - ID of the landlord
   * @param isPremium - Premium status to set
   * @returns Promise that resolves when update is complete
   */
  private async updateLandlordPropertiesPremiumStatus(
    landlordId: string,
    isPremium: boolean
  ): Promise<void> {
    try {
      // Query all properties for this landlord
      const propertiesQuery = query(
        collection(db, COLLECTIONS.PROPERTIES),
        where('landlordId', '==', landlordId)
      );

      const querySnapshot = await getDocs(propertiesQuery);

      // Update each property
      const updatePromises = querySnapshot.docs.map((docSnap) =>
        updateDoc(doc(db, COLLECTIONS.PROPERTIES, docSnap.id), {
          isPremium,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('Error updating landlord properties premium status:', error);
      throw new Error(`Failed to update properties premium status: ${error.message}`);
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
