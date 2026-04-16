const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../../firebase');

// Razorpay Test Keys
const RAZORPAY_KEY_ID = 'rzp_test_Sdnfivn0EXOo2q';
const RAZORPAY_KEY_SECRET = '5XvY800x56bkt9QDwBwBhh9p';

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});

/**
 * @route POST /api/payment/create-order
 * @desc Create a Razorpay order for premium payment
 */
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        
        if (!amount) return res.status(400).json({ error: 'Amount is required' });

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        console.log(`[PAYMENT] Order Created: ${order.id}`);
        res.json(order);
    } catch (error) {
        console.error('[PAYMENT_ORDER_ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/payment/verify
 * @desc Verify Razorpay signature and activate policy
 */
router.post('/verify', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            riderId, 
            plan,
            amount 
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            console.log(`[PAYMENT] Verified: ${razorpay_payment_id}`);

            // 1. Create Active Policy
            const policyId = `POL-TN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
            const policyData = {
                policy_id: policyId,
                rider_id: riderId,
                plan_selected: plan || 'Standard',
                total_paid: parseFloat(amount) || 0,
                status: 'ACTIVE',
                activated_at: new Date().toISOString(),
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            };

            await db.collection('policies').doc(policyId).set(policyData);
            
            // 2. Update Rider Profile to status 'Protected'
            await db.collection('rider_profiles').doc(riderId).update({
                active_policy_id: policyId,
                tier: plan || 'Standard',
                is_protected: true,
                last_payment_date: new Date().toISOString()
            });

            res.json({ 
                success: true, 
                policyId,
                message: "Policy activated successfully" 
            });
        } else {
            console.warn('[PAYMENT] Signature Mismatch');
            res.status(400).json({ error: "Invalid payment signature" });
        }
    } catch (error) {
        console.error('[PAYMENT_VERIFY_ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
