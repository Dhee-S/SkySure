const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = 'D:/Code/Guidwire/builds/other/serviceAccountKey.json';
const CSV_PATH = 'D:/Code/Guidwire/gigguard/data/pre-final_dataset_cleaned.csv';

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

function parseCSVLine(line) {
    const chars = line.split('');
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < chars.length; i++) {
        if (chars[i] === '"') inQuotes = !inQuotes;
        else if (chars[i] === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += chars[i];
        }
    }
    result.push(current.trim());
    return result;
}

async function importData() {
    console.log(`Reading standardized CSV from: ${CSV_PATH}...`);
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const headers = parseCSVLine(lines[0]);
    
    // We'll import first 2000 records
    const subsetSize = Math.min(lines.length - 1, 2000);
    const subset = lines.slice(1, subsetSize + 1); 
    console.log(`Importing ${subset.length} records to Firestore 'riders' collection...`);

    let count = 0;
    let batch = db.batch();
    
    for (let i = 0; i < subset.length; i++) {
        const values = parseCSVLine(subset[i]);
        const row = {};
        headers.forEach((h, idx) => {
            let val = values[idx];
            if (val === 'None' || val === '' || val === undefined || val === 'NaN') val = null;
            else if (!isNaN(val) && val !== '') val = Number(val);
            else if (val === 'True' || val === 'true') val = true;
            else if (val === 'False' || val === 'false') val = false;
            
            row[h] = val;
        });

        const docId = row.rider_id || row.id || `R_${i}`;
        const docRef = db.collection('riders').doc(String(docId));
        
        const cleanData = {};
        Object.keys(row).forEach(k => {
            const val = row[k];
            if (val !== null && val !== undefined && !Number.isNaN(val)) {
                cleanData[k] = val;
            }
        });
        
        if (!cleanData.partner_id) cleanData.partner_id = docId;
        if (!cleanData.rider_id) cleanData.rider_id = docId;

        if (Object.keys(cleanData).length === 0) continue;

        batch.set(docRef, cleanData);
        count++;

        if (count % 500 === 0) {
            console.log(`Committing batch ${count/500}...`);
            await batch.commit();
            batch = db.batch();
        }
    }

    if (count % 500 !== 0) {
        await batch.commit();
    }
    
    console.log(`Successfully synced ${count} riders to Firestore!`);
    process.exit(0);
}

importData().catch(err => {
    console.error("Import failed:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
});
