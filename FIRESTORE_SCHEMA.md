# Firestore Collections Structure

This document provides a comprehensive overview of the Firestore database schema for IKHAYA RENT PROPERTIES.

## Table of Contents

1. [Overview](#overview)
2. [Collections](#collections)
3. [Subcollections](#subcollections)
4. [Indexes](#indexes)
5. [Security Rules](#security-rules)
6. [Data Relationships](#data-relationships)

## Overview

The IKHAYA RENT PROPERTIES platform uses Cloud Firestore as its NoSQL database. The database is organized into collections and subcollections, with each document containing structured data.

### Key Design Principles

- **Denormalization**: Some data is duplicated (e.g., `landlordId` in leads) to optimize query performance
- **Subcollections**: Used for one-to-many relationships (e.g., messages under leads)
- **Timestamps**: All documents include `createdAt` and `updatedAt` timestamps
- **Unique IDs**: Auto-generated document IDs ensure uniqueness

## Collections

### 1. Users Collection (`/users/{userId}`)

Stores user profile information for all platform users (landlords, tenants, and admins).

**Document ID**: Firebase Auth UID

**Schema**:
```typescript
{
  uid: string                    // Firebase Auth UID
  email: string
  name: string
  role: 'landlord' | 'tenant' | 'admin'
  phone?: string
  emailVerified: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Use Cases**:
- User authentication and authorization
- Profile management
- Role-based access control

**Access Patterns**:
- Get user by UID (direct document access)
- Query users by role
- Query users by email

---

### 2. Properties Collection (`/properties/{propertyId}`)

Stores property listings created by landlords.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
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
```

**Use Cases**:
- Property listing management
- Property search and discovery
- Property analytics

**Access Patterns**:
- Get property by ID
- Query properties by landlord
- Search properties by location, price, type
- Filter by status and premium flag

---

### 3. Leads Collection (`/leads/{leadId}`)

Stores tenant inquiries about properties.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string
  tenantId: string               // Reference to user
  propertyId: string             // Reference to property
  landlordId: string             // Denormalized for queries
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'closed'
  initialMessage: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Use Cases**:
- Lead generation and tracking
- Communication between tenants and landlords
- Lead conversion tracking

**Access Patterns**:
- Get leads by tenant
- Get leads by property
- Get leads by landlord
- Filter by status

---

### 4. Leases Collection (`/leases/{leaseId}`)

Stores lease agreements between landlords and tenants.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
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
```

**Use Cases**:
- Lease agreement management
- Digital signatures
- Lease expiration tracking
- Property occupancy status

**Access Patterns**:
- Get leases by landlord
- Get leases by tenant
- Get leases by property
- Query expiring leases (endDate within 30 days)

---

### 5. Maintenance Collection (`/maintenance/{requestId}`)

Stores maintenance requests submitted by tenants.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
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
```

**Use Cases**:
- Maintenance request tracking
- Issue prioritization
- Communication between tenants and landlords
- Maintenance history

**Access Patterns**:
- Get requests by property
- Get requests by landlord
- Get requests by tenant
- Filter by status and priority

---

### 6. Invoices Collection (`/invoices/{invoiceId}`)

Stores commission invoices for landlords.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
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
```

**Use Cases**:
- Commission tracking
- Payment management
- Financial reporting

**Access Patterns**:
- Get invoices by landlord
- Query overdue invoices
- Filter by status

---

### 7. Payments Collection (`/payments/{paymentId}`)

Stores payment records for invoices.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string
  invoiceId: string              // Reference to invoice
  landlordId: string             // Denormalized for queries
  amount: number
  paymentMethod: 'bank_transfer' | 'card' | 'cash'
  reference: string
  paymentDate: Timestamp
  createdAt: Timestamp
}
```

**Use Cases**:
- Payment tracking
- Payment history
- Financial reconciliation

**Access Patterns**:
- Get payments by invoice
- Get payments by landlord
- Query by payment date

---

### 8. Campaigns Collection (`/campaigns/{campaignId}`)

Stores marketing campaigns for property promotion.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
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
```

**Use Cases**:
- Marketing campaign management
- Social media integration
- Campaign performance tracking

**Access Patterns**:
- Get campaigns by status
- Query active campaigns
- Get campaigns by date range

---

### 9. Notifications Collection (`/notifications/{notificationId}`)

Stores in-app notifications for users.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string
  userId: string                 // Reference to user
  type: 'new_lead' | 'new_message' | 'maintenance_request' | 
        'lease_expiring' | 'payment_due' | 'payment_received' | 'listing_approved'
  title: string
  message: string
  link?: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  createdAt: Timestamp
}
```

**Use Cases**:
- User notifications
- Event alerts
- Communication tracking

**Access Patterns**:
- Get notifications by user
- Query unread notifications
- Filter by type

---

### 10. User Preferences Collection (`/userPreferences/{userId}`)

Stores user notification preferences and settings.

**Document ID**: User UID

**Schema**:
```typescript
{
  userId: string
  notifications: {
    email: boolean
    sms: boolean
    inApp: boolean
    types: Record<string, boolean>
  }
  updatedAt: Timestamp
}
```

**Use Cases**:
- Notification preferences
- User settings management

**Access Patterns**:
- Get preferences by user (direct document access)

---

### 11. Property Views Collection (`/propertyViews/{viewId}`)

Stores analytics data for property views.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string
  propertyId: string
  userId?: string                // Optional if not logged in
  ipAddress?: string
  userAgent?: string
  viewedAt: Timestamp
}
```

**Use Cases**:
- Property analytics
- View tracking
- Popular property identification

**Access Patterns**:
- Get views by property
- Get views by user
- Query by date range

---

## Subcollections

### 1. Messages Subcollection (`/leads/{leadId}/messages/{messageId}`)

Stores messages exchanged between tenant and landlord for a specific lead.

**Parent Collection**: Leads

**Schema**:
```typescript
{
  id: string
  senderId: string               // Reference to user
  content: string
  read: boolean
  createdAt: Timestamp
}
```

**Use Cases**:
- Lead communication
- Message history
- Unread message tracking

**Access Patterns**:
- Get messages by lead (chronological order)
- Query unread messages

---

### 2. Saved Properties Subcollection (`/users/{userId}/savedProperties/{propertyId}`)

Stores properties saved/bookmarked by a user.

**Parent Collection**: Users

**Schema**:
```typescript
{
  propertyId: string
  savedAt: Timestamp
}
```

**Use Cases**:
- Property bookmarking
- User favorites
- Quick access to saved properties

**Access Patterns**:
- Get saved properties by user
- Check if property is saved

---

## Indexes

Firestore requires composite indexes for complex queries. Below are the required indexes:

### Properties Collection
```javascript
- landlordId + status + createdAt (DESC)
- city + status + rentAmount (ASC)
- status + isPremium (DESC) + createdAt (DESC)
- propertyType + status + rentAmount (ASC)
```

### Leads Collection
```javascript
- tenantId + status + createdAt (DESC)
- propertyId + status + createdAt (DESC)
- landlordId + status + createdAt (DESC)
```

### Leases Collection
```javascript
- landlordId + status + endDate (ASC)
- tenantId + status + endDate (ASC)
- propertyId + status + startDate (DESC)
- status + endDate (ASC)
```

### Maintenance Collection
```javascript
- propertyId + status + priority (DESC)
- landlordId + status + createdAt (DESC)
- tenantId + createdAt (DESC)
- status + priority (DESC) + createdAt (DESC)
```

### Notifications Collection
```javascript
- userId + read + createdAt (DESC)
- userId + type + read + createdAt (DESC)
```

### Invoices Collection
```javascript
- landlordId + status + dueDate (ASC)
- status + dueDate (ASC)
```

### Payments Collection
```javascript
- invoiceId + createdAt (DESC)
- landlordId + createdAt (DESC)
- paymentDate (DESC)
```

### Property Views Collection
```javascript
- propertyId + viewedAt (DESC)
- userId + viewedAt (DESC)
```

### Messages Subcollection
```javascript
- createdAt (ASC)
- read + createdAt (ASC)
```

### Saved Properties Subcollection
```javascript
- savedAt (DESC)
```

---

## Security Rules

Firestore Security Rules enforce access control at the database level. Key rules include:

### Users Collection
- **Read**: Any authenticated user
- **Create**: Owner only (matching auth UID)
- **Update**: Owner only
- **Delete**: Owner only

### Properties Collection
- **Read**: Public (anyone can view listings)
- **Create**: Landlords only
- **Update**: Owner landlord only
- **Delete**: Owner landlord only

### Leads Collection
- **Read**: Tenant or landlord involved in the lead
- **Create**: Tenants only
- **Update**: Tenant or landlord involved

### Messages Subcollection
- **Read**: Tenant or landlord involved in the parent lead
- **Create**: Tenant or landlord involved in the parent lead

### Leases Collection
- **Read**: Landlord or tenant involved in the lease
- **Create**: Landlords only
- **Update**: Landlord or tenant involved (for signatures)

### Maintenance Collection
- **Read**: Tenant or landlord involved
- **Create**: Tenants only
- **Update**: Tenant or landlord involved

### Invoices Collection
- **Read**: Owner landlord or admin
- **Create**: Admin only (via Cloud Functions)
- **Update**: Admin only

### Payments Collection
- **Read**: Owner landlord or admin
- **Create**: Landlord or admin
- **Update**: Admin only

### Notifications Collection
- **Read**: Owner user only
- **Create**: System (Cloud Functions)
- **Update**: Owner user only (for marking as read)

### User Preferences Collection
- **Read**: Owner user only
- **Create**: Owner user only
- **Update**: Owner user only

### Saved Properties Subcollection
- **Read**: Owner user only
- **Create**: Owner user only
- **Delete**: Owner user only

### Property Views Collection
- **Read**: Admin only
- **Create**: Anyone (including anonymous)
- **Delete**: Admin only

---

## Data Relationships

### One-to-Many Relationships

1. **User → Properties**: One landlord can have many properties
   - Access via: `landlordId` field in properties

2. **User → Leads (as Tenant)**: One tenant can have many leads
   - Access via: `tenantId` field in leads

3. **User → Leads (as Landlord)**: One landlord can receive many leads
   - Access via: `landlordId` field in leads

4. **Property → Leads**: One property can have many leads
   - Access via: `propertyId` field in leads

5. **Lead → Messages**: One lead can have many messages
   - Access via: subcollection `/leads/{leadId}/messages`

6. **User → Leases (as Landlord)**: One landlord can have many leases
   - Access via: `landlordId` field in leases

7. **User → Leases (as Tenant)**: One tenant can have many leases
   - Access via: `tenantId` field in leases

8. **Property → Maintenance Requests**: One property can have many maintenance requests
   - Access via: `propertyId` field in maintenance

9. **User → Invoices**: One landlord can have many invoices
   - Access via: `landlordId` field in invoices

10. **Invoice → Payments**: One invoice can have many payments
    - Access via: `invoiceId` field in payments

11. **User → Notifications**: One user can have many notifications
    - Access via: `userId` field in notifications

12. **User → Saved Properties**: One user can save many properties
    - Access via: subcollection `/users/{userId}/savedProperties`

### Many-to-Many Relationships

1. **Campaigns ↔ Properties**: One campaign can include many properties, and one property can be in many campaigns
   - Implemented via: `propertyIds` array in campaigns

2. **Invoices ↔ Leases**: One invoice can include multiple leases, and one lease can appear in multiple invoices
   - Implemented via: `leaseIds` array in invoices

### Denormalized Data

To optimize query performance, some data is denormalized:

1. **landlordId in Leads**: Copied from the property to enable efficient landlord queries
2. **landlordId in Maintenance**: Copied from the property to enable efficient landlord queries
3. **landlordId in Payments**: Copied from the invoice to enable efficient landlord queries

---

## Usage Examples

### Creating a New Property

```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-config';
import { COLLECTIONS } from './types/firestore-schema';

const propertyData = {
  landlordId: 'user123',
  address: '123 Main St',
  city: 'Cape Town',
  province: 'Western Cape',
  propertyType: 'apartment',
  bedrooms: 2,
  bathrooms: 1,
  rentAmount: 8000,
  deposit: 16000,
  description: 'Beautiful 2-bedroom apartment',
  amenities: ['parking', 'wifi'],
  availableFrom: Timestamp.now(),
  status: 'available',
  isPremium: false,
  images: [],
  viewCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const docRef = await addDoc(collection(db, COLLECTIONS.PROPERTIES), propertyData);
```

### Querying Properties by City

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, COLLECTIONS.PROPERTIES),
  where('city', '==', 'Cape Town'),
  where('status', '==', 'available')
);

const querySnapshot = await getDocs(q);
const properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Adding a Message to a Lead

```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCollectionPath } from './types/firestore-schema';

const messageData = {
  senderId: 'user456',
  content: 'Is the property still available?',
  read: false,
  createdAt: serverTimestamp(),
};

const messagesRef = collection(db, getCollectionPath.messages('lead123'));
await addDoc(messagesRef, messageData);
```

---

## Best Practices

1. **Use Timestamps**: Always use `serverTimestamp()` for consistency across clients
2. **Validate Data**: Validate all data before writing to Firestore
3. **Use Transactions**: Use transactions for operations that require atomicity
4. **Batch Writes**: Use batch writes for multiple related operations
5. **Optimize Queries**: Design indexes based on your query patterns
6. **Security First**: Always enforce security rules at the database level
7. **Monitor Usage**: Track read/write operations to optimize costs
8. **Use Subcollections**: Use subcollections for one-to-many relationships with large datasets
9. **Denormalize Wisely**: Denormalize data only when it significantly improves query performance
10. **Clean Up**: Implement cleanup logic for deleted documents and orphaned data

---

## Migration and Maintenance

### Adding New Fields

When adding new fields to existing collections:
1. Update the TypeScript interface in `firebase.ts`
2. Update the schema documentation in this file
3. Deploy Cloud Functions to backfill existing documents if needed
4. Update security rules if the new field affects access control

### Removing Fields

When removing fields:
1. Mark the field as deprecated in the TypeScript interface
2. Update the schema documentation
3. Deploy Cloud Functions to remove the field from existing documents
4. After all documents are updated, remove the field from the interface

### Changing Field Types

Field type changes require careful migration:
1. Add a new field with the new type
2. Deploy Cloud Functions to migrate data
3. Update application code to use the new field
4. Remove the old field after migration is complete

---

## Conclusion

This Firestore schema provides a solid foundation for the IKHAYA RENT PROPERTIES platform. It supports all required features while maintaining flexibility for future enhancements. Regular reviews and optimizations based on usage patterns will ensure the database continues to perform efficiently as the platform grows.
