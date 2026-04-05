const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// ─── STEP 1: Multi-Level Environment Loading ────────────────────────────
// Try loading from current dir, parent (gigguard/), and grand-parent (Guidwire/)
const envPaths = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`📡 [Firebase] Environment loaded from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ [Firebase] No .env file found in search paths.');
}

// ─── STEP 2: Service Account Resolution ──────────────────────────────────
let serviceAccount = null;

// Priority 1: Environment Variable (Render/Vercel JSON string)
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
    // Handle both relative and absolute Windows paths
    const rawPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const fullPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, '..', '..', rawPath);

    if (fs.existsSync(fullPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } else {
      console.error(`❌ [Firebase] Service account file NOT FOUND at: ${fullPath}`);
    }
  } catch (e) {
    console.error(`Error reading service account from: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`, e.message);
  }
}

// ─── STEP 3: Singleton Initialization ─────────────────────────────────────
if (admin.apps.length === 0) {
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
      });
      console.log('✅ [Firebase] Admin SDK initialized successfully.');
    } catch (err) {
      console.error('❌ [Firebase] Initialization error:', err.message);
    }
  } else {
    console.warn('⚠️ [Firebase] No credentials found. Firestore will be unavailable (Silent Fallback).');
  }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = { admin, db };
