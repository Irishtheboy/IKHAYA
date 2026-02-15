# 🎉 Firebase Online Connection - Complete!

## ✅ What's Been Done

Your app is now configured to connect to **Firebase project: ikhaya-70537**

1. ✅ Environment variables updated with your Firebase credentials
2. ✅ Firestore security rules deployed
3. ✅ Firestore indexes deployed
4. ✅ App configured to use online Firebase (emulators disabled)

## ⚠️ Important: Restart Your App

Since you changed `.env.local`, you need to restart your development server:

1. Stop the current server (Ctrl+C in terminal)
2. Run: `npm start`

## 🔧 Complete These Steps in Firebase Console

### 1. Enable Authentication
- Go to: https://console.firebase.google.com/project/ikhaya-70537/authentication
- Click "Get Started"
- Enable "Email/Password" provider

### 2. Enable Storage
- Go to: https://console.firebase.google.com/project/ikhaya-70537/storage
- Click "Get Started"
- Choose "Start in production mode"
- Select your location

### 3. Deploy Storage Rules (after enabling Storage)
```bash
firebase deploy --only storage:rules
```

### 4. Create Your First Admin User

After restarting your app:

1. Open http://localhost:3000
2. Register a new account
3. Go to Firestore Console: https://console.firebase.google.com/project/ikhaya-70537/firestore
4. Find your user in the `users` collection
5. Edit the document:
   - Set `role: "admin"`
   - Set `approved: true`
6. Refresh your app - you'll now have admin access!

## 🧪 Test Your Connection

After restarting:

1. ✅ Register a new user
2. ✅ Login with that user
3. ✅ Check Firestore Console to see the user created
4. ✅ Try creating a property (after setting yourself as admin landlord)

## 🔄 Switch Between Online and Local

**Use Online Firebase (current setting):**
```
REACT_APP_USE_FIREBASE_EMULATORS=false
```

**Use Local Emulators:**
```
REACT_APP_USE_FIREBASE_EMULATORS=true
```

Then restart your app.

## 📊 Monitor Your App

- **Firebase Console**: https://console.firebase.google.com/project/ikhaya-70537
- **Authentication**: See registered users
- **Firestore**: View all data
- **Storage**: View uploaded images
- **Usage**: Monitor quotas and billing

## 🚀 Deploy to Production (Optional)

When ready to deploy:

```bash
# Build your app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: **https://ikhaya-70537.web.app**

## 🆘 Troubleshooting

**"Permission denied" errors:**
- Make sure you've enabled Authentication in Firebase Console
- Check that security rules are deployed
- Verify user has correct role in Firestore

**App still using emulators:**
- Verify `.env.local` has `REACT_APP_USE_FIREBASE_EMULATORS=false`
- Restart your development server
- Clear browser cache

**Storage upload fails:**
- Enable Storage in Firebase Console first
- Deploy storage rules: `firebase deploy --only storage:rules`

## 📞 Need Help?

Check the detailed guide: `FIREBASE_ONLINE_SETUP.md`
