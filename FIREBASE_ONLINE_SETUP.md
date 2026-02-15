# Firebase Online Setup Guide

Your app is now configured to connect to Firebase project: **ikhaya-70537**

## ✅ Completed Steps

1. ✅ Environment variables configured in `.env.local`
2. ✅ Firebase project ID set in `.firebaserc`
3. ✅ Emulators disabled (`REACT_APP_USE_FIREBASE_EMULATORS=false`)
4. ✅ Firestore rules deployed
5. ✅ Firestore indexes deployed

## 🔧 Required Setup Steps

### 1. Enable Firebase Services in Console

Go to [Firebase Console - ikhaya-70537](https://console.firebase.google.com/project/ikhaya-70537) and enable:

#### Authentication
1. Go to Authentication → Get Started
2. Enable **Email/Password** sign-in method

#### Firestore Database
✅ Already enabled and configured!

#### Storage
1. Go to [Storage](https://console.firebase.google.com/project/ikhaya-70537/storage)
2. Click **Get Started**
3. Choose **Start in production mode**
4. Select a location (choose closest to your users)

### 2. Deploy Storage Rules (After Enabling Storage)

```bash
firebase deploy --only storage:rules
```

### 3. Create Initial Admin User

After starting your app:

1. Register a new user through your app
2. Go to [Firestore Console](https://console.firebase.google.com/project/ikhaya-70537/firestore)
3. Find the user in `users` collection
4. Edit the document and set:
   - `role: "admin"`
   - `approved: true`

### 4. Start Your App

```bash
npm start
```

Your app will now connect to online Firebase!

## 🔄 Switch Between Online and Emulators

To use emulators again (local development):
```bash
# In .env.local, change:
REACT_APP_USE_FIREBASE_EMULATORS=true
```

To use online Firebase (production):
```bash
# In .env.local, change:
REACT_APP_USE_FIREBASE_EMULATORS=false
```

## 📦 Deploy to Firebase Hosting (Optional)

```bash
# Build your app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: https://ikhaya-70537.web.app

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure
- Review security rules before deploying to production
- Enable App Check for additional security

## 📚 Next Steps

1. Test authentication (register/login)
2. Create test properties
3. Test all features with online Firebase
4. Monitor usage in Firebase Console
5. Set up billing alerts

## 🆘 Troubleshooting

**Issue: "Permission denied" errors**
- Make sure security rules are deployed
- Check that user has correct role in Firestore

**Issue: "Firebase not initialized"**
- Restart your development server after changing `.env.local`
- Clear browser cache

**Issue: Images not uploading**
- Make sure Storage is enabled
- Check storage rules are deployed
- Verify file size is under 5MB

## 📞 Support

For Firebase issues, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/project/ikhaya-70537)
