const admin = require('firebase-admin');

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    serviceAccount = require('./firebase-service-account.json');
  }
} catch (err) {
  console.warn('⚠️ Firebase Service Account not found or invalid. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set in production.');
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
