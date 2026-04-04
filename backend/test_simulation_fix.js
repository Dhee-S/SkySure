const axios = require('axios');

async function test() {
    try {
        const resp = await axios.post('http://localhost:3001/api/simulation/batch', {
            location: 'Chennai',
            isLiveMode: false
        });
        const firstNode = resp.data.nodes[0];
        console.log('--- TEST RESULTS ---');
        console.log('ID:', firstNode.id);
        console.log('Payout Math:', JSON.stringify(firstNode.payout.math, null, 2));
        console.log('Status:', firstNode.payout.status);
    } catch (e) {
        console.error('Test Failed:', e.message);
    }
}

test();
