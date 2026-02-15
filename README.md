# IKHAYA RENT PROPERTIES

A comprehensive property rental platform connecting landlords with tenants, built with React, TypeScript, and Firebase.

## Features

- 🏠 Property listing and management
- 🔐 Secure authentication with role-based access
- 💬 Real-time messaging between landlords and tenants
- 📝 Lease agreement management
- 🔧 Maintenance request tracking
- 💰 Commission and payment tracking
- 📊 Analytics dashboards
- 🔔 Real-time notifications
- 📱 Mobile-responsive design

## Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI
- **Backend**: Firebase (Authentication, Firestore, Storage, Cloud Functions)
- **Routing**: React Router v7
- **State Management**: React Context API
- **Testing**: Jest, React Testing Library

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide.

## Firebase Setup

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration instructions.

## Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run emulators`

Starts Firebase emulators for local development:
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Storage Emulator: http://localhost:9199
- Emulator UI: http://localhost:4000

### `npm run deploy`

Builds and deploys the app to Firebase Hosting.

### `npm run deploy:hosting`

Deploys only the hosting (frontend) to Firebase.

### `npm run deploy:rules`

Deploys only Firestore and Storage security rules.

## Project Structure

```
ikhaya-rent-properties/
├── public/                   # Static files
├── src/
│   ├── components/          # React components
│   ├── config/              # Configuration files
│   │   └── firebase.ts      # Firebase initialization
│   ├── contexts/            # React contexts
│   │   └── FirebaseContext.tsx
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Firebase service functions
│   ├── types/               # TypeScript type definitions
│   │   └── firebase.ts      # Firebase data models
│   ├── utils/               # Utility functions
│   │   └── firestoreConverters.ts
│   ├── App.tsx              # Main app component
│   └── index.tsx            # App entry point
├── .env.example             # Environment variables template
├── .firebaserc              # Firebase project configuration
├── firebase.json            # Firebase services configuration
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore composite indexes
├── storage.rules            # Storage security rules
├── FIREBASE_SETUP.md        # Detailed Firebase setup guide
├── QUICKSTART.md            # Quick start guide
└── README.md                # This file
```

## Development Workflow

### Local Development with Emulators (Recommended)

1. Start Firebase emulators:
   ```bash
   npm run emulators
   ```

2. In another terminal, start the React app:
   ```bash
   npm start
   ```

3. Set `REACT_APP_USE_FIREBASE_EMULATORS=true` in `.env.local`

### Local Development with Production Firebase

1. Set `REACT_APP_USE_FIREBASE_EMULATORS=false` in `.env.local`
2. Start the React app:
   ```bash
   npm start
   ```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Deployment

```bash
# Build and deploy everything
npm run deploy

# Deploy only hosting
npm run deploy:hosting

# Deploy only security rules
npm run deploy:rules
```

## Environment Variables

Create a `.env.local` file (copy from `.env.example`) with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_USE_FIREBASE_EMULATORS=false
```

## Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Design Document](./.kiro/specs/ikhaya-rent-properties/design.md)
- [Requirements Document](./.kiro/specs/ikhaya-rent-properties/requirements.md)
- [Implementation Tasks](./.kiro/specs/ikhaya-rent-properties/tasks.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Private - All rights reserved

## Support

For issues and questions, please refer to the documentation or contact the development team.
