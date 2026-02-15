# Cloud Functions for IKHAYA RENT PROPERTIES

This directory contains Firebase Cloud Functions for the IKHAYA RENT PROPERTIES platform.

## Functions

### Authentication Functions

#### `onUserCreate`
Triggered when a new user is created in Firebase Authentication.

**Actions:**
- Retrieves user role from Firestore user document
- Sets custom claims on the user based on their role (landlord, tenant, admin)
- Sends a welcome email to the new user

**Requirements:** 1.1 - User Registration and Authentication

#### `onUserDelete`
Triggered when a user is deleted from Firebase Authentication.

**Actions:**
- Deletes the user document from Firestore
- Cleans up user-related data (to be implemented)

## Setup

### Prerequisites
- Node.js 18 or higher
- Firebase CLI installed globally: `npm install -g firebase-tools`

### Installation

1. Navigate to the functions directory:
   ```bash
   cd functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Development

### Local Development with Emulators

To test functions locally with Firebase Emulators:

```bash
# From the project root
npm run emulators

# Or from the functions directory
npm run serve
```

The functions emulator will run on port 5001 by default.

### Building

```bash
npm run build
```

### Watching for Changes

```bash
npm run build:watch
```

### Linting

```bash
npm run lint
```

## Deployment

### Deploy All Functions

```bash
# From the project root
firebase deploy --only functions

# Or from the functions directory
npm run deploy
```

### Deploy Specific Function

```bash
firebase deploy --only functions:onUserCreate
```

## Environment Variables

Cloud Functions can access Firebase project configuration automatically. For additional environment variables:

```bash
firebase functions:config:set someservice.key="THE API KEY"
```

## Email Integration

The `onUserCreate` function currently logs welcome emails to the console. To send actual emails in production:

1. **Option 1: Firebase Extensions**
   - Install the "Trigger Email" extension from the Firebase Console
   - Configure with your email service provider (SendGrid, Mailgun, etc.)

2. **Option 2: Custom Integration**
   - Add email service SDK (e.g., `@sendgrid/mail`)
   - Configure API keys using Firebase Functions config
   - Implement email sending in the function

Example with SendGrid:
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

## Testing

Cloud Functions can be tested using:

1. **Firebase Emulators** - Test locally before deployment
2. **Unit Tests** - Test function logic in isolation
3. **Integration Tests** - Test with Firebase services

## Monitoring

View function logs:

```bash
# Real-time logs
firebase functions:log

# Or from the functions directory
npm run logs
```

View logs in Firebase Console:
- Go to Firebase Console > Functions
- Click on a function to view its logs and metrics

## Custom Claims

The `onUserCreate` function sets the following custom claims:

```typescript
{
  role: 'landlord' | 'tenant' | 'admin',
  landlord: boolean,
  tenant: boolean,
  admin: boolean
}
```

These claims can be accessed in:
- **Frontend**: `user.getIdTokenResult().claims`
- **Firestore Security Rules**: `request.auth.token.role`
- **Cloud Functions**: `context.auth.token.role`

## Security

- Functions use Firebase Admin SDK with elevated privileges
- Always validate input data
- Use Firestore Security Rules as the primary security layer
- Functions should not expose sensitive data in responses
- Log errors but don't expose internal details to clients

## Performance

- Keep functions lightweight and fast
- Use async/await for better performance
- Avoid long-running operations (max 540s for HTTP functions, 9 minutes for background functions)
- Consider using Cloud Tasks for long-running jobs

## Cost Optimization

- Functions are billed based on invocations, compute time, and network egress
- Use appropriate memory allocation (default: 256MB)
- Minimize cold starts by keeping functions warm (if needed)
- Monitor usage in Firebase Console

## Troubleshooting

### Function Not Triggering

1. Check Firebase Console logs for errors
2. Verify function is deployed: `firebase functions:list`
3. Check emulator logs during local development
4. Ensure triggers are properly configured

### Build Errors

1. Check TypeScript errors: `npm run build`
2. Verify all dependencies are installed: `npm install`
3. Check Node.js version matches engines requirement

### Permission Errors

1. Ensure Firebase Admin SDK is initialized
2. Check IAM permissions in Google Cloud Console
3. Verify service account has necessary permissions

## Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Cloud Functions Samples](https://github.com/firebase/functions-samples)
