const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let serviceAccount;

// Priority 1: Environment Variable (Serverless/Vercel)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var", e.message);
  }
}

// Priority 2: Local File Path (Development)
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const fullPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.error(`Error reading service account from: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`, e.message);
  }
}

if (!serviceAccount) {
  console.error("CRITICAL: No Firebase Service Account credentials found (env or file).");
  if (process.env.NODE_ENV !== 'production') process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || (serviceAccount ? serviceAccount.project_id : undefined)
});

const db = admin.firestore();

module.exports = { admin, db };
