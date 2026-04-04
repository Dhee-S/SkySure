const axios = require('axios');

async function test() {
    try {
        const resp = await axios.get('http://localhost:3001/api/riders');
        console.log(`Success! Fetched ${resp.data.length} riders.`);
        console.log('Sample Rider:', JSON.stringify(resp.data[0], null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Test Failed:', e.message);
        process.exit(1);
    }
}

test();
