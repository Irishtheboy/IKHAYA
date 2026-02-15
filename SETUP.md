# IKHAYA RENT PROPERTIES - Setup Guide

## Prerequisites

- Node.js 16+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (see FIREBASE_SETUP.md)

## Installation

1. **Clone the repository and install dependencies:**

```bash
cd ikhaya-rent-properties
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project credentials from the Firebase Console.

3. **Start the development server:**

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Development with Firebase Emulators

For local development without affecting production data:

1. **Start Firebase Emulators:**

```bash
npm run emulators
```

2. **In another terminal, start the app with emulators enabled:**

```bash
# Set environment variable in .env.local
REACT_APP_USE_FIREBASE_EMULATORS=true

# Then start the app
npm start
```

## Project Structure

```
ikhaya-rent-properties/
├── public/              # Static files
├── src/
│   ├── config/         # Firebase and app configuration
│   ├── contexts/       # React contexts (Firebase, Auth, etc.)
│   ├── pages/          # Page components
│   ├── router/         # React Router configuration
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   └── index.tsx       # App entry point
├── .env.example        # Environment variables template
├── .prettierrc         # Prettier configuration
├── jest.config.js      # Jest configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Available Scripts

### Development
- `npm start` - Start development server
- `npm run emulators` - Start Firebase Emulators

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode

### Code Quality
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Deployment
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Firebase (hosting + functions)
- `npm run deploy:hosting` - Deploy only hosting
- `npm run deploy:rules` - Deploy only Firestore and Storage rules

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Material-UI** for UI components
- **Firebase SDK v9+** for backend integration

### Backend
- **Firebase Authentication** for user management
- **Cloud Firestore** for database
- **Firebase Storage** for file uploads
- **Cloud Functions** for serverless backend logic

### Testing
- **Jest** for unit testing
- **React Testing Library** for component testing
- **fast-check** for property-based testing

### Code Quality
- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type safety

## Configuration Files

### Tailwind CSS (`tailwind.config.js`)
Configured with custom color palette and content paths.

### ESLint (in `package.json`)
Extends react-app config with Prettier integration.

### Prettier (`.prettierrc`)
Configured with project code style preferences.

### Jest (`jest.config.js`)
Configured for React with coverage thresholds.

## Environment Variables

Required environment variables in `.env.local`:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_USE_FIREBASE_EMULATORS=false
```

## Next Steps

1. Complete authentication implementation (Task 3)
2. Set up Firestore data structure and security rules (Task 4)
3. Implement property listing functionality (Task 5)

See `tasks.md` in `.kiro/specs/ikhaya-rent-properties/` for the complete implementation plan.

## Troubleshooting

### Port already in use
If port 3000 is already in use, you can specify a different port:
```bash
PORT=3001 npm start
```

### Firebase Emulators not starting
Make sure you're logged in to Firebase CLI:
```bash
firebase login
```

### Module not found errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
