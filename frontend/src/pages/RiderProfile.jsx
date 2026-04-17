import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    User, MapPin, Briefcase, 
    Shield, Mail, Phone, 
    Save, Zap, CheckCircle2 
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../App';

export default function RiderProfile() {
    const { rider } = useOutletContext();
    const showToast = useToast();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: rider?.name || '',
        city: rider?.city || 'Chennai',
        partnerApp: rider?.partner_app || 'Zomato',
        phone: rider?.phone || '',
        email: rider?.email || ''
    });

    useEffect(() => {
        if (rider) {
            setFormData({
                name: rider.name || '',
                city: rider.city || 'Chennai',
                partnerApp: rider.partner_app || 'Zomato',
                phone: rider.phone || '',
                email: rider.email || ''
            });
        }
    }, [rider]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!rider?.id && !rider?.rider_id) {
            showToast("Cannot update profile: Account session lost. Please login again.", "danger");
            return;
        }

        const riderId = rider.id || rider.rider_id;

        setLoading(true);
        try {
            const response = await fetch(`/api/rider/profile/${riderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    city: formData.city,
                    partnerApp: formData.partnerApp,
                    phone: formData.phone
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Update failed');

            showToast("Profile identity synchronized successfully.", "success");
            if (reloadRider) reloadRider();
        } catch (err) {
            console.error("Profile update error:", err);
            showToast(err.message || "Failed to sync profile data.", "danger");
        } finally {
            setLoading(false);
        }
    };


    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
            style={{ maxWidth: '800px' }}
        >
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>Partner Identity</h1>
                <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Manage your operational parameters and contact nodes.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                
                {/* ACCOUNT TIER CARD */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
                    borderRadius: '24px', 
                    padding: '32px', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.2)'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '8px' }}>Verified Status</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '4px' }}>{rider?.tier || 'Standard'} Tier</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={16} /> Actuarial verification complete
                        </div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
                        <Zap size={40} fill="white" />
                    </div>
                </div>

                {/* PROFILE FORM */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '40px' }}>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Legal Name</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Operational City</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <select 
                                    value={formData.city}
                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600, color: '#0f172a', appearance: 'none', background: 'white' }}
                                    required
                                >
                                    <option value="">Select City</option>
                                    <option>Chennai</option>
                                    <option>Coimbatore</option>
                                    <option>Madurai</option>
                                    <option>Salem</option>
                                    <option>Trichy</option>
                                </select>

                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Primary Partner App</label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <select 
                                    value={formData.partnerApp}
                                    onChange={e => setFormData({...formData, partnerApp: e.target.value})}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600, color: '#0f172a', appearance: 'none', background: 'white' }}
                                >
                                    <option>Zomato</option>
                                    <option>Swiggy</option>
                                    <option>Uber Eats</option>
                                    <option>Blinkit</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Communication Node (Email)</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600, color: '#94a3b8', background: '#f8fafc' }}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Uplink</label>
                            <div style={{ position: 'relative' }}>
                                <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input 
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}
                                    placeholder="+91 99999 99999"
                                />
                            </div>
                        </div>

                        <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ 
                                    width: '100%', 
                                    padding: '16px', 
                                    background: '#0f172a', 
                                    color: 'white', 
                                    borderRadius: '16px', 
                                    fontSize: '1rem', 
                                    fontWeight: 800, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                {loading ? 'Synchronizing...' : <><Save size={20} /> Update Identity</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}
