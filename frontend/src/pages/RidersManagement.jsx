import { useEffect, useState } from 'react';
import { getRiders, enrollRider, removeRider } from '../mockStore';
import { CITIES } from '../weather';

const tierPill = { Pro: 'pill-purple', Standard: 'pill-info', Basic: 'pill-grey' };
const tierAvatarBg = { Pro: 'var(--purple-light)', Standard: 'var(--info-light)', Basic: 'var(--surface-2)' };
const tierAvatarColor = { Pro: 'var(--purple)', Standard: 'var(--info)', Basic: 'var(--text-muted)' };

const CITY_ZONES = {
  Chennai: ['Chennai Central', 'T. Nagar', 'Anna Nagar', 'Velachery', 'Madipakkam', 'Sholinganallur', 'Ambattur', 'Porur'],
  Coimbatore: ['Coimbatore North', 'Singanallur', 'Saibaba Colony', 'Gandhipuram', 'RS Puram', 'Udayampalayam'],
  Madurai: ['Madurai Central', 'Goripalayam', 'Anna Nagar', 'Tallakulam', 'Koodal Nagar', 'Sellur'],
  Tiruchirappalli: ['Tiruchirappalli Central', 'Srirangam', 'Woraiyur', 'Cantonment', 'Thillai Nagar'],
  Salem: ['Salem Town', 'Hasthampatti', 'Shevapet', 'Ammapet', 'Narasingapuram'],
  Vellore: ['Vellore Central', 'Sathuvachari', 'Gandhi Nagar', 'Katkupanne', 'Virinjipuram'],
  Tirunelveli: ['Tirunelveli Town', 'Palayamkottai', 'Thatchanallur', 'Maharaja Nagar'],
  Erode: ['Erode Central', 'Surampatti', 'Bhavani', 'Perundurai'],
  Dindigul: ['Dindigul Central', 'Anna Nagar', 'Resettlement Colony', 'Battiprolu'],
  Thanjavur: ['Thanjavur Town', 'New Town', 'Maharajapuram', 'Kumbakonam'],
};

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tier: 'Standard',
    phone: '',
    vehicleType: 'Motorcycle',
    city: 'Chennai',
    zone: CITY_ZONES.Chennai[0],
    location: null,
  });
  const [detecting, setDetecting] = useState(false);

  useEffect(() => { loadRiders(); }, []);

  async function loadRiders() {
    setLoading(true);
    const data = await getRiders();
    setRiders(data);
    setLoading(false);
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    try {
      const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, maximumAge: 60000 });
      });
      const { latitude: lat, longitude: lon } = pos.coords;
      const nearest = findNearestCity(lat, lon);
      const zones = CITY_ZONES[nearest] || CITY_ZONES.Chennai;
      setFormData(prev => ({ ...prev, city: nearest, zone: zones[0], location: { lat, lon, name: zones[0] } }));
    } catch {
      setFormData(prev => ({ ...prev, city: 'Chennai', zone: CITY_ZONES.Chennai[0], location: null }));
    }
    setDetecting(false);
  }

  function findNearestCity(lat, lon) {
    let nearest = 'Chennai', minDist = Infinity;
    for (const [city, coords] of Object.entries(CITIES)) {
      const d = Math.sqrt((lat - coords.lat) ** 2 + (lon - coords.lon) ** 2);
      if (d < minDist) { minDist = d; nearest = city; }
    }
    return nearest;
  }

  function getZoneCoords(city, zone) {
    const base = CITIES[city] || CITIES.Chennai;
    const j = () => (Math.random() - 0.5) * 0.05;
    return { lat: base.lat + j(), lon: base.lon + j(), name: zone };
  }

  async function handleEnroll(e) {
    e.preventDefault();
    const zoneCoords = getZoneCoords(formData.city, formData.zone);
    await enrollRider({
      ...formData,
      location: zoneCoords,
      avgLocation: zoneCoords,
      zones: CITY_ZONES[formData.city] || [],
    });
    setShowModal(false);
    setFormData({ name: '', tier: 'Standard', phone: '', vehicleType: 'Motorcycle', city: 'Chennai', zone: CITY_ZONES.Chennai[0], location: null });
    loadRiders();
  }

  async function handleRemove(id) {
    if (confirm('Remove this rider?')) {
      await removeRider(id);
      loadRiders();
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner-lg"></div><p>Loading riders...</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Riders</h1>
            <p className="page-subtitle">Manage enrolled riders and their coverage</p>
          </div>
          <button className="btn btn-accent" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Enroll Rider
          </button>
        </div>
      </header>

      <div className="card">
        <div className="card-body" style={{ padding: riders.length === 0 ? 0 : undefined }}>
          {riders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p>No riders enrolled yet</p>
              <button className="btn btn-accent" onClick={() => setShowModal(true)}>Enroll First Rider</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Location</th>
                    <th>Tier</th>
                    <th>Vehicle</th>
                    <th>Enrolled</th>
                    <th>Total Received</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map(rider => (
                    <tr key={rider.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: tierAvatarBg[rider.tier], color: tierAvatarColor[rider.tier] }}>
                            {rider.name.charAt(0)}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{rider.name}</span>
                            <span className="user-meta">{rider.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{rider.city}</span>
                        <span className="user-meta" style={{ display: 'block' }}>{rider.zone || rider.location?.name || 'N/A'}</span>
                      </td>
                      <td>
                        <span className={`pill ${tierPill[rider.tier]}`}>{rider.tier}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                          ({rider.tier === 'Pro' ? '1.3x' : rider.tier === 'Standard' ? '1.0x' : '0.7x'})
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{rider.vehicleType}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(rider.enrolledAt).toLocaleDateString()}</td>
                      <td>
                        <span className="amount success">₹{rider.totalPayouts?.toLocaleString() || 0}</span>
                        <span className="user-meta" style={{ display: 'block' }}>{rider.payoutCount || 0} events</span>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(rider.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Enroll New Rider
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleEnroll}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter rider name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 40000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Coverage Tier</label>
                  <select className="form-select" value={formData.tier} onChange={e => setFormData({ ...formData, tier: e.target.value })}>
                    <option value="Basic">Basic (0.7x payout)</option>
                    <option value="Standard">Standard (1.0x payout)</option>
                    <option value="Pro">Pro (1.3x payout)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-select" value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Operating City
                  </label>
                  <select className="form-select" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value, zone: (CITY_ZONES[e.target.value] || CITY_ZONES.Chennai)[0] })}>
                    {Object.keys(CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Zone</label>
                  <select className="form-select" value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })}>
                    {(CITY_ZONES[formData.city] || CITY_ZONES.Chennai).map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <button type="button" className="btn btn-secondary" onClick={detectLocation} disabled={detecting} style={{ width: '100%' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {detecting ? 'Detecting...' : 'Detect Location'}
                  </button>
                  {formData.location && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                      {formData.location.lat.toFixed(4)}, {formData.location.lon.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">Enroll Rider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
