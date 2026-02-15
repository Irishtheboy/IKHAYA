# Create Your First Admin Account

Follow these steps to create your admin account:

## Step 1: Register a Regular Account

1. Go to http://localhost:3000/register
2. Register with your email (e.g., francolukhele14@gmail.com)
3. Choose "Tenant" as the role (we'll change this to admin)
4. Complete the registration

## Step 2: Make Yourself Admin in Firestore

1. Go to [Firestore Console](https://console.firebase.google.com/project/ikhaya-70537/firestore/data)
2. Navigate to the `users` collection
3. Find your user document (search by email)
4. Click "Edit" on your user document
5. Update these fields:
   ```
   role: "admin"
   approved: true
   ```
6. Click "Update"

## Step 3: Refresh Your App

1. Refresh your browser at http://localhost:3000
2. You should now see "Admin Dashboard" in the navigation
3. You now have full admin access!

## What Admins Can Do

✅ Create landlord accounts directly (no self-registration)
✅ View all users (landlords and tenants)
✅ Enable/disable user accounts
✅ Approve/revoke landlord access
✅ Track all platform activity
✅ Manage properties, leases, and maintenance requests

## Next Steps

After becoming admin:
1. Go to Admin Dashboard
2. Use "Create Landlord" to add landlord accounts
3. Landlords will receive login credentials via email
4. You can enable/disable any account at any time
