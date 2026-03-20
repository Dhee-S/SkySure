import { Link } from 'react-router-dom'
import { Shield, Cloud, Users } from 'lucide-react'

export default function Landing() {
  return (
    <div className="container">
      <div className="hero">
        <h1>SkySure</h1>
        <p>Zero-Touch Parametric Insurance for Gig Workers</p>
        <p style={{ marginTop: 20, fontSize: 16 }}>Insurance that pays before you ask.</p>
      </div>

      <div className="grid grid-2">
        <Link to="/client/overview" className="card" style={{ textDecoration: 'none' }}>
          <Users size={48} color="#1a3a5c" />
          <h3 style={{ marginTop: 16 }}>Client Portal</h3>
          <p style={{ color: '#8896a6' }}>Dashboard, rider management, and simulation</p>
        </Link>

        <div className="card">
          <Cloud size={48} color="#0d6e4f" />
          <h3 style={{ marginTop: 16 }}>How It Works</h3>
          <ul style={{ color: '#8896a6', marginTop: 12, paddingLeft: 20 }}>
            <li>Weather triggers automatic payouts</li>
            <li>AI-powered fraud detection</li>
            <li>No claims process required</li>
            <li>Real-time monitoring</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 40 }}>
        <Shield size={32} color="#0d6e4f" />
        <h3 style={{ marginTop: 12 }}>Adversarial Defense</h3>
        <p style={{ color: '#8896a6', marginTop: 8 }}>Multi-signal behavioral fingerprinting with 47 data points per decision. Ring detection, GPS spoofing defense, and fraud prevention built-in.</p>
      </div>
    </div>
  )
}