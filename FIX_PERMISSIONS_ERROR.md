# Fix "Missing or insufficient permissions" Error

## Problem
When uploading profile images or updating user data, you get a "Missing or insufficient permissions" error from Firestore.

## Solution

### Step 1: Deploy Updated Firestore Rules

I've updated the `firestore.rules` file to allow users to update their profile information including profile images. You need to deploy these rules to Firebase.

Run this command in your terminal:

```bash
firebase deploy --only firestore:rules
```

### Step 2: Verify Cloudinary Configuration

Make sure your Cloudinary credentials are set in your `.env.local` file:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

To get these values:

1. Go to https://cloudinary.com/console
2. Your Cloud Name is shown in the dashboard
3. For Upload Preset:
   - Go to Settings → Upload
   - Scroll to "Upload presets"
   - Create a new unsigned preset or use an existing one
   - Set the preset name in your .env file

### Step 3: Configure Cloudinary Upload Preset

Your Cloudinary upload preset must be set to "Unsigned" to allow client-side uploads:

1. Go to Cloudinary Console → Settings → Upload
2. Find or create an upload preset
3. Set "Signing Mode" to "Unsigned"
4. Set "Folder" to "ikhaya" (optional, for organization)
5. Save the preset

### Step 4: Restart Your Development Server

After updating the .env file:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm start
```

## What Changed in Firestore Rules

The updated rules now allow users to:
- Update their `name` field
- Update their `phone` field  
- Update their `profileImage` field
- Update their `updatedAt` timestamp

But prevent users from changing:
- Their `uid`
- Their `email`
- Their `role`
- Their `approved` status
- Their `disabled` status

Only admins can change approval and disabled status.

## Testing

After deploying the rules, try uploading a profile image again:

1. Go to Profile Settings (`/profile/settings`)
2. Select an image file (JPG or PNG, max 5MB)
3. Click "Save Changes"
4. The image should upload to Cloudinary
5. The profile should update in Firestore with the new image URL

## Troubleshooting

### Still getting permissions error?

1. Check Firebase Console → Firestore → Rules tab
2. Verify the rules were deployed correctly
3. Check the browser console for detailed error messages

### Cloudinary upload failing?

1. Verify your Cloud Name and Upload Preset in .env.local
2. Check that the upload preset is set to "Unsigned"
3. Check browser console for Cloudinary-specific errors

### Image not showing after upload?

1. Check that the image URL was saved to Firestore
2. Go to Firebase Console → Firestore → users collection
3. Find your user document
4. Verify the `profileImage` field contains a Cloudinary URL

## Alternative: Test Mode (Temporary)

If you need to test immediately, you can temporarily use test mode rules (NOT RECOMMENDED FOR PRODUCTION):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Deploy with:
```bash
firebase deploy --only firestore:rules
```

**IMPORTANT**: Remember to revert to the proper rules before going to production!
