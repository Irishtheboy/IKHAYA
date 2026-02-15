/**
 * Firestore Collections Structure
 *
 * This file defines the complete Firestore database schema for IKHAYA RENT PROPERTIES.
 * It documents all collections, subcollections, and their relationships.
 *
 * Collection Structure:
 * - /users/{userId}
 * - /properties/{propertyId}
 * - /leads/{leadId}
 *   - /leads/{leadId}/messages/{messageId}
 * - /leases/{leaseId}
 * - /maintenance/{requestId}
 * - /invoices/{invoiceId}
 * - /payments/{paymentId}
 * - /campaigns/{campaignId}
 * - /notifications/{notificationId}
 * - /userPreferences/{userId}
 * - /users/{userId}/savedProperties/{propertyId}
 * - /propertyViews/{viewId}
 */

import { Timestamp, FieldValue } from 'firebase/firestore';
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
  SavedProperty,
  PropertyView,
  Subscription,
} from './firebase';

/**
 * Firestore Collection Names
 * Centralized collection name constants to avoid typos and ensure consistency
 */
export const COLLECTIONS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  LEADS: 'leads',
  MESSAGES: 'messages', // Subcollection under leads
  LEASES: 'leases',
  MAINTENANCE: 'maintenance',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  CAMPAIGNS: 'campaigns',
  NOTIFICATIONS: 'notifications',
  USER_PREFERENCES: 'userPreferences',
  SAVED_PROPERTIES: 'savedProperties', // Subcollection under users
  PROPERTY_VIEWS: 'propertyViews',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

/**
 * Collection: /users/{userId}
 *
 * Stores user profile information for landlords, tenants, and admins.
 * The document ID matches the Firebase Auth UID.
 *
 * Indexes Required:
 * - role + createdAt (DESC)
 * - email (for lookups)
 *
 * Security Rules:
 * - Read: Any authenticated user
 * - Create: Owner only (matching auth UID)
 * - Update: Owner only
 * - Delete: Owner only
 */
export interface UsersCollection {
  [userId: string]: User;
}

/**
 * Collection: /properties/{propertyId}
 *
 * Stores property listings created by landlords.
 * Properties can be searched by location, price, type, etc.
 *
 * Indexes Required:
 * - landlordId + status + createdAt (DESC)
 * - city + status + rentAmount (ASC)
 * - status + isPremium (DESC) + createdAt (DESC)
 * - propertyType + status + rentAmount (ASC)
 *
 * Security Rules:
 * - Read: Public (anyone can view listings)
 * - Create: Landlords only
 * - Update: Owner landlord only
 * - Delete: Owner landlord only
 */
export interface PropertiesCollection {
  [propertyId: string]: Property;
}

/**
 * Collection: /leads/{leadId}
 *
 * Stores tenant inquiries about properties.
 * Each lead represents a tenant's interest in a specific property.
 *
 * Indexes Required:
 * - tenantId + status + createdAt (DESC)
 * - propertyId + status + createdAt (DESC)
 * - landlordId + status + createdAt (DESC)
 *
 * Security Rules:
 * - Read: Tenant or landlord involved in the lead
 * - Create: Tenants only
 * - Update: Tenant or landlord involved
 */
export interface LeadsCollection {
  [leadId: string]: Lead;
}

/**
 * Subcollection: /leads/{leadId}/messages/{messageId}
 *
 * Stores messages exchanged between tenant and landlord for a specific lead.
 * Messages are organized as a subcollection under each lead.
 *
 * Indexes Required:
 * - createdAt (ASC) - for chronological message display
 * - read + createdAt (ASC) - for unread message queries
 *
 * Security Rules:
 * - Read: Tenant or landlord involved in the parent lead
 * - Create: Tenant or landlord involved in the parent lead
 * - Update: Message sender only (for marking as read)
 */
export interface MessagesSubcollection {
  [messageId: string]: Message;
}

/**
 * Collection: /leases/{leaseId}
 *
 * Stores lease agreements between landlords and tenants.
 * Tracks signatures, terms, and lease status.
 *
 * Indexes Required:
 * - landlordId + status + endDate (ASC)
 * - tenantId + status + endDate (ASC)
 * - propertyId + status + startDate (DESC)
 * - status + endDate (ASC) - for expiring lease queries
 *
 * Security Rules:
 * - Read: Landlord or tenant involved in the lease
 * - Create: Landlords only
 * - Update: Landlord or tenant involved (for signatures)
 */
export interface LeasesCollection {
  [leaseId: string]: Lease;
}

/**
 * Collection: /maintenance/{requestId}
 *
 * Stores maintenance requests submitted by tenants.
 * Tracks issue category, priority, status, and resolution notes.
 *
 * Indexes Required:
 * - propertyId + status + priority (DESC)
 * - landlordId + status + createdAt (DESC)
 * - tenantId + createdAt (DESC)
 * - status + priority (DESC) + createdAt (DESC)
 *
 * Security Rules:
 * - Read: Tenant or landlord involved
 * - Create: Tenants only
 * - Update: Tenant or landlord involved
 */
export interface MaintenanceCollection {
  [requestId: string]: MaintenanceRequest;
}

/**
 * Collection: /invoices/{invoiceId}
 *
 * Stores commission invoices generated for landlords.
 * Invoices are created monthly based on active leases.
 *
 * Indexes Required:
 * - landlordId + status + dueDate (ASC)
 * - status + dueDate (ASC) - for overdue invoice queries
 *
 * Security Rules:
 * - Read: Owner landlord or admin
 * - Create: Admin only (via Cloud Functions)
 * - Update: Admin only
 */
export interface InvoicesCollection {
  [invoiceId: string]: Invoice;
}

/**
 * Collection: /payments/{paymentId}
 *
 * Stores payment records for commission invoices.
 * Links to invoices and tracks payment method and reference.
 *
 * Indexes Required:
 * - invoiceId + createdAt (DESC)
 * - landlordId + createdAt (DESC)
 * - paymentDate (DESC)
 *
 * Security Rules:
 * - Read: Owner landlord or admin
 * - Create: Landlord or admin
 * - Update: Admin only
 */
export interface PaymentsCollection {
  [paymentId: string]: Payment;
}

/**
 * Collection: /campaigns/{campaignId}
 *
 * Stores marketing campaigns for property promotion.
 * Tracks social media platforms, metrics, and campaign status.
 *
 * Indexes Required:
 * - status + startDate (DESC)
 * - createdAt (DESC)
 *
 * Security Rules:
 * - Read: Admin only
 * - Create: Admin only
 * - Update: Admin only
 */
export interface CampaignsCollection {
  [campaignId: string]: Campaign;
}

/**
 * Collection: /notifications/{notificationId}
 *
 * Stores in-app notifications for users.
 * Notifications are created by Cloud Functions for various events.
 *
 * Indexes Required:
 * - userId + read + createdAt (DESC)
 * - userId + type + read + createdAt (DESC)
 *
 * Security Rules:
 * - Read: Owner user only
 * - Create: System (Cloud Functions)
 * - Update: Owner user only (for marking as read)
 * - Delete: Owner user only
 */
export interface NotificationsCollection {
  [notificationId: string]: Notification;
}

/**
 * Collection: /userPreferences/{userId}
 *
 * Stores user notification preferences and settings.
 * Document ID matches the user's UID.
 *
 * Indexes Required:
 * - None (direct document access by userId)
 *
 * Security Rules:
 * - Read: Owner user only
 * - Create: Owner user only
 * - Update: Owner user only
 */
export interface UserPreferencesCollection {
  [userId: string]: UserPreferences;
}

/**
 * Subcollection: /users/{userId}/savedProperties/{propertyId}
 *
 * Stores properties saved/bookmarked by a user.
 * Organized as a subcollection under each user.
 *
 * Indexes Required:
 * - savedAt (DESC)
 *
 * Security Rules:
 * - Read: Owner user only
 * - Create: Owner user only
 * - Delete: Owner user only
 */
export interface SavedPropertiesSubcollection {
  [propertyId: string]: SavedProperty;
}

/**
 * Collection: /propertyViews/{viewId}
 *
 * Stores analytics data for property views.
 * Used for tracking property popularity and generating metrics.
 *
 * Indexes Required:
 * - propertyId + viewedAt (DESC)
 * - userId + viewedAt (DESC)
 *
 * Security Rules:
 * - Read: Admin only
 * - Create: Anyone (including anonymous)
 * - Update: None
 * - Delete: Admin only
 */
export interface PropertyViewsCollection {
  [viewId: string]: PropertyView;
}

/**
 * Collection: /subscriptions/{subscriptionId}
 *
 * Stores premium subscription information for landlords.
 * Tracks subscription tier, status, and renewal dates.
 *
 * Indexes Required:
 * - landlordId + status + endDate (ASC)
 * - status + endDate (ASC) - for expiring subscription queries
 *
 * Security Rules:
 * - Read: Owner landlord or admin
 * - Create: Owner landlord or admin
 * - Update: Owner landlord or admin
 */
export interface SubscriptionsCollection {
  [subscriptionId: string]: Subscription;
}

/**
 * Helper type for Firestore document data with server timestamps
 * Use this when creating new documents to allow FieldValue.serverTimestamp()
 */
export type FirestoreDocumentInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

/**
 * Helper type for Firestore document updates
 * Use this when updating existing documents
 */
export type FirestoreDocumentUpdate<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt?: Timestamp | FieldValue;
};

/**
 * Complete Firestore Database Schema
 * This interface represents the entire database structure
 */
export interface FirestoreSchema {
  users: UsersCollection;
  properties: PropertiesCollection;
  leads: LeadsCollection;
  leases: LeasesCollection;
  maintenance: MaintenanceCollection;
  invoices: InvoicesCollection;
  payments: PaymentsCollection;
  campaigns: CampaignsCollection;
  notifications: NotificationsCollection;
  userPreferences: UserPreferencesCollection;
  propertyViews: PropertyViewsCollection;
  subscriptions: SubscriptionsCollection;
}

/**
 * Collection Path Helpers
 * Utility functions to generate collection and document paths
 */
export const getCollectionPath = {
  users: () => COLLECTIONS.USERS,
  properties: () => COLLECTIONS.PROPERTIES,
  leads: () => COLLECTIONS.LEADS,
  messages: (leadId: string) => `${COLLECTIONS.LEADS}/${leadId}/${COLLECTIONS.MESSAGES}`,
  leases: () => COLLECTIONS.LEASES,
  maintenance: () => COLLECTIONS.MAINTENANCE,
  invoices: () => COLLECTIONS.INVOICES,
  payments: () => COLLECTIONS.PAYMENTS,
  campaigns: () => COLLECTIONS.CAMPAIGNS,
  notifications: () => COLLECTIONS.NOTIFICATIONS,
  userPreferences: () => COLLECTIONS.USER_PREFERENCES,
  savedProperties: (userId: string) =>
    `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.SAVED_PROPERTIES}`,
  propertyViews: () => COLLECTIONS.PROPERTY_VIEWS,
  subscriptions: () => COLLECTIONS.SUBSCRIPTIONS,
} as const;

/**
 * Document Path Helpers
 * Utility functions to generate document paths
 */
export const getDocumentPath = {
  user: (userId: string) => `${COLLECTIONS.USERS}/${userId}`,
  property: (propertyId: string) => `${COLLECTIONS.PROPERTIES}/${propertyId}`,
  lead: (leadId: string) => `${COLLECTIONS.LEADS}/${leadId}`,
  message: (leadId: string, messageId: string) =>
    `${COLLECTIONS.LEADS}/${leadId}/${COLLECTIONS.MESSAGES}/${messageId}`,
  lease: (leaseId: string) => `${COLLECTIONS.LEASES}/${leaseId}`,
  maintenanceRequest: (requestId: string) => `${COLLECTIONS.MAINTENANCE}/${requestId}`,
  invoice: (invoiceId: string) => `${COLLECTIONS.INVOICES}/${invoiceId}`,
  payment: (paymentId: string) => `${COLLECTIONS.PAYMENTS}/${paymentId}`,
  campaign: (campaignId: string) => `${COLLECTIONS.CAMPAIGNS}/${campaignId}`,
  notification: (notificationId: string) => `${COLLECTIONS.NOTIFICATIONS}/${notificationId}`,
  userPreference: (userId: string) => `${COLLECTIONS.USER_PREFERENCES}/${userId}`,
  savedProperty: (userId: string, propertyId: string) =>
    `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.SAVED_PROPERTIES}/${propertyId}`,
  propertyView: (viewId: string) => `${COLLECTIONS.PROPERTY_VIEWS}/${viewId}`,
  subscription: (subscriptionId: string) => `${COLLECTIONS.SUBSCRIPTIONS}/${subscriptionId}`,
} as const;
