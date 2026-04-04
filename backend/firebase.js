const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

const fs = require('fs');

if (!serviceAccountPath) {
  console.error("FIREBASE_SERVICE_ACCOUNT_PATH not found in .env");
  process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
} catch (e) {
    console.error(`Error reading service account from: ${serviceAccountPath}`, e.message);
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

module.exports = { admin, db };
