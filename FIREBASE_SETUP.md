# Firebase Setup Guide for IKHAYA RENT PROPERTIES

This guide will walk you through setting up Firebase for the IKHAYA RENT PROPERTIES application.

## Prerequisites

- Node.js and npm installed
- A Google account
- Firebase CLI installed globally: `npm install -g firebase-tools`

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `ikhaya-rent-properties` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Click "Create project"

## Step 2: Enable Firebase Services

### Enable Firebase Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click "Save"

### Create Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select **Production mode** (we have security rules configured)
4. Choose a location closest to your users
5. Click "Enable"

### Enable Firebase Storage

1. In Firebase Console, go to **Build > Storage**
2. Click "Get started"
3. Select **Production mode** (we have security rules configured)
4. Choose the same location as Firestore
5. Click "Done"

### Set up Firebase Hosting

1. In Firebase Console, go to **Build > Hosting**
2. Click "Get started"
3. Follow the setup wizard (we'll configure this via CLI)

## Step 3: Register Web App

1. In Firebase Console, go to **Project Overview**
2. Click the **Web icon** (</>) to add a web app
3. Enter app nickname: `ikhaya-rent-properties-web`
4. Check "Also set up Firebase Hosting" (optional)
5. Click "Register app"
6. Copy the Firebase configuration object (you'll need this in Step 5)

## Step 4: Install Firebase CLI and Login

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to your project directory
cd ikhaya-rent-properties

# Initialize Firebase (select existing project)
firebase init
```

When running `firebase init`, select:
- **Firestore**: Configure security rules and indexes
- **Hosting**: Configure hosting
- **Storage**: Configure storage rules
- **Emulators**: Set up local emulators

Use the existing configuration files when prompted.

## Step 5: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase configuration values from Step 3:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key-here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

3. Update `.firebaserc` with your project ID:
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

## Step 6: Deploy Security Rules and Indexes

Deploy Firestore security rules, indexes, and Storage rules:

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage
```

## Step 7: Set Up Firebase Emulators (Local Development)

The Firebase Emulators allow you to develop and test locally without affecting production data.

### Install Emulators

```bash
firebase init emulators
```

Select:
- Authentication Emulator
- Firestore Emulator
- Storage Emulator

### Start Emulators

```bash
firebase emulators:start
```

This will start:
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Storage Emulator**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

### Use Emulators in Development

To use emulators, set the environment variable in `.env.local`:

```env
REACT_APP_USE_FIREBASE_EMULATORS=true
```

## Step 8: Run the Application

### Development Mode (with Emulators)

1. Start Firebase Emulators in one terminal:
   ```bash
   firebase emulators:start
   ```

2. Start React app in another terminal:
   ```bash
   npm start
   ```

3. The app will connect to local emulators automatically

### Development Mode (with Production Firebase)

1. Ensure `REACT_APP_USE_FIREBASE_EMULATORS=false` in `.env.local`
2. Start React app:
   ```bash
   npm start
   ```

## Step 9: Deploy to Firebase Hosting

### Build and Deploy

```bash
# Build the React app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Deploy Everything

```bash
# Build the app
npm run build

# Deploy all Firebase services
firebase deploy
```

Your app will be available at: `https://your-project-id.web.app`

## Firebase Project Structure

```
ikhaya-rent-properties/
├── .env.example              # Environment variables template
├── .env.local               # Your local environment variables (not in git)
├── .firebaserc              # Firebase project configuration
├── firebase.json            # Firebase services configuration
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore composite indexes
├── storage.rules            # Storage security rules
├── src/
│   ├── config/
│   │   └── firebase.ts      # Firebase initialization
│   └── contexts/
│       └── FirebaseContext.tsx  # React context for Firebase
```

## Useful Firebase CLI Commands

```bash
# View project info
firebase projects:list

# Switch between projects
firebase use <project-id>

# View current project
firebase use

# Deploy specific services
firebase deploy --only firestore
firebase deploy --only storage
firebase deploy --only hosting

# View deployment history
firebase hosting:channel:list

# Open Firebase Console
firebase open

# View logs
firebase functions:log
```

## Troubleshooting

### Issue: "Firebase config not found"
- Ensure `.env.local` exists and contains all required variables
- Restart the development server after changing environment variables

### Issue: "Permission denied" errors
- Check Firestore security rules in `firestore.rules`
- Ensure user is authenticated before accessing protected data
- Verify user roles are set correctly

### Issue: Emulators not connecting
- Ensure emulators are running: `firebase emulators:start`
- Check `REACT_APP_USE_FIREBASE_EMULATORS=true` in `.env.local`
- Clear browser cache and restart development server

### Issue: "Project not found"
- Update `.firebaserc` with correct project ID
- Run `firebase use <project-id>` to set active project

## Next Steps

1. Set up Cloud Functions for backend logic (Task 3.4)
2. Implement authentication UI (Task 3.2)
3. Create Firestore data services (Task 4)
4. Build property listing features (Task 5)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
