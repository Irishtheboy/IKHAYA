# Quick Start Guide

Get the IKHAYA RENT PROPERTIES app running locally in minutes.

## Prerequisites

- Node.js 16+ installed
- npm or yarn
- Firebase CLI: `npm install -g firebase-tools`

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy the environment template:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials (see FIREBASE_SETUP.md for detailed instructions).

### 3. Choose Development Mode

#### Option A: Local Development with Emulators (Recommended)

Set in `.env.local`:
```env
REACT_APP_USE_FIREBASE_EMULATORS=true
```

Start emulators in one terminal:
```bash
npm run emulators
```

Start the app in another terminal:
```bash
npm start
```

Access:
- **App**: http://localhost:3000
- **Emulator UI**: http://localhost:4000

#### Option B: Development with Production Firebase

Set in `.env.local`:
```env
REACT_APP_USE_FIREBASE_EMULATORS=false
```

Start the app:
```bash
npm start
```

## Available Scripts

```bash
npm start              # Start development server
npm test               # Run tests
npm run build          # Build for production
npm run emulators      # Start Firebase emulators
npm run deploy         # Build and deploy to Firebase
npm run deploy:hosting # Deploy only hosting
npm run deploy:rules   # Deploy only security rules
```

## Project Structure

```
src/
├── config/
│   └── firebase.ts           # Firebase configuration
├── contexts/
│   └── FirebaseContext.tsx   # Firebase React context
├── components/               # React components (to be added)
├── services/                 # Firebase service functions (to be added)
├── hooks/                    # Custom React hooks (to be added)
└── types/                    # TypeScript types (to be added)
```

## Next Steps

1. Complete Firebase project setup (see FIREBASE_SETUP.md)
2. Implement authentication (Task 3)
3. Build property listing features (Task 5)
4. Add lead management (Task 6)

## Need Help?

- See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Review the design document in `.kiro/specs/ikhaya-rent-properties/design.md`
