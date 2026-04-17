const express = require('express');
const router = express.Router();
const { db } = require('../../firebase');

/**
 * @route POST /api/rider/register
 * @desc Create or update rider profile in Firestore
 */
router.post('/register', async (req, res) => {
    try {
        const { uid, email, name, phone, city, vehicle, persona, targetEarnings, upi, partnerApp } = req.body;
        
        if (!uid) return res.status(400).json({ error: 'UID is required' });

        const riderData = {
            rider_id: uid,
            email: email || '',
            name: name || 'Rider',
            phone: phone || '',
            city: city || 'Chennai',
            vehicle_type: vehicle || 'bike',
            persona_type: persona || 'Gig-Pro',
            partner_app: (partnerApp || 'other').toLowerCase(),
            target_earnings: parseFloat(targetEarnings) || 5000,
            upi_id: upi || '',
            is_active: true,
            trust_score: 85, 
            fraud_probability: 0.05,
            joined_at: new Date().toISOString()
        };

        // 1. Update/Create Rider Profile
        await db.collection('rider_profiles').doc(uid).set(riderData, { merge: true });
        
        // 2. Ensure User Role is set to 'rider'
        await db.collection('users').doc(uid).set({
            uid,
            email: email || '',
            role: 'rider'
        }, { merge: true });

        console.log(`[RIDER] Registered: ${uid} (${name})`);
        
        res.json({ 
            success: true, 
            riderId: uid,
            data: riderData
        });
    } catch (error) {
        console.error('[RIDER_REGISTER_ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
