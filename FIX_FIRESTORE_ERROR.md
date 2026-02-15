# Fix Firestore Internal Error

The error you're seeing is a Firestore cache corruption issue. Here are the solutions:

## Quick Fix (Recommended)

**Clear your browser's IndexedDB cache:**

1. Open Chrome DevTools (F12)
2. Go to "Application" tab
3. In the left sidebar, expand "Storage"
4. Click "IndexedDB"
5. Right-click on your Firebase database
6. Select "Delete database"
7. Refresh the page (Ctrl+F5 or Cmd+Shift+R)

## Alternative: Use Incognito/Private Window

1. Open a new Incognito/Private window
2. Go to http://localhost:3001
3. Login again
4. Try accessing "Manage Landlords"

This will work because incognito doesn't have cached data.

## Permanent Fix: Clear All Browser Data

1. In Chrome, go to Settings
2. Privacy and Security → Clear browsing data
3. Select "Cached images and files" and "Cookies and other site data"
4. Time range: "All time"
5. Click "Clear data"
6. Restart your browser

## If Still Not Working

The code has been updated to use better Firestore persistence. After clearing cache:

1. Stop your development server (Ctrl+C)
2. Run: `npm start`
3. Wait for it to compile
4. Try again in a fresh browser window

## Why This Happens

This error occurs when:
- Firestore's local cache gets corrupted
- Multiple tabs are open with different Firestore states
- Switching between emulators and online Firebase
- Browser cache conflicts with new queries

## Prevention

To avoid this in the future:
- Close all tabs before switching between emulators and online Firebase
- Use incognito mode for testing
- Clear cache when switching environments
