# Services

This directory contains service modules that encapsulate business logic and Firebase interactions.

## Auth Service

The `authService.ts` module provides authentication functionality using Firebase Authentication.

### Features

- **User Registration**: Create new user accounts with email/password
- **User Login**: Authenticate users with email/password
- **Logout**: Sign out current user
- **Password Reset**: Send password reset emails
- **Email Verification**: Send and resend email verification
- **Password Validation**: Enforce password requirements (min 8 chars, uppercase, lowercase, number)
- **User Profile Management**: Fetch user profiles from Firestore

### Usage

```typescript
import { authService } from './services/authService';

// Register a new user
const result = await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  role: 'tenant',
  phone: '+27123456789',
});

// Login
const authResult = await authService.login({
  email: 'john@example.com',
  password: 'SecurePass123',
});

// Logout
await authService.logout();

// Request password reset
await authService.requestPasswordReset('john@example.com');

// Get current user
const currentUser = authService.getCurrentUser();

// Get user profile
const profile = await authService.getUserProfile('user-id');
```

### Password Requirements

Passwords must meet the following criteria:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Error Handling

The service throws descriptive errors for various scenarios:

- Duplicate email registration
- Invalid credentials
- Weak passwords
- Disabled accounts
- Too many login attempts

### Testing

Unit tests are available in `authService.test.ts` covering:

- Successful registration and login
- Password validation
- Error scenarios
- Edge cases

Run tests with:

```bash
npm test -- --testPathPattern=authService.test.ts
```

### Custom Claims (Future)

Custom claims for user roles (landlord/tenant) will be set via Cloud Functions when Task 3.4 is implemented. The Cloud Function will:

- Trigger on user creation
- Set custom claims based on the user's role
- Create user profile in Firestore
- Send welcome email

### Integration with Firestore

The auth service creates user profiles in the `users` collection with the following structure:

```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,
  name: string,
  role: 'landlord' | 'tenant' | 'admin',
  phone?: string,
  emailVerified: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Security

- Passwords are never stored in plain text (handled by Firebase Auth)
- Email verification is sent automatically on registration
- Password reset links are time-limited and secure
- User profile access is controlled by Firestore security rules
