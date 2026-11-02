# MyPaisa

A responsive personal finance web app starter with a burgundy and champagne-gold visual identity.

## Current starter features
- Google sign-in using Firebase Authentication
- Private per-user transaction records in Cloud Firestore
- Income and expense entry
- Balance, income and expense summary
- Basic admin console for registered account overview and login-event counts
- Responsive layout for mobile and desktop

## Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web App and copy its Firebase config into `firebaseConfig` in `app.js`.
3. In Firebase Authentication, enable Google as a sign-in provider.
4. Create a Cloud Firestore database.
5. Publish the contents of `firestore.rules` in Firestore Rules.
6. Add your website domain to Authentication > Settings > Authorized domains.
7. Serve this project from a web server (GitHub Pages works for the static frontend).

## Grant yourself admin access
1. Sign in to MyPaisa once using your Google account.
2. In Firebase Console > Authentication > Users, copy your user's UID.
3. In Firestore Data, create a collection named `admins`.
4. Create a document whose document ID is exactly your UID. It can contain a field such as `role: "admin"`.
5. Do not create an admin-registration button in the public app. The rules intentionally prevent client-side writes to `admins`.

## Important security notes
- Firebase web configuration is designed to be present in browser code; Firestore Security Rules protect the data.
- Never put an OpenAI API key, service-account key, or other server secret in `app.js`.
- This starter records login events when a user signs in. It does not yet implement reliable live-online presence.
- The admin console displays basic account details and login counts only. It does not expose users' private transactions or AI conversations.
- Before a public launch, add server-side validation, rate limits, privacy policy, account deletion, stronger admin custom claims, and production testing.

## Next development stages
Budgets, recurring transactions, savings goals, charts, PDF/CSV export, AI assistant through a secure server function, and reliable live presence.
