# Property Status Management System

## Overview
Landlords can manage the visibility and status of their properties through a simple status system.

## Property Statuses

### 1. Available (Green Badge)
- **Visibility**: ✅ Shown in public search results
- **Purpose**: Property is actively listed and available for rent
- **Use when**: Property is ready to be rented and you want tenants to find it

### 2. Occupied (Blue Badge)
- **Visibility**: ❌ Hidden from public search results
- **Purpose**: Property is currently rented/leased
- **Use when**: You've found a tenant and the property is occupied
- **Note**: You can still see it in your "Manage Properties" dashboard

### 3. Inactive (Gray Badge)
- **Visibility**: ❌ Hidden from public search results
- **Purpose**: Property is temporarily off the market
- **Use when**: 
  - Property is sold
  - Property needs repairs/renovations
  - You want to pause the listing temporarily
  - Property is being prepared for new tenants
- **Note**: You can still see it in your "Manage Properties" dashboard

## How to Change Property Status

### From Manage Properties Page

1. Go to **Dashboard** → **Manage Properties** (or navigate to `/properties/manage`)
2. Find the property you want to update
3. In the property card, locate the status dropdown at the bottom
4. Click the dropdown and select the new status:
   - **Available** - Make property visible in search
   - **Occupied** - Mark as rented (hidden from search)
   - **Inactive** - Temporarily hide from search
5. The change is saved immediately

### Status Dropdown Location
The status dropdown appears in the actions section at the bottom of each property card, between the "Edit" button and "Delete" button.

## What Happens When You Change Status

### Setting to "Available"
- ✅ Property appears in public search results
- ✅ Tenants can view the property details
- ✅ Property shows up in property listings
- ✅ Tenants can contact you about the property

### Setting to "Occupied"
- ❌ Property is hidden from public search
- ✅ You can still see it in your dashboard
- ✅ Property information is preserved
- ✅ You can change back to "Available" when tenant moves out

### Setting to "Inactive"
- ❌ Property is hidden from public search
- ✅ You can still see it in your dashboard
- ✅ Property information is preserved
- ✅ You can reactivate it anytime by changing to "Available"

## Dashboard Statistics

Your "Manage Properties" page shows:
- **Total Properties**: All your properties (any status)
- **Available**: Properties currently listed and searchable
- **Occupied**: Properties that are rented

## Best Practices

### When Property is Rented
1. Change status to **"Occupied"**
2. This removes it from search results
3. Keeps the property in your records
4. When tenant moves out, change back to **"Available"**

### When Property is Sold
1. Change status to **"Inactive"**
2. Or delete the property entirely if you won't need the record

### Temporary Removal
1. Change status to **"Inactive"**
2. Make necessary updates/repairs
3. Change back to **"Available"** when ready

### Seasonal Rentals
1. Set to **"Available"** during rental season
2. Set to **"Inactive"** during off-season
3. Easy to toggle on/off as needed

## Technical Details

### Search Filtering
The public property search (`/search`) automatically filters to only show properties with `status === 'available'`. This is enforced at the database query level for performance.

### Landlord View
The "Manage Properties" page (`/properties/manage`) shows ALL your properties regardless of status, so you never lose track of your listings.

### Status Badges
Each property card displays a colored badge indicating its current status:
- 🟢 Green = Available
- 🔵 Blue = Occupied  
- ⚪ Gray = Inactive

## Common Scenarios

### Scenario 1: Found a Tenant
**Action**: Change status from "Available" to "Occupied"
**Result**: Property disappears from search, but you can still see it in your dashboard

### Scenario 2: Tenant Moving Out
**Action**: Change status from "Occupied" to "Available"
**Result**: Property reappears in search results for new tenants to find

### Scenario 3: Property Needs Repairs
**Action**: Change status to "Inactive"
**Result**: Property hidden while you make repairs, easy to reactivate when ready

### Scenario 4: Property Sold
**Action**: Change status to "Inactive" or delete the property
**Result**: Property permanently removed from search

## Summary

The status system gives you complete control over which properties are visible to potential tenants while keeping all your property records organized in one place. You can easily toggle properties on and off the market as needed.
