import { Timestamp } from 'firebase/firestore';

// User types
export type UserRole = 'landlord' | 'tenant' | 'admin';

export interface User {
  id: string; // Document ID (same as uid)
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  emailVerified: boolean;
  approved?: boolean; // For landlords - requires admin approval before they can use the platform
  approvedBy?: string; // Admin user ID who approved the landlord
  approvedAt?: Timestamp; // When the landlord was approved
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Property types
export type PropertyType = 'apartment' | 'house' | 'townhouse' | 'room';
export type PropertyStatus = 'available' | 'occupied' | 'inactive';

export interface Property {
  id: string;
  landlordId: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  deposit: number;
  description: string;
  amenities: string[];
  availableFrom: Timestamp;
  status: PropertyStatus;
  isPremium: boolean;
  images: string[];
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Lead types
export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'converted' | 'closed';

export interface Lead {
  id: string;
  tenantId: string;
  propertyId: string;
  landlordId: string;
  status: LeadStatus;
  initialMessage: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Timestamp;
}

// Lease types
export type LeaseStatus = 'draft' | 'pending_signatures' | 'active' | 'expired' | 'terminated';

export interface Lease {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  rentAmount: number;
  deposit: number;
  startDate: Timestamp;
  endDate: Timestamp;
  terms: string;
  status: LeaseStatus;
  landlordSignature?: string;
  tenantSignature?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Maintenance types
export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'general'
  | 'appliance'
  | 'structural';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceNote {
  userId: string;
  note: string;
  createdAt: Timestamp;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  status: MaintenanceStatus;
  images: string[];
  notes: MaintenanceNote[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Invoice and Payment types
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'card' | 'cash';

export interface InvoiceItem {
  leaseId: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  landlordId: string;
  amount: number;
  dueDate: Timestamp;
  status: InvoiceStatus;
  leaseIds: string[];
  items: InvoiceItem[];
  createdAt: Timestamp;
}

export interface Payment {
  id: string;
  invoiceId: string;
  landlordId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  paymentDate: Timestamp;
  createdAt: Timestamp;
}

// Campaign types
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter';
export type CampaignStatus = 'active' | 'paused' | 'completed';

export interface CampaignMetrics {
  views: number;
  clicks: number;
  leads: number;
  conversions: number;
}

export interface Campaign {
  id: string;
  name: string;
  propertyIds: string[];
  platforms: SocialPlatform[];
  targetLocation?: string;
  budget?: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: CampaignStatus;
  metrics: CampaignMetrics;
  createdAt: Timestamp;
}

// Notification types
export type NotificationType =
  | 'new_lead'
  | 'new_message'
  | 'maintenance_request'
  | 'lease_expiring'
  | 'payment_due'
  | 'payment_received'
  | 'listing_approved';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Timestamp;
}

// User Preferences types
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  types: Record<NotificationType, boolean>;
}

export interface UserPreferences {
  id: string; // Document ID (same as userId)
  userId: string;
  notifications: NotificationPreferences;
  updatedAt: Timestamp;
}

// Saved Property types
export interface SavedProperty {
  propertyId: string;
  savedAt: Timestamp;
}

// Property View types
export interface PropertyView {
  id: string;
  propertyId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  viewedAt: Timestamp;
}

// Subscription types
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type SubscriptionTier = 'standard' | 'premium';

export interface Subscription {
  id: string;
  landlordId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  autoRenew: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
