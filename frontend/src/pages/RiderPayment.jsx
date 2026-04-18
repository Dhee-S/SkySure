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

    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

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
            // Showcase Mode: Skip real Razorpay gateway
            // Simulate architectural handshake
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setSuccess(true);
            setTimeout(() => navigate('/rider'), 2500); // Directly to Dashboard
        } catch (error) {
            console.error("Activation error:", error);
            alert("Activation failed: " + error.message);
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
                        <Zap size={60} fill="#3b82f6" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Policy Activated!</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', marginBottom: '32px' }}>Welcome to the SkySure network. Your parametric protection is now live.</p>
                    <div style={{ color: '#2563eb', fontWeight: 800 }}>Initializing Partner Dashboard...</div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white', fontFamily: 'Inter' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}
            >
                {/* Left Side: Summary */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <Zap color="#2563eb" size={24} fill="#2563eb" />
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
                    <div style={{ background: '#111', padding: '40px', borderRadius: '32px', border: '1px solid #222' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '24px' }}>Payout Configuration</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>UPI ID for Payouts</label>
                                <input 
                                    type="text" placeholder="yourname@upi" 
                                    style={{ padding: '14px', borderRadius: '12px', background: '#000', border: '1px solid #333', color: 'white', fontWeight: 700, outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Phone Number</label>
                                <input 
                                    type="text" placeholder="+91 XXXXX XXXXX" 
                                    style={{ padding: '14px', borderRadius: '12px', background: '#000', border: '1px solid #333', color: 'white', fontWeight: 700, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handlePayment}
                            disabled={loading}
                            style={{ 
                                width: '100%', 
                                padding: '18px', 
                                borderRadius: '16px', 
                                background: '#2563eb', 
                                color: 'white', 
                                border: 'none', 
                                fontWeight: 900, 
                                fontSize: '16px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
                            }}
                        >
                            {loading ? 'Processing...' : 'Activate Coverage'} <ChevronRight size={18} />
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
