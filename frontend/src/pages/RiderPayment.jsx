import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, CreditCard, Lock, CheckCircle, 
    ChevronRight, Info, AlertCircle 
} from 'lucide-react';

export default function RiderPayment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { formData, premium } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!formData) {
            navigate('/register');
        }
        
        // Inject Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [formData, navigate]);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create order on backend
            const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: premium,
                    currency: 'INR',
                    receipt: `rcpt_${formData.uid.slice(-6)}`
                })
            });
            const orderData = await orderRes.json();

            if (!orderData.id) throw new Error("Failed to create order");

            // 2. Open Razorpay Checkout
            const options = {
                key: 'rzp_test_Sdnfivn0EXOo2q',
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'SkySure AI',
                description: `${formData.persona} - Weekly Protection`,
                order_id: orderData.id,
                handler: async (response) => {
                    // 3. Verify payment
                    const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            riderId: formData.uid,
                            plan: formData.persona,
                            amount: premium
                        })
                    });
                    const verifyData = await verifyRes.json();
                    
                    if (verifyData.success) {
                        setSuccess(true);
                        setTimeout(() => navigate('/login'), 4000);
                    } else {
                        throw new Error(verifyData.error || "Verification failed");
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: '#2563eb'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Payment error:", error);
            alert("Payment failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter' }}>
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '60px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <div style={{ width: '100px', height: '100px', background: 'rgba(37, 99, 235, 0.2)', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <CheckCircle size={60} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Policy Activated!</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', marginBottom: '32px' }}>Welcome to the SkySure network. Your parametric protection is now live.</p>
                    <div style={{ color: '#2563eb', fontWeight: 800 }}>Redirecting to sign-in...</div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white', fontFamily: 'Inter' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '800px', display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', gap: '32px' }}
            >
                {/* Left Side: Summary */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <ShieldCheck color="#2563eb" size={24} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Review Your Plan</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <SummaryItem label="Selected Persona" value={formData?.persona} />
                        <SummaryItem label="Vehicle Type" value={formData?.vehicle?.toUpperCase()} />
                        <SummaryItem label="Service City" value={formData?.city} />
                        <SummaryItem label="Target Weekly Earnings" value={`₹${formData?.targetEarnings}`} />
                        
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Weekly Contribution</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563eb' }}>₹{premium}</div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textAlign: 'right' }}>
                                Inclusive of dynamic <br /> actuarial surcharge
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: '#2563eb', padding: '40px', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'white', opacity: 0.1, borderRadius: '50%' }} />
                        <CreditCard size={32} style={{ marginBottom: '24px' }} />
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>Secure Checkout</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '32px', fontWeight: 500 }}>Payments are encrypted and processed via Razorpay secured network.</p>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={loading}
                            style={{ 
                                width: '100%', 
                                padding: '18px', 
                                borderRadius: '16px', 
                                background: 'white', 
                                color: '#2563eb', 
                                border: 'none', 
                                fontWeight: 900, 
                                fontSize: '16px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            {loading ? 'Initializing...' : 'Pay with Razorpay'} <ChevronRight size={18} />
                        </button>
                    </div>

                    <div style={{ padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                            <Info size={18} color="rgba(255,255,255,0.4)" />
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>By proceeding, you agree to the SkySure Parametric Coverage Terms. Payouts are automated based on hyperlocal weather telemetry and app link signal.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800 }}>
                            <Lock size={12} /> SECURE 256-BIT ENCRYPTION
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            <span style={{ fontSize: '14px', fontWeight: 900 }}>{value}</span>
        </div>
    );
}
