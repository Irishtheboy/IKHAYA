# Design Document: IKHAYA RENT PROPERTIES

## Overview

IKHAYA RENT PROPERTIES is a full-stack web application that serves as a property rental marketplace connecting landlords with tenants. The platform provides comprehensive property management capabilities including listing creation, search and discovery, lead management, lease agreements, maintenance tracking, and marketing tools.

The system follows a three-tier architecture with a React-based frontend, RESTful API backend, and relational database. The design emphasizes scalability, security, and user experience across both desktop and mobile devices.

**Key Design Principles:**
- Role-based access control for landlords, tenants, and administrators
- RESTful API design for clear separation of concerns
- Responsive design for mobile and desktop compatibility
- Secure authentication and data encryption
- Scalable architecture to support growth
- SEO optimization for organic traffic generation

## Architecture

### System Architecture

The platform uses a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React SPA (Single Page Application)                │  │
│  │   - Property Listings UI                             │  │
│  │   - Search & Filters                                 │  │
│  │   - User Dashboards                                  │  │
│  │   - Messaging Interface                              │  │
│  │   - Firebase SDK Integration                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ Firebase SDK
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Firebase Authentication                            │  │
│  │   - Email/Password Auth                              │  │
│  │   - User Role Management (Custom Claims)             │  │
│  │   - Password Reset                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Cloud Firestore (NoSQL Database)                   │  │
│  │   - Users Collection                                 │  │
│  │   - Properties Collection                            │  │
│  │   - Leads & Messages Collections                     │  │
│  │   - Leases & Maintenance Collections                 │  │
│  │   - Real-time Listeners                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Firebase Storage                                   │  │
│  │   - Property Images                                  │  │
│  │   - Maintenance Photos                               │  │
│  │   - Lease Documents                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Cloud Functions (Serverless Backend)               │  │
│  │   - Business Logic Triggers                          │  │
│  │   - Email Notifications                              │  │
│  │   - Scheduled Tasks                                  │  │
│  │   - Data Validation                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- React Router for navigation
- React Context API for state management (simple and functional)
- Tailwind CSS for UI components (utility-first, fast development)
- Firebase SDK v9+ (modular) for all backend communication
- React Hook Form for form handling
- React Query for data fetching and caching

**Backend (Firebase Services):**
- Firebase Authentication for user management
- Cloud Firestore for NoSQL database
- Firebase Storage for file uploads (images, documents)
- Cloud Functions for serverless backend logic
- Firebase Cloud Messaging for push notifications
- Firebase Extensions for scheduled tasks (email, image optimization)

**Infrastructure:**
- Firebase Hosting for web app deployment
- Firebase Security Rules for data access control
- Firebase Analytics for usage tracking
- Firebase Performance Monitoring
- Firebase Emulator Suite for local development

## Components and Interfaces

### Core Components

#### 1. Authentication Service

Handles user registration, login, password management, and session management.

**Interface:**
```typescript
interface AuthService {
  register(userData: RegisterDTO): Promise<User>
  login(credentials: LoginDTO): Promise<AuthToken>
  logout(userId: string): Promise<void>
  verifyEmail(token: string): Promise<boolean>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  validateToken(token: string): Promise<User>
}

interface RegisterDTO {
  name: string
  email: string
  password: string
  role: 'landlord' | 'tenant'
  phone?: string
}

interface LoginDTO {
  email: string
  password: string
}

interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

#### 2. Property Service

Manages property listings, including creation, updates, search, and status management.

**Interface:**
```typescript
interface PropertyService {
  createListing(landlordId: string, propertyData: PropertyDTO): Promise<Property>
  updateListing(propertyId: string, updates: Partial<PropertyDTO>): Promise<Property>
  deleteListing(propertyId: string): Promise<void>
  getListing(propertyId: string): Promise<Property>
  searchProperties(criteria: SearchCriteria): Promise<PropertySearchResult>
  uploadImages(propertyId: string, images: File[]): Promise<string[]>
  updateStatus(propertyId: string, status: PropertyStatus): Promise<Property>
  getLandlordProperties(landlordId: string): Promise<Property[]>
}

interface PropertyDTO {
  address: string
  city: string
  province: string
  postalCode: string
  propertyType: 'apartment' | 'house' | 'townhouse' | 'room'
  bedrooms: number
  bathrooms: number
  rentAmount: number
  deposit: number
  description: string
  amenities: string[]
  availableFrom: Date
}

interface SearchCriteria {
  location?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  sortBy?: 'price' | 'date' | 'relevance'
  page?: number
  limit?: number
}

interface PropertySearchResult {
  properties: Property[]
  total: number
  page: number
  totalPages: number
}

type PropertyStatus = 'available' | 'occupied' | 'inactive'
```

#### 3. Lead Service

Manages tenant inquiries and communication between landlords and tenants.

**Interface:**
```typescript
interface LeadService {
  createLead(tenantId: string, propertyId: string, message: string): Promise<Lead>
  getLeadsForProperty(propertyId: string): Promise<Lead[]>
  getLeadsForLandlord(landlordId: string): Promise<Lead[]>
  updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead>
  sendMessage(leadId: string, senderId: string, message: string): Promise<Message>
  getMessages(leadId: string): Promise<Message[]>
}

interface Lead {
  id: string
  tenantId: string
  propertyId: string
  status: LeadStatus
  initialMessage: string
  createdAt: Date
  updatedAt: Date
}

type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'converted' | 'closed'

interface Message {
  id: string
  leadId: string
  senderId: string
  content: string
  createdAt: Date
  read: boolean
}
```

#### 4. Lease Service

Manages lease agreements between landlords and tenants.

**Interface:**
```typescript
interface LeaseService {
  createLease(leaseData: LeaseDTO): Promise<Lease>
  getLease(leaseId: string): Promise<Lease>
  updateLease(leaseId: string, updates: Partial<LeaseDTO>): Promise<Lease>
  signLease(leaseId: string, userId: string, signature: string): Promise<Lease>
  terminateLease(leaseId: string, reason: string): Promise<Lease>
  getActiveLeasesForLandlord(landlordId: string): Promise<Lease[]>
  getActiveLeasesForTenant(tenantId: string): Promise<Lease[]>
  checkExpiringLeases(): Promise<Lease[]>
}

interface LeaseDTO {
  propertyId: string
  landlordId: string
  tenantId: string
  rentAmount: number
  deposit: number
  startDate: Date
  endDate: Date
  terms: string
}

interface Lease {
  id: string
  propertyId: string
  landlordId: string
  tenantId: string
  rentAmount: number
  deposit: number
  startDate: Date
  endDate: Date
  terms: string
  status: LeaseStatus
  landlordSignature?: string
  tenantSignature?: string
  createdAt: Date
  updatedAt: Date
}

type LeaseStatus = 'draft' | 'pending_signatures' | 'active' | 'expired' | 'terminated'
```

#### 5. Maintenance Service

Handles maintenance requests from tenants and tracking by landlords.

**Interface:**
```typescript
interface MaintenanceService {
  createRequest(requestData: MaintenanceRequestDTO): Promise<MaintenanceRequest>
  getRequest(requestId: string): Promise<MaintenanceRequest>
  updateRequestStatus(requestId: string, status: MaintenanceStatus, notes?: string): Promise<MaintenanceRequest>
  getRequestsForProperty(propertyId: string): Promise<MaintenanceRequest[]>
  getRequestsForLandlord(landlordId: string): Promise<MaintenanceRequest[]>
  uploadImages(requestId: string, images: File[]): Promise<string[]>
}

interface MaintenanceRequestDTO {
  propertyId: string
  tenantId: string
  category: 'plumbing' | 'electrical' | 'general' | 'appliance' | 'structural'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
}

interface MaintenanceRequest {
  id: string
  propertyId: string
  tenantId: string
  category: string
  priority: string
  description: string
  status: MaintenanceStatus
  images: string[]
  notes: string[]
  createdAt: Date
  updatedAt: Date
}

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
```

#### 6. Payment Service

Tracks commission payments and generates invoices.

**Interface:**
```typescript
interface PaymentService {
  calculateCommission(leaseId: string): Promise<number>
  generateInvoice(landlordId: string, month: Date): Promise<Invoice>
  recordPayment(invoiceId: string, paymentData: PaymentDTO): Promise<Payment>
  getPaymentHistory(landlordId: string): Promise<Payment[]>
  getOutstandingBalance(landlordId: string): Promise<number>
  sendPaymentReminder(invoiceId: string): Promise<void>
}

interface Invoice {
  id: string
  landlordId: string
  amount: number
  dueDate: Date
  status: 'pending' | 'paid' | 'overdue'
  leaseIds: string[]
  createdAt: Date
}

interface PaymentDTO {
  amount: number
  paymentMethod: 'bank_transfer' | 'card' | 'cash'
  reference: string
  paymentDate: Date
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: string
  reference: string
  paymentDate: Date
  createdAt: Date
}
```

#### 7. Marketing Service

Manages marketing campaigns and social media integration.

**Interface:**
```typescript
interface MarketingService {
  createCampaign(campaignData: CampaignDTO): Promise<Campaign>
  postToSocialMedia(propertyId: string, platforms: string[]): Promise<SocialMediaPost[]>
  generateFlyer(propertyId: string): Promise<string>
  trackCampaignPerformance(campaignId: string): Promise<CampaignMetrics>
  getCampaigns(landlordId?: string): Promise<Campaign[]>
}

interface CampaignDTO {
  name: string
  propertyIds: string[]
  platforms: ('facebook' | 'instagram' | 'twitter')[]
  targetLocation?: string
  budget?: number
  startDate: Date
  endDate: Date
}

interface Campaign {
  id: string
  name: string
  propertyIds: string[]
  platforms: string[]
  status: 'active' | 'paused' | 'completed'
  metrics: CampaignMetrics
  createdAt: Date
}

interface CampaignMetrics {
  views: number
  clicks: number
  leads: number
  conversions: number
  costPerLead?: number
}

interface SocialMediaPost {
  platform: string
  postId: string
  url: string
  postedAt: Date
}
```

#### 8. Notification Service

Handles email, SMS, and in-app notifications.

**Interface:**
```typescript
interface NotificationService {
  sendNotification(notification: NotificationDTO): Promise<void>
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  updatePreferences(userId: string, preferences: NotificationPreferences): Promise<void>
  getPreferences(userId: string): Promise<NotificationPreferences>
}

interface NotificationDTO {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  priority: 'low' | 'medium' | 'high'
}

type NotificationType = 
  | 'new_lead'
  | 'new_message'
  | 'maintenance_request'
  | 'lease_expiring'
  | 'payment_due'
  | 'payment_received'
  | 'listing_approved'

interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
}

interface NotificationPreferences {
  email: boolean
  sms: boolean
  inApp: boolean
  notificationTypes: Record<NotificationType, boolean>
}
```

#### 9. Analytics Service

Provides dashboard metrics and reporting capabilities.

**Interface:**
```typescript
interface AnalyticsService {
  getLandlordDashboard(landlordId: string): Promise<LandlordDashboard>
  getTenantDashboard(tenantId: string): Promise<TenantDashboard>
  getPropertyMetrics(propertyId: string, dateRange: DateRange): Promise<PropertyMetrics>
  generateReport(reportType: ReportType, filters: ReportFilters): Promise<Report>
  exportReport(reportId: string, format: 'pdf' | 'csv' | 'excel'): Promise<Buffer>
}

interface LandlordDashboard {
  activeListings: number
  totalLeads: number
  occupancyRate: number
  monthlyRevenue: number
  leadTrends: TimeSeriesData[]
  propertyPerformance: PropertyPerformance[]
}

interface TenantDashboard {
  savedProperties: Property[]
  activeInquiries: Lead[]
  currentLease?: Lease
  maintenanceRequests: MaintenanceRequest[]
}

interface PropertyMetrics {
  views: number
  leads: number
  conversionRate: number
  averageResponseTime: number
  viewTrend: TimeSeriesData[]
}

interface TimeSeriesData {
  date: Date
  value: number
}

interface PropertyPerformance {
  propertyId: string
  views: number
  leads: number
  conversionRate: number
}

type ReportType = 'property_performance' | 'financial' | 'maintenance' | 'occupancy'

interface ReportFilters {
  landlordId?: string
  propertyIds?: string[]
  startDate: Date
  endDate: Date
}

interface Report {
  id: string
  type: ReportType
  data: any
  generatedAt: Date
}

interface DateRange {
  startDate: Date
  endDate: Date
}
```

### Firebase Integration Approach

Instead of traditional REST API endpoints, the application uses Firebase SDK directly in the frontend with Cloud Functions for complex operations:

**Direct Firebase SDK Operations (Frontend):**
- Firestore queries for reading data
- Real-time listeners for live updates
- Firebase Auth for authentication
- Firebase Storage for file uploads

**Cloud Functions (Backend Logic):**
- Triggered by Firestore events (onCreate, onUpdate, onDelete)
- Scheduled functions for periodic tasks
- Callable functions for complex operations
- HTTP functions for webhooks and integrations

**Key Cloud Functions:**

```typescript
// Authentication triggers
- onUserCreate: Set up user profile and send welcome email
- onUserDelete: Clean up user data

// Property triggers
- onPropertyCreate: Validate data, send notifications
- onPropertyUpdate: Update search indexes, notify watchers
- onPropertyStatusChange: Handle availability changes

// Lead triggers
- onLeadCreate: Notify landlord, send confirmation email
- onMessageCreate: Send email notification, update unread count

// Lease triggers
- onLeaseSign: Check if both parties signed, activate lease
- onLeaseActivate: Update property status, send notifications
- checkExpiringLeases: Scheduled daily to check and notify

// Maintenance triggers
- onMaintenanceCreate: Notify landlord, validate images
- onMaintenanceStatusChange: Notify tenant

// Payment triggers
- generateMonthlyInvoices: Scheduled monthly
- onPaymentCreate: Update invoice status, send receipt

// Notification functions
- sendEmail: Callable function for sending emails
- sendPushNotification: Send FCM notifications

// Analytics functions
- calculateDashboardMetrics: Callable function
- generateReport: Callable function for reports
```

## Data Models

### Firestore Database Structure

Firestore uses a NoSQL document-based structure with collections and documents. Below is the collection structure:

```typescript
// Users Collection: /users/{userId}
interface User {
  uid: string                    // Firebase Auth UID
  email: string
  name: string
  role: 'landlord' | 'tenant' | 'admin'
  phone?: string
  emailVerified: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Properties Collection: /properties/{propertyId}
interface Property {
  id: string
  landlordId: string             // Reference to user
  address: string
  city: string
  province: string
  postalCode?: string
  propertyType: 'apartment' | 'house' | 'townhouse' | 'room'
  bedrooms: number
  bathrooms: number
  rentAmount: number
  deposit: number
  description: string
  amenities: string[]
  availableFrom: Timestamp
  status: 'available' | 'occupied' | 'inactive'
  isPremium: boolean
  images: string[]               // Array of Storage URLs
  viewCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Leads Collection: /leads/{leadId}
interface Lead {
  id: string
  tenantId: string               // Reference to user
  propertyId: string             // Reference to property
  landlordId: string             // Denormalized for queries
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'closed'
  initialMessage: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Messages Subcollection: /leads/{leadId}/messages/{messageId}
interface Message {
  id: string
  senderId: string               // Reference to user
  content: string
  read: boolean
  createdAt: Timestamp
}

// Leases Collection: /leases/{leaseId}
interface Lease {
  id: string
  propertyId: string             // Reference to property
  landlordId: string             // Reference to user
  tenantId: string               // Reference to user
  rentAmount: number
  deposit: number
  startDate: Timestamp
  endDate: Timestamp
  terms: string
  status: 'draft' | 'pending_signatures' | 'active' | 'expired' | 'terminated'
  landlordSignature?: string
  tenantSignature?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Maintenance Requests Collection: /maintenance/{requestId}
interface MaintenanceRequest {
  id: string
  propertyId: string             // Reference to property
  tenantId: string               // Reference to user
  landlordId: string             // Denormalized for queries
  category: 'plumbing' | 'electrical' | 'general' | 'appliance' | 'structural'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  images: string[]               // Array of Storage URLs (max 3)
  notes: Array<{
    userId: string
    note: string
    createdAt: Timestamp
  }>
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Invoices Collection: /invoices/{invoiceId}
interface Invoice {
  id: string
  landlordId: string             // Reference to user
  amount: number
  dueDate: Timestamp
  status: 'pending' | 'paid' | 'overdue'
  leaseIds: string[]             // References to leases
  items: Array<{
    leaseId: string
    description: string
    amount: number
  }>
  createdAt: Timestamp
}

// Payments Collection: /payments/{paymentId}
interface Payment {
  id: string
  invoiceId: string              // Reference to invoice
  landlordId: string             // Denormalized for queries
  amount: number
  paymentMethod: 'bank_transfer' | 'card' | 'cash'
  reference: string
  paymentDate: Timestamp
  createdAt: Timestamp
}

// Campaigns Collection: /campaigns/{campaignId}
interface Campaign {
  id: string
  name: string
  propertyIds: string[]          // References to properties
  platforms: ('facebook' | 'instagram' | 'twitter')[]
  targetLocation?: string
  budget?: number
  startDate: Timestamp
  endDate: Timestamp
  status: 'active' | 'paused' | 'completed'
  metrics: {
    views: number
    clicks: number
    leads: number
    conversions: number
  }
  createdAt: Timestamp
}

// Notifications Collection: /notifications/{notificationId}
interface Notification {
  id: string
  userId: string                 // Reference to user
  type: 'new_lead' | 'new_message' | 'maintenance_request' | 'lease_expiring' | 
        'payment_due' | 'payment_received' | 'listing_approved'
  title: string
  message: string
  link?: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  createdAt: Timestamp
}

// User Preferences Collection: /userPreferences/{userId}
interface UserPreferences {
  userId: string
  notifications: {
    email: boolean
    sms: boolean
    inApp: boolean
    types: Record<string, boolean>
  }
  updatedAt: Timestamp
}

// Saved Properties Collection: /users/{userId}/savedProperties/{propertyId}
interface SavedProperty {
  propertyId: string
  savedAt: Timestamp
}

// Property Views Collection: /propertyViews/{viewId}
interface PropertyView {
  id: string
  propertyId: string
  userId?: string                // Optional if not logged in
  ipAddress?: string
  userAgent?: string
  viewedAt: Timestamp
}
```

### Firestore Indexes

Required composite indexes for efficient queries:

```javascript
// Properties
- landlordId + status + createdAt (DESC)
- city + status + rentAmount (ASC)
- status + isPremium (DESC) + createdAt (DESC)

// Leads
- tenantId + status + createdAt (DESC)
- propertyId + status + createdAt (DESC)
- landlordId + status + createdAt (DESC)

// Leases
- landlordId + status + endDate (ASC)
- tenantId + status + endDate (ASC)
- propertyId + status + startDate (DESC)

// Maintenance Requests
- propertyId + status + priority (DESC)
- landlordId + status + createdAt (DESC)
- tenantId + createdAt (DESC)

// Notifications
- userId + read + createdAt (DESC)

// Invoices
- landlordId + status + dueDate (ASC)
```

### Security Rules

Firestore Security Rules to enforce access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Properties collection
    match /properties/{propertyId} {
      allow read: if true; // Public read for property listings
      allow create: if hasRole('landlord');
      allow update: if hasRole('landlord') && 
                      resource.data.landlordId == request.auth.uid;
      allow delete: if hasRole('landlord') && 
                      resource.data.landlordId == request.auth.uid;
    }
    
    // Leads collection
    match /leads/{leadId} {
      allow read: if isAuthenticated() && 
                    (resource.data.tenantId == request.auth.uid || 
                     resource.data.landlordId == request.auth.uid);
      allow create: if hasRole('tenant');
      allow update: if isAuthenticated() && 
                      (resource.data.tenantId == request.auth.uid || 
                       resource.data.landlordId == request.auth.uid);
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() && 
                      (get(/databases/$(database)/documents/leads/$(leadId)).data.tenantId == request.auth.uid ||
                       get(/databases/$(database)/documents/leads/$(leadId)).data.landlordId == request.auth.uid);
        allow create: if isAuthenticated();
      }
    }
    
    // Leases collection
    match /leases/{leaseId} {
      allow read: if isAuthenticated() && 
                    (resource.data.landlordId == request.auth.uid || 
                     resource.data.tenantId == request.auth.uid);
      allow create: if hasRole('landlord');
      allow update: if isAuthenticated() && 
                      (resource.data.landlordId == request.auth.uid || 
                       resource.data.tenantId == request.auth.uid);
    }
    
    // Maintenance requests
    match /maintenance/{requestId} {
      allow read: if isAuthenticated() && 
                    (resource.data.tenantId == request.auth.uid || 
                     resource.data.landlordId == request.auth.uid);
      allow create: if hasRole('tenant');
      allow update: if isAuthenticated() && 
                      (resource.data.tenantId == request.auth.uid || 
                       resource.data.landlordId == request.auth.uid);
    }
    
    // Invoices and Payments
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() && 
                    resource.data.landlordId == request.auth.uid;
      allow create, update: if hasRole('admin');
    }
    
    match /payments/{paymentId} {
      allow read: if isAuthenticated() && 
                    resource.data.landlordId == request.auth.uid;
      allow create: if isAuthenticated();
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, update: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
    }
    
    // User preferences
    match /userPreferences/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Saved properties subcollection
    match /users/{userId}/savedProperties/{propertyId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication and User Management Properties

**Property 1: Valid registration creates account and sends verification**
*For any* valid user registration data (name, email, password, role), creating an account should result in a new user record in the database and a verification email being sent to the provided email address.
**Validates: Requirements 1.1**

**Property 2: Valid credentials authenticate successfully**
*For any* registered user with valid credentials, authentication should succeed and return an access token with appropriate role-based permissions.
**Validates: Requirements 1.3**

**Property 3: Password validation enforces requirements**
*For any* password string, validation should reject passwords that don't meet requirements (minimum 8 characters, at least one uppercase, one lowercase, one number) and accept passwords that do meet requirements.
**Validates: Requirements 1.5**

**Property 4: Password reset generates secure link**
*For any* registered user email, requesting a password reset should generate a unique, time-limited reset token and send it to the user's email address.
**Validates: Requirements 1.6**

### Property Listing Properties

**Property 5: Valid listing creation makes property searchable**
*For any* valid property data (address, type, bedrooms, bathrooms, rent amount, description), creating a listing should result in a new property record that appears in search results.
**Validates: Requirements 2.1**

**Property 6: Image upload validation enforces format and size limits**
*For any* uploaded file, image validation should reject files that are not JPEG or PNG format or exceed 5MB in size, and accept files that meet these criteria.
**Validates: Requirements 2.2**

**Property 7: Listing updates preserve data and update timestamp**
*For any* property listing and valid update data, updating the listing should save all changes and set the updated_at timestamp to the current time.
**Validates: Requirements 2.3**

**Property 8: Deactivated listings are hidden from search but data preserved**
*For any* property listing, deactivating it should remove it from all search results while maintaining all property data in the database.
**Validates: Requirements 2.4**

**Property 9: Property status transitions work correctly**
*For any* property listing, updating the status to 'available', 'occupied', or 'inactive' should change the status field and affect search visibility appropriately.
**Validates: Requirements 2.5**

**Property 10: Listing creation assigns unique identifier**
*For any* set of created property listings, each listing should have a unique identifier that is different from all other listings.
**Validates: Requirements 2.6**

### Search and Discovery Properties

**Property 11: Location search returns matching properties**
*For any* location search criteria and set of properties, search results should include all and only active properties within the specified location.
**Validates: Requirements 3.1**

**Property 12: Filter combinations return matching properties**
*For any* combination of filters (price range, bedrooms, bathrooms, property type) and set of properties, search results should include all and only properties that match all specified criteria.
**Validates: Requirements 3.2**

**Property 13: Search results contain required information**
*For any* property in search results, the result should include property images, key details (bedrooms, bathrooms, type), and rental price.
**Validates: Requirements 3.3**

**Property 14: Search result sorting works correctly**
*For any* search results and sort option (relevance, price, date), the results should be ordered according to the specified sort criteria.
**Validates: Requirements 3.4**

**Property 15: Property detail pages contain complete information**
*For any* property listing, the detail page should include description, amenities, contact information, and all other property attributes.
**Validates: Requirements 3.5**

### Lead Management Properties

**Property 16: Lead creation captures data and sends notifications**
*For any* tenant expressing interest in a property, creating a lead should capture tenant contact information and inquiry message, create a lead record, and send notifications to the landlord via email and in-platform.
**Validates: Requirements 4.1, 4.2**

**Property 17: Message delivery and notification**
*For any* message sent between landlord and tenant, the message should be delivered to the recipient and an email notification should be sent.
**Validates: Requirements 4.4**

**Property 18: Lead display shows complete information**
*For any* lead viewed by a landlord, the display should include tenant contact information, inquiry message, and inquiry timestamp.
**Validates: Requirements 4.5**

**Property 19: Lead status transitions work correctly**
*For any* lead, updating the status to 'contacted', 'scheduled', 'converted', or 'closed' should change the status field and be reflected in lead listings.
**Validates: Requirements 4.6**

### Lease Management Properties

**Property 20: Lease creation generates digital document**
*For any* valid lease terms (tenant information, property, rent amount, duration, start date), creating a lease should generate a digital lease document with all specified terms.
**Validates: Requirements 5.1**

**Property 21: Dual signature activates lease and updates property status**
*For any* lease with both landlord and tenant signatures, the lease status should change to 'active' and the associated property status should change to 'occupied'.
**Validates: Requirements 5.3**

**Property 22: Expiring leases trigger notifications**
*For any* active lease with an end date 30 days or less in the future, both landlord and tenant should receive expiration notifications.
**Validates: Requirements 5.4**

**Property 23: Lease termination updates property status**
*For any* active lease, terminating it should change the lease status to 'terminated', change the property status to 'available', and archive the lease agreement.
**Validates: Requirements 5.6**

### Maintenance Request Properties

**Property 24: Maintenance request creation and notification**
*For any* valid maintenance request (issue description, category), creating the request should generate a maintenance record and send notifications to the landlord.
**Validates: Requirements 6.1**

**Property 25: Maintenance image upload enforces limit**
*For any* maintenance request, uploading images should accept up to 3 images and reject attempts to upload more than 3 images.
**Validates: Requirements 6.2**

**Property 26: Maintenance request display shows complete information**
*For any* maintenance request viewed by a landlord, the display should include all pending requests with priority indicators, descriptions, and tenant information.
**Validates: Requirements 6.3**

**Property 27: Maintenance status transitions work correctly**
*For any* maintenance request, updating the status to 'pending', 'in_progress', or 'completed' should change the status field and be reflected in request listings.
**Validates: Requirements 6.4**

**Property 28: Maintenance status changes trigger notifications**
*For any* maintenance request status change, the tenant should receive a notification about the status update.
**Validates: Requirements 6.5**

**Property 29: Maintenance history is tracked per property**
*For any* property with maintenance requests, all historical requests should be retrievable and associated with that property.
**Validates: Requirements 6.6**

### Premium Services Properties

**Property 30: Premium listings appear prominently in search**
*For any* search results containing both premium and standard listings, premium listings should appear before standard listings in the results.
**Validates: Requirements 7.1**

**Property 31: Premium service allows unlimited images**
*For any* property with premium service, uploading images should accept more than 5 images, while standard listings should be limited to 5 images.
**Validates: Requirements 7.2**

**Property 32: Premium listings display distinctive badge**
*For any* premium property listing, the display should include a distinctive badge or highlight indicating premium status.
**Validates: Requirements 7.4**

**Property 33: Premium subscription expiration reverts to standard**
*For any* premium listing with an expired subscription, the listing should revert to standard visibility, image limits should be enforced, and the landlord should receive a notification.
**Validates: Requirements 7.5**

**Property 34: Premium upgrade works at any time**
*For any* landlord with standard listings, upgrading to premium service should immediately apply premium benefits to their listings.
**Validates: Requirements 7.6**

### Payment and Commission Properties

**Property 35: Commission calculation is correct**
*For any* activated lease agreement, the calculated commission amount should equal the rent amount multiplied by the configured commission percentage rate.
**Validates: Requirements 8.1**

**Property 36: Monthly invoices generated for active leases**
*For any* active lease in a given month, a commission invoice should be generated for that lease.
**Validates: Requirements 8.2**

**Property 37: Payment recording updates balance**
*For any* commission payment, recording the payment should create a payment record and reduce the landlord's outstanding balance by the payment amount.
**Validates: Requirements 8.3**

**Property 38: Payment history and balance display correctly**
*For any* landlord, the payment display should show all historical payments and the current outstanding balance.
**Validates: Requirements 8.4**

**Property 39: Overdue payments trigger reminders**
*For any* invoice that is 15 or more days past its due date, a reminder notification should be sent to the landlord.
**Validates: Requirements 8.5**

**Property 40: Commission reports are generated**
*For any* time period, generating a commission report should include all commission data for that period.
**Validates: Requirements 8.6**

### Marketing Properties

**Property 41: Premium listings auto-post to social media**
*For any* new premium listing, the listing should be automatically posted to all configured social media channels (Facebook, Instagram, Twitter).
**Validates: Requirements 9.2**

**Property 42: Flyer generation includes required elements**
*For any* property listing, generating a flyer should produce a printable document containing property details and a QR code linking to the listing.
**Validates: Requirements 9.3**

**Property 43: Campaign performance metrics are tracked**
*For any* marketing campaign, the system should track and store views, clicks, and leads generated by the campaign.
**Validates: Requirements 9.4**

**Property 44: Campaign targeting options work correctly**
*For any* marketing campaign, setting targeting criteria (location, property type, price range) should filter which properties are included in the campaign.
**Validates: Requirements 9.5**

**Property 45: Marketing analytics reports are generated**
*For any* marketing campaign, generating an analytics report should include campaign effectiveness metrics (views, clicks, leads, conversions).
**Validates: Requirements 9.6**

### Dashboard and Analytics Properties

**Property 46: Landlord dashboard displays key metrics**
*For any* landlord, the dashboard should display accurate counts of active listings, total leads, occupancy rate, and revenue, along with lead generation trend graphs and property performance comparisons.
**Validates: Requirements 10.1, 10.2, 10.3**

**Property 47: Tenant dashboard displays relevant information**
*For any* tenant, the dashboard should display saved properties, active inquiries, and current lease information.
**Validates: Requirements 10.4**

### Notification Properties

**Property 48: Significant events trigger notifications**
*For any* significant event (new lead, maintenance request, lease expiration), notifications should be sent via email and in-platform alerts to the relevant users.
**Validates: Requirements 11.1**

**Property 49: Notification preferences are respected**
*For any* user with configured notification preferences, notifications should only be sent through the channels the user has enabled (email, SMS, in-app).
**Validates: Requirements 11.2**

**Property 50: Unread notification count is accurate**
*For any* user with unread notifications, the notification badge should display the correct count of unread notifications.
**Validates: Requirements 11.3**

**Property 51: Similar notifications are grouped**
*For any* set of similar notifications (same type, same source), the notifications should be grouped together to avoid overwhelming the user.
**Validates: Requirements 11.4**

**Property 52: Notification links navigate correctly**
*For any* notification with a link, clicking the notification should navigate to the relevant page or item referenced in the notification.
**Validates: Requirements 11.5**

**Property 53: Notification retention period is enforced**
*For any* notification older than 90 days, the notification should be automatically removed from the system.
**Validates: Requirements 11.6**

### SEO and Public Access Properties

**Property 54: Listings have SEO-friendly URLs and metadata**
*For any* published property listing, the listing should have an SEO-friendly URL, Schema.org structured data markup, and meta tags containing property details.
**Validates: Requirements 12.1, 12.2, 12.3**

**Property 55: Public listings are accessible without authentication**
*For any* active property listing, the listing should be viewable by non-authenticated users without requiring login.
**Validates: Requirements 12.5**

**Property 56: Non-authenticated users are prompted to register**
*For any* non-authenticated user viewing a listing, attempting to express interest should display a prompt to register or login.
**Validates: Requirements 12.6**

### Security and Privacy Properties

**Property 57: Sensitive data is encrypted**
*For any* sensitive data (passwords, payment information), the data should be encrypted using industry-standard encryption before storage.
**Validates: Requirements 13.1**

**Property 58: Role-based access control is enforced**
*For any* user attempting to access data, access should be granted only if the user's role has permission to access that data.
**Validates: Requirements 13.2**

**Property 59: Account deletion removes personal data**
*For any* user requesting account deletion, personal data should be removed while transaction records required for legal compliance are retained.
**Validates: Requirements 13.3**

**Property 60: Sensitive data access is logged**
*For any* access to sensitive data, an audit log entry should be created recording the user, timestamp, and data accessed.
**Validates: Requirements 13.4**

### Mobile and Cross-Device Properties

**Property 61: Mobile image loading is optimized**
*For any* property listing accessed from a mobile device, images should be served in optimized sizes appropriate for mobile bandwidth.
**Validates: Requirements 14.3**

**Property 62: Session state persists across devices**
*For any* user switching between devices, session state and user preferences should be maintained across the device transition.
**Validates: Requirements 14.6**

### Reporting Properties

**Property 63: Property performance reports are generated**
*For any* landlord, generating a property performance report should include occupancy rates, revenue, and maintenance costs for the specified time period.
**Validates: Requirements 15.1**

**Property 64: Reports export in multiple formats**
*For any* generated report, exporting should produce valid files in PDF, CSV, and Excel formats containing the report data.
**Validates: Requirements 15.2**

**Property 65: Report filters are applied correctly**
*For any* report with date range and filter criteria, the report should include only data matching the specified criteria.
**Validates: Requirements 15.3**

**Property 66: Scheduled reports are generated and delivered**
*For any* scheduled report, the report should be automatically generated at the scheduled time and emailed to the specified recipients.
**Validates: Requirements 15.5**

**Property 67: Tax summaries are generated**
*For any* landlord, generating a tax-ready financial summary should include all revenue, expenses, and commission payments for the specified tax year.
**Validates: Requirements 15.6**

## Error Handling

### Error Categories

The platform implements comprehensive error handling across all layers:

**1. Validation Errors (400 Bad Request)**
- Invalid input data (missing required fields, incorrect formats)
- Business rule violations (duplicate email, invalid date ranges)
- File upload errors (unsupported format, size exceeded)

**2. Authentication Errors (401 Unauthorized)**
- Invalid credentials
- Expired or invalid tokens
- Email not verified

**3. Authorization Errors (403 Forbidden)**
- Insufficient permissions for requested action
- Attempting to access another user's private data

**4. Not Found Errors (404 Not Found)**
- Requested resource does not exist
- Deleted or archived resources

**5. Conflict Errors (409 Conflict)**
- Duplicate resource creation
- Concurrent modification conflicts

**6. Server Errors (500 Internal Server Error)**
- Database connection failures
- External service failures (email, storage)
- Unexpected exceptions

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}
```

### Error Handling Strategies

**Frontend Error Handling:**
- Display user-friendly error messages
- Provide actionable guidance for resolution
- Log errors for debugging
- Implement retry logic for transient failures
- Show loading states during async operations

**Backend Error Handling:**
- Validate all inputs before processing
- Use try-catch blocks for exception handling
- Log all errors with context
- Return appropriate HTTP status codes
- Sanitize error messages to avoid exposing sensitive information

**Database Error Handling:**
- Handle connection failures with retry logic
- Implement transaction rollback on errors
- Handle constraint violations gracefully
- Log query errors for debugging

**External Service Error Handling:**
- Implement circuit breakers for external APIs
- Use fallback mechanisms when services are unavailable
- Queue operations for retry (email, social media posts)
- Log all external service failures

## Testing Strategy

### Dual Testing Approach

The platform requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases and boundary conditions
- Error handling scenarios
- Integration points between components
- Mock external dependencies (database, email, storage)

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: **Feature: ikhaya-rent-properties, Property {number}: {property_text}**

### Testing Framework Selection

**Backend Testing (Node.js/TypeScript):**
- **Unit Testing**: Jest
- **Property-Based Testing**: fast-check
- **API Testing**: Supertest
- **Database Testing**: In-memory PostgreSQL or test database

**Frontend Testing (React/TypeScript):**
- **Unit Testing**: Jest + React Testing Library
- **Property-Based Testing**: fast-check
- **E2E Testing**: Playwright or Cypress
- **Component Testing**: Storybook

### Test Coverage Requirements

- Minimum 80% code coverage for unit tests
- All correctness properties must have corresponding property-based tests
- All API endpoints must have integration tests
- Critical user flows must have E2E tests

### Testing Priorities

**High Priority (Must Test):**
1. Authentication and authorization
2. Payment and commission calculations
3. Lease agreement workflows
4. Data security and encryption
5. Search and filtering logic
6. Notification delivery

**Medium Priority (Should Test):**
1. Dashboard analytics calculations
2. Marketing campaign tracking
3. Report generation
4. File upload and validation
5. Email template rendering

**Low Priority (Nice to Test):**
1. UI component styling
2. Static content rendering
3. Non-critical user preferences

### Continuous Integration

- Run all tests on every commit
- Block merges if tests fail
- Generate coverage reports
- Run property-based tests with increased iterations (1000+) in CI
- Perform security scanning
- Run linting and type checking

### Test Data Management

- Use factories for generating test data
- Seed test database with realistic data
- Clean up test data after each test
- Use separate test database from development
- Mock external services (email, social media, payment gateways)

### Property-Based Test Configuration

Each property-based test must:
1. Run minimum 100 iterations (configurable higher in CI)
2. Use appropriate generators for input data
3. Include shrinking for minimal failing examples
4. Reference the design property in a comment
5. Test the property across the full input space

Example property test structure:

```typescript
// Feature: ikhaya-rent-properties, Property 1: Valid registration creates account and sends verification
test('valid registration creates account and sends verification', () => {
  fc.assert(
    fc.property(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        email: fc.emailAddress(),
        password: validPasswordGenerator(),
        role: fc.constantFrom('landlord', 'tenant')
      }),
      async (userData) => {
        const result = await authService.register(userData)
        expect(result).toBeDefined()
        expect(result.email).toBe(userData.email)
        expect(emailService.verificationEmailSent(userData.email)).toBe(true)
      }
    ),
    { numRuns: 100 }
  )
})
```

## Deployment and Infrastructure

### Firebase Deployment Architecture

**Firebase Hosting:**
- Static React app deployment
- Automatic SSL certificates
- Global CDN distribution
- Custom domain support
- Automatic cache invalidation on deploy

**Cloud Functions Deployment:**
- Node.js runtime environment
- Automatic scaling based on load
- Regional deployment for low latency
- Environment variable management
- Function versioning and rollback

**Firestore:**
- Multi-region replication for high availability
- Automatic backups
- Point-in-time recovery
- Automatic scaling

**Firebase Storage:**
- Global CDN for image delivery
- Automatic image optimization (via extensions)
- Lifecycle policies for old files
- Security rules for access control

**Monitoring and Logging:**
- Firebase Performance Monitoring
- Firebase Crashlytics for error tracking
- Cloud Functions logs in Google Cloud Console
- Firebase Analytics for user behavior
- Custom metrics and alerts

### Security Measures

- Firebase Authentication with email verification
- Firestore Security Rules for data access control
- Storage Security Rules for file access
- HTTPS enforced by Firebase Hosting
- Rate limiting via Cloud Functions
- Input validation in Cloud Functions
- XSS protection through React
- Regular security audits

### Scalability

- Automatic scaling of Cloud Functions
- Firestore automatic scaling (up to 1M concurrent connections)
- CDN caching for static assets and images
- Real-time listeners for efficient data sync
- Pagination for large data sets
- Lazy loading of images

### Backup and Disaster Recovery

- Automated daily Firestore backups
- 30-day backup retention
- Export to Google Cloud Storage
- Point-in-time recovery capability
- Multi-region data replication

### Development Workflow

```bash
# Local development
firebase emulators:start  # Run local emulators

# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy --only hosting,functions

# Rollback if needed
firebase hosting:rollback
```

### Environment Configuration

```javascript
// .env files for different environments
// .env.development
REACT_APP_FIREBASE_API_KEY=dev-key
REACT_APP_FIREBASE_PROJECT_ID=ikhaya-dev

// .env.production
REACT_APP_FIREBASE_API_KEY=prod-key
REACT_APP_FIREBASE_PROJECT_ID=ikhaya-prod
```
