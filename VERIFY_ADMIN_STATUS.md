# Verify Your Admin Status

## Quick Check

Open your browser console (F12) and run this:

```javascript
// Check if you're logged in and your role
console.log('Current user:', firebase.auth().currentUser?.email);
```

## Verify in Firestore Console

1. Go to: https://console.firebase.google.com/project/ikhaya-70537/firestore/data/~2Fusers

2. Find your user document (search by email: francolukhele14@gmail.com)

3. Check these fields:
   ```
   role: "admin"  ✓ (must be exactly "admin")
   approved: true ✓ (should be true)
   disabled: false ✓ (or field doesn't exist)
   ```

## If Your Dashboard is Blank

This usually means one of these issues:

### Issue 1: Not Set as Admin
**Solution**: In Firestore, edit your user document and set `role: "admin"`

### Issue 2: Page is Loading
**Check**: Look for "Loading admin dashboard..." text

### Issue 3: Error Loading Data
**Check**: Browser console (F12) for error messages

### Issue 4: Firestore Index Not Ready
**Check**: The index for leads might still be building
**Solution**: Wait 2-3 minutes for indexes to build

## Manual Fix

If you see a blank page:

1. **Open Firestore Console**: https://console.firebase.google.com/project/ikhaya-70537/firestore/data

2. **Find your user**:
   - Collection: `users`
   - Search for: francolukhele14@gmail.com

3. **Edit the document** and ensure:
   ```
   {
     "role": "admin",
     "approved": true,
     "email": "francolukhele14@gmail.com",
     "name": "Your Name",
     "uid": "your-firebase-uid",
     "createdAt": (timestamp),
     "updatedAt": (timestamp),
     "emailVerified": false
   }
   ```

4. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)

5. **Clear browser cache** if still not working

## Test Admin Access

After setting yourself as admin, you should see:

✅ "Admin Dashboard" in the navigation
✅ Statistics cards (Pending Approvals, Approved Landlords, etc.)
✅ "Manage Landlords" and "Manage Users" buttons
✅ Quick action cards at the bottom

## Still Not Working?

Check browser console for errors:
1. Press F12
2. Go to Console tab
3. Look for red error messages
4. Share the error message for help

## Common Errors

**"Failed to load dashboard data"**
- Firestore rules might be blocking access
- Check that you're logged in

**"Permission denied"**
- Your user role is not set to "admin"
- Check Firestore user document

**Blank page with no errors**
- Clear browser cache
- Try incognito/private window
- Check if JavaScript is enabled
