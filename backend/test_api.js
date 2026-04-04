const axios = require('axios');

async function testBatch() {
    try {
        console.log("Testing POST http://localhost:3001/api/simulation/batch ...");
        const res = await axios.post('http://localhost:3001/api/simulation/batch', {
            location: 'Chennai',
            isLiveMode: false
        });
        console.log("Response Status:", res.status);
        console.log("Nodes Count:", res.data?.nodes?.length);
        console.log("First Node Preview:", JSON.stringify(res.data?.nodes?.[0], null, 2));
    } catch (e) {
        if (e.code === 'ECONNREFUSED') {
            console.error("FAILED: Backend is NOT running on port 3001.");
        } else {
            console.error("FAILED:", e.message);
            if (e.response) console.error("Response:", e.response.data);
        }
    }
}

testBatch();
