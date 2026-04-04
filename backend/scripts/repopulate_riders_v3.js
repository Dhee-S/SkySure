const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json');
const CSV_PATH = path.join(__dirname, '../../data/pre-final_dataset_cleaned.csv'); // FIXED: Using the primary cleaned dataset

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += line[i];
        }
    }
    result.push(current.trim());
    return result;
}

async function repopulate() {
    console.log(`[DATA OVERWRITE] Clearing 'riders' collection for Perfect Data Purity...`);
    const ridersRef = db.collection('riders');
    
    // Deleting existing riders (process in batches if many)
    const snapshot = await ridersRef.limit(1000).get();
    let deleteBatch = db.batch();
    snapshot.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
    });
    if (snapshot.size > 0) {
        await deleteBatch.commit();
        console.log(`[DATA OVERWRITE] Initial batch of ${snapshot.size} deleted.`);
    }

    console.log(`[DATA OVERWRITE] Reading PRIMARY dataset from: ${CSV_PATH}...`);
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const headers = parseCSVLine(lines[0]);
    
    console.log(`[DATA OVERWRITE] Headers identified: ${headers.join(', ')}`);
    
    const subset = lines.slice(1); // Import all records from the cleaned CSV
    let count = 0;
    let batch = db.batch();
    
    for (let i = 0; i < subset.length; i++) {
        const values = parseCSVLine(subset[i]);
        if (values.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
            let val = values[idx];
            if (!val || val === 'None' || val === 'NaN' || val === '') val = null;
            else if (val === 'True' || val === 'true') val = true;
            else if (val === 'False' || val === 'false') val = false;
            else if (!isNaN(val)) val = Number(val);
            row[h] = val;
        });

        // 1. MAPPING STRATEGY: Scale Trust Score (0-3 to 0-100) for UI Alignment
        // 3 -> 95-98 (Elite)
        // 2 -> 65-75 (Standard)
        // 1 -> 35-45 (Warning)
        // 0 -> 10-25 (Critical / Probation)
        const rawTrust = row.trust_score || 0;
        let scaledTrust = 85;
        if (rawTrust === 3) scaledTrust = Math.floor(Math.random() * 5) + 93;
        else if (rawTrust === 2) scaledTrust = Math.floor(Math.random() * 10) + 65;
        else if (rawTrust === 1) scaledTrust = Math.floor(Math.random() * 10) + 35;
        else scaledTrust = Math.floor(Math.random() * 15) + 10;
        
        row.trust_score = scaledTrust;

        // 2. PROBATION SYNC
        // Sync probation_status from probationary_tier in the CSV
        row.probation_status = !!row.probationary_tier;
        
        // 3. VELOCITY BASELINE (Engine Requirement)
        row.velocity_baseline = 250; 

        const docId = row.rider_id || `R_CLEAN_${Date.now()}_${i}`;
        const docRef = db.collection('riders').doc(String(docId));
        
        batch.set(docRef, row);
        count++;

        if (count % 400 === 0) {
            console.log(`[DATA OVERWRITE] Syncing batch ${count}...`);
            await batch.commit();
            batch = db.batch();
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }
    
    console.log(`[DATA OVERWRITE] Successfully pushed ${count} records from 'pre-final_dataset_cleaned.csv' to Firestore!`);
    console.log(`[DATA OVERWRITE] Database is now in 'Perfect Alignment' with the Strategic Overhaul.`);
    process.exit(0);
}

repopulate().catch(console.error);
