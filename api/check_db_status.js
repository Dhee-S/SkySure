const { db } = require('./firebase');

async function check() {
    try {
        const snapshot = await db.collection('riders').limit(5).get();
        if (snapshot.empty) {
            console.log('--- DB is EMPTY ---');
            return;
        }
        console.log('--- DB SAMPLES ---');
        snapshot.forEach(doc => {
            console.log(`ID: ${doc.id}`);
            console.log(`Data: ${JSON.stringify(doc.data(), null, 2)}`);
            console.log('------------------');
        });
        
        // Check a specific city count
        const chennai = await db.collection('riders').where('city', '==', 'Chennai').get();
        console.log(`Chennai Count: ${chennai.size}`);
        
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}

check();
