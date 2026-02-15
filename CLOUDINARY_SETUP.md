# Cloudinary Setup Guide

## Step 1: Get Your Cloudinary Credentials

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Sign in or create a free account
3. On the dashboard, you'll see:
   - **Cloud Name**: (e.g., `dxxxxx`)
   - **API Key**: (e.g., `123456789012345`)
   - **API Secret**: `sU-TX4eRBUkm6VRrtIxtMMYHpP0` (you already have this)

## Step 2: Create an Upload Preset

1. In Cloudinary Console, go to **Settings** (gear icon)
2. Click on **Upload** tab
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `ikhaya_properties` (or any name you like)
   - **Signing Mode**: Select **Unsigned** (for client-side uploads)
   - **Folder**: Leave empty or set to `ikhaya`
   - **Access Mode**: **Public**
6. Click **Save**

## Step 3: Update Environment Variables

Open `.env.local` and update these values:

```env
# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
REACT_APP_CLOUDINARY_UPLOAD_PRESET=ikhaya_properties
```

Replace:
- `your-cloud-name-here` with your actual Cloud Name from Step 1
- `ikhaya_properties` with your upload preset name from Step 2

## Step 4: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
```

## Step 5: Test Image Upload

1. Go to your app
2. Try creating a property with images
3. Images should now upload to Cloudinary successfully!

## What's Been Changed

✅ Replaced Firebase Storage with Cloudinary
✅ Created `cloudinaryService.ts` for image uploads
✅ Updated `propertyService.ts` to use Cloudinary
✅ Added automatic image optimization support

## Benefits of Cloudinary

- ✅ No CORS issues
- ✅ Automatic image optimization
- ✅ Built-in CDN for fast delivery
- ✅ Free tier: 25GB storage, 25GB bandwidth/month
- ✅ Easy transformations (resize, crop, quality)

## Image Optimization

Cloudinary automatically optimizes images. You can also get different sizes:

```typescript
// Get optimized thumbnail
const thumbnail = cloudinaryService.getOptimizedUrl(imageUrl, 300, 200, 80);

// Get full-size optimized
const fullSize = cloudinaryService.getOptimizedUrl(imageUrl, 1200, 800, 90);
```

## Troubleshooting

### "Upload preset not found"
- Make sure you created an unsigned upload preset
- Check the preset name matches in `.env.local`

### "Invalid cloud name"
- Verify your cloud name in Cloudinary dashboard
- Make sure there are no spaces or typos in `.env.local`

### Images not uploading
- Check browser console for errors
- Verify environment variables are set correctly
- Restart development server after changing `.env.local`

## Next Steps

After setup:
1. Test property creation with images
2. Images will be stored in Cloudinary under `ikhaya/properties/` folder
3. All existing Firebase Storage code has been replaced
