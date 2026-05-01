# FixMyStreet Patna - Quick Start Guide

## 🚀 Project Setup (5 minutes)

### 1. Copy Environment Configuration
```bash
cp .env.example .env.local
```

### 2. Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "fixmystreet-patna"
3. Go to Project Settings > General
4. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Maps JavaScript API"
3. Create an API Key (Restrict to HTTP referrers: `localhost:3000`)
4. Copy to `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 4. Configure Firebase Services

**Authentication:**
- Go to Authentication > Sign-in method
- Enable "Google"
- Enable "Email/Password"

**Firestore:**
- Create Firestore Database (asia-south1, Production mode)

**Storage:**
- Create Cloud Storage bucket (asia-south1)

**Firestore Rules:** (Copy from FIRESTORE_SECURITY_RULES.md)

## 🏃 Run Locally

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 👥 Test Accounts

### Resident (Google OAuth)
- Use any Google account
- Click "Sign in with Google" on login page

### PMC Officer
1. Create in Firebase Console > Authentication
   - Email: `officer@pmc.gov.in`
   - Password: `Demo@12345`

2. Create user document in Firestore (`users` collection):
```json
{
  "email": "officer@pmc.gov.in",
  "name": "Ward Officer",
  "role": "pmc",
  "ward": 18,
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

Then sign in with email/password.

## 🧪 Test Features

### Resident Flow
1. ✅ Sign in with Google
2. ✅ Click "+ Report" → Fill form → Submit
3. ✅ View issue on map with filters
4. ✅ Click issue marker to see details
5. ✅ Upvote issues
6. ✅ Go to "My Reports" to track submissions

### PMC Officer Flow
1. ✅ Sign in with email/password
2. ✅ View "Dashboard" (Ward 18)
3. ✅ See issue summary and category breakdown
4. ✅ Filter by status
5. ✅ Click "Edit" on an issue
6. ✅ Change status to "In Progress" or "Resolved"
7. ✅ Add resolution note for resolved issues

## 📁 Project Structure

```
fixmystreet-patna/
├── app/
│   ├── layout.tsx        ← Root layout with Auth
│   ├── page.tsx          ← Home (Map view)
│   ├── globals.css       ← Global styles
│   ├── report/page.tsx   ← Report form
│   ├── my-reports/       ← Resident's reports
│   └── dashboard/        ← PMC dashboard
├── components/
│   ├── Navbar.tsx
│   ├── LoginView.tsx
│   └── MapView.tsx
├── lib/
│   ├── firebase.ts       ← Firebase init
│   ├── types.ts          ← TypeScript types
│   └── context/
│       └── AuthContext.tsx ← Auth state
├── .env.example          ← Copy to .env.local
├── README.md             ← Full docs
├── DEPLOYMENT.md         ← Deployment guide
└── FIRESTORE_SECURITY_RULES.md
```

## 🐛 Common Issues

### "Firebase: Error (auth/invalid-api-key)"
- Check `.env.local` has correct Firebase keys
- Verify project exists in Firebase Console

### "Cannot find google" TypeScript error
- Run `npm run build` to verify
- The error disappears when `.env.local` is set

### Map not showing
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check it's restricted correctly in Google Cloud Console

### Issues don't appear on map
- Check Firestore has "issues" collection
- Verify security rules are applied
- Check browser console for errors (F12)

## 📦 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint

# Deploy to Firebase Hosting
firebase deploy
```

## 🔗 Useful Links

- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Google Maps API](https://developers.google.com/maps)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📱 Mobile Testing

```bash
# Get local IP
ifconfig | grep inet

# Test on mobile (replace X.X.X.X with your IP)
http://X.X.X.X:3000
```

## ✅ Checklist Before Deployment

- [ ] `.env.local` configured with real Firebase keys
- [ ] Google OAuth credentials set up
- [ ] Firestore security rules applied
- [ ] Cloud Storage configured
- [ ] Test resident flow works
- [ ] Test PMC officer flow works
- [ ] Build completes: `npm run build`
- [ ] Tested on mobile (360px+ screens)
- [ ] Tested map filtering and sorting
- [ ] Tested upvoting system
- [ ] Tested status updates

## 💡 Next Steps

1. Customize issue categories (in `lib/types.ts`)
2. Add more wards/filtering logic
3. Set up Firebase Hosting
4. Configure custom domain
5. Add analytics
6. Set up automated backups

Happy coding! 🎉
