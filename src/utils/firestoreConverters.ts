import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import {
  User,
  Property,
  Lead,
  Message,
  Lease,
  MaintenanceRequest,
  Invoice,
  Payment,
  Campaign,
  Notification,
  UserPreferences,
} from '../types/firebase';

/**
 * Generic Firestore converter that handles Timestamp conversion
 * and adds the document ID to the data
 */
function createConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      const { id, ...rest } = data;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      const data = snapshot.data(options);
      return {
        ...data,
        id: snapshot.id,
      } as T;
    },
  };
}

// Export converters for each collection
export const userConverter = createConverter<User>();
export const propertyConverter = createConverter<Property>();
export const leadConverter = createConverter<Lead>();
export const messageConverter = createConverter<Message>();
export const leaseConverter = createConverter<Lease>();
export const maintenanceConverter = createConverter<MaintenanceRequest>();
export const invoiceConverter = createConverter<Invoice>();
export const paymentConverter = createConverter<Payment>();
export const campaignConverter = createConverter<Campaign>();
export const notificationConverter = createConverter<Notification>();
export const userPreferencesConverter = createConverter<UserPreferences>();

/**
 * Helper function to convert Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Helper function to convert Firestore Timestamp to Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Helper function to get current Firestore Timestamp
 */
export const getCurrentTimestamp = (): Timestamp => {
  return Timestamp.now();
};
