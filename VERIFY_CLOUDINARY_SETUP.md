# Verify Cloudinary Setup

Your Cloudinary credentials are configured:
- Cloud Name: `dlrxspk2c`
- Upload Preset: `ikhaya_properties`

## Next Steps

### 1. Verify Upload Preset is "Unsigned"

Go to your Cloudinary console and verify the upload preset:

1. Visit: https://console.cloudinary.com/console/dlrxspk2c/settings/upload
2. Find the preset named `ikhaya_properties`
3. Make sure "Signing Mode" is set to **"Unsigned"**
4. If it's not, change it to "Unsigned" and save

### 2. Test Profile Image Upload

Now try uploading a profile image:

1. Go to http://localhost:3000/profile/settings
2. Click "Choose File" and select an image (JPG or PNG, max 5MB)
3. Fill in your name and phone number
4. Click "Save Changes"

The image should:
- Upload to Cloudinary
- Save the URL to your Firestore user document
- Display in the profile preview

### 3. If Still Getting Errors

Check the browser console (F12) for detailed error messages:

**Cloudinary Error**: Check that your upload preset is unsigned
**Firestore Error**: The rules have been deployed, but you may need to refresh your browser
**Network Error**: Check your internet connection

### 4. Verify in Firebase Console

After successful upload, verify the data was saved:

1. Go to: https://console.firebase.google.com/project/ikhaya-70537/firestore
2. Navigate to the `users` collection
3. Find your user document
4. Check that the `profileImage` field contains a Cloudinary URL like:
   `https://res.cloudinary.com/dlrxspk2c/image/upload/v.../ikhaya/profiles/...`

## Success!

Once the profile image uploads successfully, you'll see:
- ✅ Your profile image in the preview
- ✅ Success message: "Profile updated successfully!"
- ✅ The image will appear on property listings you create
- ✅ Tenants will see your photo when viewing your properties
