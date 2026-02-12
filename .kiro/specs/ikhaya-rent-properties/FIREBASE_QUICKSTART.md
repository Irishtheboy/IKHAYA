# IKHAYA RENT PROPERTIES - Firebase Quick Start Guide

## Overview

This guide will help you get started building IKHAYA RENT PROPERTIES using Firebase as the backend. Firebase provides authentication, database, storage, and serverless functions - everything you need without managing servers.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase account (free tier is fine to start)
- Basic knowledge of React and TypeScript

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "ikhaya-rent-properties"
4. Disable Google Analytics (optional for now)
5. Click "Create project"

## Step 2: Enable Firebase Services

In your Firebase project:

1. **Authentication**
   - Go to Authentication → Get Started
   - Enable "Email/Password" sign-in method

2. **Firestore Database**
   - Go to Firestore Database → Create database
   - Start in "test mode" (we'll add security rules later)
   - Choose a location close to your users

3. **Storage**
   - Go to Storage → Get Started
   - Start in "test mode"

4. **Functions**
   - Will be set up via CLI later

## Step 3: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## Step 4: Initialize React Project

```bash
# Create React app with TypeScript
npx create-react-app ikhaya-rent-properties --template typescript
cd ikhaya-rent-properties

# Install Firebase SDK
npm install firebase

# Install additional dependencies
npm install react-router-dom
npm install @types/react-router-dom --save-dev

# For UI (choose one)
npm install @mui/material @emotion/react @emotion/styled
# OR
npm install -D tailwindcss postcss autoprefixer
```

## Step 5: Initialize Firebase in Project

```bash
# Initialize Firebase
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators

# Choose:
# - Use existing project → select your project
# - TypeScript for Functions
# - ESLint yes
# - Install dependencies yes
# - Public directory: build
# - Single-page app: yes
# - Set up emulators: Auth, Firestore, Functions, Storage
```

## Step 6: Configure Firebase in React

Create `src/firebase/config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
```

## Step 7: Get Firebase Config

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Register app with nickname "ikhaya-web"
5. Copy the config object

Create `.env` file in project root:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Step 8: Project Structure

Create this folder structure:

```
ikhaya-rent-properties/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── properties/     # Property listing components
│   │   ├── leads/          # Lead management components
│   │   ├── leases/         # Lease management components
│   │   ├── maintenance/    # Maintenance components
│   │   └── common/         # Shared components
│   ├── services/           # Firebase service functions
│   │   ├── authService.ts
│   │   ├── propertyService.ts
│   │   ├── leadService.ts
│   │   ├── leaseService.ts
│   │   └── maintenanceService.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProperties.ts
│   │   └── useFirestore.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── firebase/           # Firebase config
│   │   └── config.ts
│   └── App.tsx
├── functions/              # Cloud Functions
│   ├── src/
│   │   ├── triggers/       # Firestore triggers
│   │   ├── scheduled/      # Scheduled functions
│   │   └── callable/       # Callable functions
│   └── package.json
├── firestore.rules         # Firestore Security Rules
├── storage.rules           # Storage Security Rules
└── firebase.json           # Firebase configuration
```

## Step 9: Create Basic Types

Create `src/types/index.ts`:

```typescript
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'landlord' | 'tenant' | 'admin';
  phone?: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Property {
  id: string;
  landlordId: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  propertyType: 'apartment' | 'house' | 'townhouse' | 'room';
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  deposit: number;
  description: string;
  amenities: string[];
  availableFrom: Timestamp;
  status: 'available' | 'occupied' | 'inactive';
  isPremium: boolean;
  images: string[];
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Add more types as needed...
```

## Step 10: Create Authentication Service

Create `src/services/authService.ts`:

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: 'landlord' | 'tenant'
): Promise<FirebaseUser> => {
  // Create auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Send verification email
  await sendEmailVerification(user);

  // Create user document in Firestore
  const userDoc: Omit<User, 'uid'> = {
    email,
    name,
    role,
    emailVerified: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await setDoc(doc(db, 'users', user.uid), userDoc);

  return user;
};

export const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};
```

## Step 11: Create Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile({ uid: user.uid, ...userDoc.data() } as User);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

## Step 12: Start Development

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start React app
npm start
```

## Step 13: Deploy to Production

```bash
# Build React app
npm run build

# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Next Steps

1. Follow the tasks in `tasks-firebase.md` to implement features
2. Start with authentication (Phase 2)
3. Then implement property listings (Phase 3)
4. Add lead management (Phase 4)
5. Continue with remaining phases

## Useful Commands

```bash
# View Firebase logs
firebase functions:log

# Test security rules
firebase emulators:exec --only firestore "npm test"

# Export emulator data
firebase emulators:export ./emulator-data

# Import emulator data
firebase emulators:start --import=./emulator-data
```

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

## Tips

1. **Use Firebase Emulators** for local development - no costs, faster iteration
2. **Start with Security Rules in test mode** but implement proper rules before production
3. **Use Firestore composite indexes** for complex queries
4. **Implement pagination** for large collections
5. **Use Cloud Functions** for server-side logic and data validation
6. **Monitor costs** in Firebase Console
7. **Use environment variables** for different environments (dev, staging, prod)

## Common Issues

**Issue**: "Firebase: Error (auth/operation-not-allowed)"
**Solution**: Enable Email/Password authentication in Firebase Console

**Issue**: "Missing or insufficient permissions"
**Solution**: Check Firestore Security Rules

**Issue**: "Storage: User does not have permission"
**Solution**: Check Storage Security Rules

**Issue**: Functions not deploying
**Solution**: Ensure billing is enabled (required for Cloud Functions)

## Support

- Check the design document for architecture details
- Review requirements document for feature specifications
- Follow tasks-firebase.md for implementation steps
- Use Firebase Console for debugging and monitoring
