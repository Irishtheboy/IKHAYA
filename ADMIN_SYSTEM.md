# Admin System Documentation

## Overview

The IKHAYA RENT PROPERTIES platform now includes an admin role that manages landlord registrations. Landlords must be approved by an admin before they can post properties or use the platform.

## User Roles

The system supports three user roles:

1. **Admin** - Platform administrators who approve landlord registrations
2. **Landlord** - Property owners who list properties (requires admin approval)
3. **Tenant** - Users looking for properties (no approval required)

## Landlord Approval Workflow

### 1. Landlord Registration

When a user registers as a landlord:
- Account is created in Firebase Auth
- User profile is created in Firestore with `approved: false`
- Landlord receives confirmation email
- Landlord is informed that approval is required

### 2. Admin Approval Process

Admins can:
- View all pending landlord registrations
- Review landlord information (name, email, phone, registration date)
- Approve or reject landlord accounts
- View all approved landlords
- Revoke approval if needed

### 3. Post-Approval

Once approved:
- Landlord can log in and access full platform features
- Landlord can create and manage properties
- Landlord can create leases and manage leads
- `approved` field is set to `true` in Firestore
- `approvedBy` and `approvedAt` fields are populated

## Admin Dashboard Features

### Statistics Cards
- Pending Approvals count
- Approved Landlords count
- Total Tenants count
- Total Users count

### Pending Landlord Registrations Table
- Name, email, phone, registration date
- Approve/Reject actions
- Real-time updates

### Quick Actions
- Manage Landlords - View all landlords with filtering
- Manage Users - View all users with search and role filtering
- View Reports - Access system reports

## Admin Pages

### 1. Admin Dashboard (`/dashboard`)
- Overview of platform statistics
- Pending landlord approvals
- Quick action links

### 2. Manage Landlords (`/admin/landlords`)
- Filter by: All, Pending, Approved
- Approve/Revoke landlord accounts
- View landlord details

### 3. Manage Users (`/admin/users`)
- Search by name, email, or phone
- Filter by role (Admin, Landlord, Tenant)
- View user statistics
- See approval status for landlords

## Security & Access Control

### Firestore Security Rules


**Landlord Approval Check:**
- Only approved landlords can create properties
- Only approved landlords can create leases
- Unapproved landlords see a pending approval message on their dashboard

**Admin Privileges:**
- Admins can update user approval status
- Admins can view all users and landlords
- Admins have full access to invoices, payments, and campaigns

**User Profile Updates:**
- Users cannot change their own approval status
- Users cannot change their role
- Only admins can modify approval fields

### Firestore Indexes

Required composite indexes for admin queries:
```json
{
  "collectionGroup": "users",
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "approved", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "users",
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "approved", "order": "ASCENDING" },
    { "fieldPath": "approvedAt", "order": "DESCENDING" }
  ]
}
```

## User Schema Updates

### User Type
```typescript
export interface User {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole; // 'admin' | 'landlord' | 'tenant'
  phone?: string;
  emailVerified: boolean;
  approved?: boolean; // For landlords - requires admin approval
  approvedBy?: string; // Admin user ID who approved
  approvedAt?: Timestamp; // When approved
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## API Services

### Admin Service (`adminService.ts`)

**Methods:**
- `getPendingLandlords()` - Get all landlords awaiting approval
- `getApprovedLandlords()` - Get all approved landlords
- `approveLandlord(landlordId, adminId)` - Approve a landlord
- `rejectLandlord(landlordId)` - Reject/revoke landlord approval
- `getAllUsers()` - Get all users for admin management
- `getDashboardStats()` - Get statistics for admin dashboard

### Auth Service Updates

**Registration:**
- Landlords are automatically set to `approved: false`
- Tenants and admins are set to `approved: true`
- Approval fields are initialized during registration

## Components

### AdminDashboard
- Main admin dashboard with statistics and pending approvals
- Located at: `src/components/dashboard/AdminDashboard.tsx`

### AdminLandlords
- Landlord management page with filtering
- Located at: `src/pages/AdminLandlords.tsx`

### AdminUsers
- User management page with search and filtering
- Located at: `src/pages/AdminUsers.tsx`

## Routes

```typescript
{
  path: '/dashboard',
  element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  // Shows AdminDashboard for admins
  // Shows pending approval message for unapproved landlords
  // Shows LandlordDashboard for approved landlords
  // Shows TenantDashboard for tenants
}

{
  path: '/admin/landlords',
  element: <ProtectedRoute><AdminLandlords /></ProtectedRoute>
}

{
  path: '/admin/users',
  element: <ProtectedRoute><AdminUsers /></ProtectedRoute>
}
```

## Creating the First Admin User

Since landlords require approval, you'll need to create the first admin user manually:

### Option 1: Firebase Console
1. Create a user in Firebase Authentication
2. Add a document in the `users` collection with:
   ```json
   {
     "uid": "firebase-auth-uid",
     "email": "admin@example.com",
     "name": "Admin User",
     "role": "admin",
     "emailVerified": true,
     "approved": true,
     "createdAt": "current-timestamp",
     "updatedAt": "current-timestamp"
   }
   ```

### Option 2: Firestore Rules (Temporary)
1. Temporarily modify Firestore rules to allow admin creation
2. Register through the app with role "admin"
3. Restore security rules

### Option 3: Cloud Function
Create a Cloud Function that can be called once to create the first admin:
```typescript
export const createFirstAdmin = functions.https.onCall(async (data, context) => {
  // Add security check (e.g., secret key)
  // Create admin user
});
```

## User Experience

### For Landlords
1. Register as landlord
2. See notice about approval requirement during registration
3. After registration, dashboard shows "Account Pending Approval" message
4. Cannot create properties or leases until approved
5. Receive email notification when approved (future enhancement)

### For Admins
1. Log in to admin account
2. Dashboard shows pending landlord count
3. Review and approve/reject landlords
4. Manage all users and landlords
5. Access full platform analytics

### For Tenants
1. Register as tenant
2. Immediate access to all features
3. No approval required
4. Can browse properties and create leads

## Future Enhancements

1. **Email Notifications**
   - Send email to landlord when approved
   - Send email to admin when new landlord registers

2. **Rejection Reasons**
   - Allow admins to provide rejection reasons
   - Store rejection history

3. **Bulk Actions**
   - Approve multiple landlords at once
   - Export landlord data

4. **Audit Log**
   - Track all admin actions
   - View approval history

5. **Advanced Filtering**
   - Filter by registration date range
   - Filter by approval status
   - Search functionality

## Testing

### Test Scenarios

1. **Landlord Registration**
   - Register as landlord
   - Verify `approved: false` in Firestore
   - Verify pending message on dashboard

2. **Admin Approval**
   - Log in as admin
   - Approve a pending landlord
   - Verify `approved: true` and approval fields populated

3. **Landlord Access**
   - Log in as unapproved landlord
   - Verify cannot create properties
   - Log in as approved landlord
   - Verify can create properties

4. **Security Rules**
   - Attempt to update approval status as landlord (should fail)
   - Attempt to create property as unapproved landlord (should fail)
   - Verify admin can update approval status

## Deployment Checklist

- [ ] Deploy Firestore security rules
- [ ] Deploy Firestore indexes
- [ ] Create first admin user
- [ ] Test landlord registration flow
- [ ] Test admin approval flow
- [ ] Test security rules
- [ ] Update documentation
- [ ] Train admin users

## Support

For issues or questions about the admin system:
1. Check Firestore security rules are deployed
2. Verify indexes are created
3. Check user role in Firestore
4. Review browser console for errors
5. Check Firebase logs for security rule violations
