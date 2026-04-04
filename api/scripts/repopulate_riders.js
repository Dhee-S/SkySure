const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json');
const CSV_PATH = path.join(__dirname, '../../data/pre-final_dataset3.csv');

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
    console.log(`[DATA] Clearing 'riders' collection...`);
    const ridersRef = db.collection('riders');
    const snapshot = await ridersRef.limit(500).get();
    
    let deleteBatch = db.batch();
    snapshot.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
    });
    if (snapshot.size > 0) {
        await deleteBatch.commit();
        console.log(`[DATA] Initial batch of ${snapshot.size} deleted.`);
    }

    console.log(`[DATA] Reading NEW dataset from: ${CSV_PATH}...`);
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const headers = parseCSVLine(lines[0]);
    
    console.log(`[DATA] Headers identified: ${headers.join(', ')}`);
    
    const subset = lines.slice(1, 2001); // 2000 records
    let count = 0;
    let batch = db.batch();
    
    for (let i = 0; i < subset.length; i++) {
        const values = parseCSVLine(subset[i]);
        const row = {};
        headers.forEach((h, idx) => {
            let val = values[idx];
            if (!val || val === 'None' || val === 'NaN' || val === '') val = null;
            else if (!isNaN(val)) val = Number(val);
            row[h] = val;
        });

        const docId = row.rider_id || `R_${Date.now()}_${i}`;
        const docRef = db.collection('riders').doc(String(docId));
        
        // Clean data: remove nulls and ensure field names are consistent for the engine
        const cleanData = {
           ...row,
           // Mapping for engine compatibility if header names vary slightly
           rider_name: row.rider_name || row.Name || 'Active Pilot',
           weekly_premium: row.weekly_premium || 1200,
           city: row.city || 'Chennai'
        };

        batch.set(docRef, cleanData);
        count++;

        if (count % 400 === 0) {
            console.log(`[DATA] Syncing batch ${count}...`);
            await batch.commit();
            batch = db.batch();
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }
    
    console.log(`[DATA] Successfully synced ${count} HIGH-FIDELITY records to Firestore!`);
    process.exit(0);
}

repopulate().catch(console.error);
