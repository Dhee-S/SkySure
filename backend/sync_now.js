const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = 'd:/Code/Guidwire/gigguard/data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json';
const CSV_PATH = 'd:/Code/Guidwire/gigguard/data/pre-final_dataset3.csv';

const serviceAccount = require(SERVICE_ACCOUNT_PATH);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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

const names = [
    "Arjun Raghavan", "Sanjay Jayakumar", "Priya Krishnan", "Vijay Ramachandran", 
    "Anitha Selvam", "Rahul Mani", "Vikram Thiru", "Meera Lakshmi", 
    "Karthik Prabhu", "Divya Balaji", "Naveen Ganesan", "Sowmya Harish"
];

async function repopulate() {
    console.log(`[DATA] Clearing 'riders' collection...`);
    const snapshot = await db.collection('riders').limit(500).get();
    let batchDeleter = db.batch();
    snapshot.docs.forEach(doc => batchDeleter.delete(doc.ref));
    if (snapshot.size > 0) await batchDeleter.commit();

    console.log(`[DATA] Loading NEW dataset: ${CSV_PATH}...`);
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const headers = parseCSVLine(lines[0]);
    
    // Headers observed in row analysis:
    // 0: rider_id, 1: persona_type, 2: tier, 3: city, 4: Order_Date, 5: session_time_hhmm, 
    // 6: earning_efficiency, 7: delivered_orders, 8: past_week_earnings, 9: weekly_premium
    // ... no rider_name in pre-final_dataset3.csv actually ...

    const subset = lines.slice(1); // Import all rows (likely 2,000)
    let count = 0;
    let batch = db.batch();
    
    for (let i = 0; i < subset.length; i++) {
        const vals = parseCSVLine(subset[i]);
        if (!vals[0]) continue; 

        const data = {
            rider_id: vals[0],
            persona_type: vals[1],
            city: vals[3] || 'Chennai',
            session_time_hhmm: vals[5],
            earning_efficiency: parseFloat(vals[6]) || 0.85,
            weekly_premium: parseFloat(vals[9]) || 1200,
            // Synthetic name for the 1:1 records since pre-final_dataset3.csv lacks it
            rider_name: names[i % names.length] + " (" + vals[0] + ")"
        };

        const docRef = db.collection('riders').doc(String(data.rider_id));
        batch.set(docRef, data);
        count++;

        if (count % 400 === 0) {
            await batch.commit();
            console.log(`[DATA] Synced ${count} records...`);
            batch = db.batch();
        }
    }
    if (count % 400 !== 0) await batch.commit();
    console.log(`[DATA] Sync complete: ${count} riders populated.`);
    process.exit(0);
}

repopulate().catch(console.error);
