# Cloud Functions Setup Guide

This guide explains the Cloud Functions implementation for IKHAYA RENT PROPERTIES.

## Overview

Cloud Functions provide serverless backend logic that runs in response to events triggered by Firebase features and HTTPS requests. For this project, we use Cloud Functions to:

1. **User Setup** - Automatically configure new users when they register
2. **Custom Claims** - Set role-based permissions for authentication
3. **Email Notifications** - Send welcome emails and other notifications
4. **Data Cleanup** - Remove user data when accounts are deleted

## Architecture

```
Firebase Auth Event (User Created)
         ↓
   onUserCreate Function
         ↓
    ┌────┴────┐
    ↓         ↓
Set Custom   Send Welcome
  Claims       Email
    ↓         ↓
  Done      Done
```

## Implemented Functions

### 1. onUserCreate

**Trigger:** Firebase Authentication - User Creation

**Purpose:** Set up new user accounts with proper permissions and welcome them to the platform.

**Actions:**
1. Retrieves user document from Firestore to get the role
2. Sets custom claims on the Firebase Auth user:
   - `role`: 'landlord', 'tenant', or 'admin'
   - `landlord`: boolean flag
   - `tenant`: boolean flag
   - `admin`: boolean flag
3. Logs welcome email (to be sent via email service in production)

**Requirements:** Validates Requirement 1.1 - User Registration and Authentication

**Code Location:** `functions/src/index.ts`

### 2. onUserDelete

**Trigger:** Firebase Authentication - User Deletion

**Purpose:** Clean up user data when an account is deleted.

**Actions:**
1. Deletes user document from Firestore
2. Placeholder for additional cleanup (properties, leads, etc.)

**Code Location:** `functions/src/index.ts`

## Custom Claims

Custom claims are set on the user's authentication token and can be accessed in:

### Frontend (React)
```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const idTokenResult = await user.getIdTokenResult();
  const role = idTokenResult.claims.role; // 'landlord' | 'tenant' | 'admin'
  const isLandlord = idTokenResult.claims.landlord; // boolean
}
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{propertyId} {
      // Only landlords can create properties
      allow create: if request.auth.token.landlord == true;
      
      // Only the property owner can update/delete
      allow update, delete: if request.auth.token.landlord == true &&
                               resource.data.landlordId == request.auth.uid;
    }
  }
}
```

### Cloud Functions
```typescript
export const someFunction = functions.https.onCall((data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Check user role
  const role = context.auth.token.role;
  if (role !== 'landlord') {
    throw new functions.https.HttpsError('permission-denied', 'Only landlords can perform this action');
  }
  
  // Function logic here
});
```

## Local Development

### Start Emulators

The Firebase Emulators allow you to test Cloud Functions locally without deploying to production.

```bash
# From project root
npm run emulators
```

This starts:
- Auth Emulator (port 9099)
- Firestore Emulator (port 8080)
- Storage Emulator (port 9199)
- **Functions Emulator (port 5001)**
- Emulator UI (port 4000)

### Test the onUserCreate Function

1. Start the emulators
2. Register a new user through the React app
3. Check the Functions Emulator logs in the terminal
4. Verify custom claims are set by checking the Auth Emulator UI at http://localhost:4000

### View Function Logs

```bash
# Real-time logs during emulator session
# Logs appear in the terminal where emulators are running

# Or view in Emulator UI
# Navigate to http://localhost:4000 > Logs tab
```

## Deployment

### Prerequisites

1. Ensure you're logged into Firebase CLI:
   ```bash
   firebase login
   ```

2. Select the correct project:
   ```bash
   firebase use <project-id>
   ```

### Deploy Functions

```bash
# Deploy all functions
npm run deploy:functions

# Or deploy specific function
firebase deploy --only functions:onUserCreate
```

### Verify Deployment

1. Check Firebase Console > Functions
2. View function logs
3. Test by creating a new user in production

## Email Integration (Production)

The current implementation logs welcome emails to the console. For production, integrate with an email service:

### Option 1: Firebase Extensions (Recommended)

1. Install "Trigger Email" extension:
   ```bash
   firebase ext:install firebase/firestore-send-email
   ```

2. Configure with your email provider (SendGrid, Mailgun, etc.)

3. Update `onUserCreate` to write to the email collection:
   ```typescript
   await admin.firestore().collection('mail').add({
     to: email,
     message: {
       subject: 'Welcome to IKHAYA RENT PROPERTIES',
       text: welcomeEmail.text,
       html: welcomeEmail.html,
     },
   });
   ```

### Option 2: Direct Integration

1. Install email service SDK:
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```

2. Set API key:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_API_KEY"
   ```

3. Update function code:
   ```typescript
   import * as sgMail from '@sendgrid/mail';
   
   sgMail.setApiKey(functions.config().sendgrid.key);
   
   await sgMail.send({
     to: email,
     from: 'noreply@ikhayarentproperties.com',
     subject: 'Welcome to IKHAYA RENT PROPERTIES',
     text: welcomeEmail.text,
     html: welcomeEmail.html,
   });
   ```

## Monitoring

### View Logs

```bash
# Real-time logs
firebase functions:log

# Filter by function
firebase functions:log --only onUserCreate

# View last N lines
firebase functions:log --lines 100
```

### Firebase Console

1. Go to Firebase Console > Functions
2. Click on a function name
3. View:
   - Invocations count
   - Execution time
   - Error rate
   - Logs

### Set Up Alerts

1. Go to Firebase Console > Functions
2. Click on a function
3. Set up alerts for:
   - High error rate
   - Slow execution time
   - High invocation count

## Security Best Practices

1. **Validate Input**: Always validate data before processing
2. **Use Admin SDK Carefully**: Admin SDK bypasses security rules
3. **Don't Expose Secrets**: Use Firebase Functions config for API keys
4. **Log Errors**: Log errors for debugging but don't expose sensitive data
5. **Rate Limiting**: Implement rate limiting for callable functions
6. **Authentication**: Always check `context.auth` in callable functions

## Troubleshooting

### Function Not Triggering

**Problem:** onUserCreate doesn't run when a user registers

**Solutions:**
1. Check if function is deployed: `firebase functions:list`
2. View logs for errors: `firebase functions:log`
3. Verify user document is created in Firestore before function runs
4. Check Firebase Console > Functions for deployment status

### Custom Claims Not Working

**Problem:** Custom claims not available in frontend

**Solutions:**
1. Force token refresh after registration:
   ```typescript
   await user.getIdToken(true); // Force refresh
   ```
2. Wait a few seconds after registration for claims to propagate
3. Check function logs to verify claims were set
4. Verify user document has a valid role field

### Build Errors

**Problem:** TypeScript compilation fails

**Solutions:**
1. Check for syntax errors: `cd functions && npm run build`
2. Verify all dependencies are installed: `npm install`
3. Check Node.js version matches requirement (18+)
4. Clear build cache: `rm -rf lib && npm run build`

### Permission Errors

**Problem:** Function fails with permission denied

**Solutions:**
1. Verify Firebase Admin SDK is initialized
2. Check IAM permissions in Google Cloud Console
3. Ensure service account has necessary roles:
   - Firebase Admin
   - Cloud Functions Developer

## Cost Considerations

Cloud Functions pricing is based on:
- **Invocations**: Number of times functions are called
- **Compute Time**: How long functions run
- **Network Egress**: Data sent from functions

**Free Tier:**
- 2 million invocations/month
- 400,000 GB-seconds compute time
- 5 GB network egress

**Optimization Tips:**
1. Keep functions lightweight and fast
2. Use appropriate memory allocation (default: 256MB)
3. Avoid unnecessary database reads/writes
4. Cache frequently accessed data
5. Use batch operations when possible

## Next Steps

1. **Implement Email Service**: Integrate with SendGrid or Mailgun
2. **Add More Functions**: Create functions for:
   - Lead notifications
   - Maintenance request notifications
   - Lease expiration reminders
   - Payment reminders
3. **Add Tests**: Write unit tests for functions
4. **Set Up Monitoring**: Configure alerts and dashboards
5. **Optimize Performance**: Profile and optimize slow functions

## Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Cloud Functions Samples](https://github.com/firebase/functions-samples)
- [Firebase Extensions](https://firebase.google.com/products/extensions)
