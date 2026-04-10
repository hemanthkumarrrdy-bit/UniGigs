const admin = require('firebase-admin');

let serviceAccount;
let db, auth;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Firebase: Using FIREBASE_SERVICE_ACCOUNT_JSON env var');
  } else {
    serviceAccount = require('./firebase-service-account.json');
    console.log('✅ Firebase: Using local firebase-service-account.json');
  }
} catch (err) {
  console.error('❌ Firebase credentials missing! Set FIREBASE_SERVICE_ACCOUNT_JSON in your environment.');
  process.exit(1); // Crash early so Render logs show the real error
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

db = admin.firestore();
auth = admin.auth();

console.log('🔥 Firebase Admin initialized successfully');

module.exports = { admin, db, auth };
