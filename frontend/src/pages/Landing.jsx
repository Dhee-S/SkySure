import { Link } from 'react-router-dom';
import {
  Shield, CloudRain, Zap, ArrowRight,
  ShieldCheck, Cpu, Database, Radar, Fingerprint,
  Activity, Check, Globe, Box, Target,
  MapPin, Anchor, Wind, Layers, Eye,
  Gauge, Droplets, Sun, ThermometerSun,
  Rocket, Lock, HeadphonesIcon
} from 'lucide-react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import '../styles/landing.css';

export default function Landing() {
  const scrollToBlock = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const yHero = useTransform(heroScroll, [0, 1], [0, 200]);
  const opacityHero = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const scaleHero = useTransform(heroScroll, [0, 0.5], [1, 0.95]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    setMousePos({ x: clientX, y: clientY });
  };

  return (
    <div
      ref={containerRef}
      className="landing-wrapper"
      onMouseMove={handleMouseMove}
    >
      {/* Neural Mesh Background */}
      <div className="neural-mesh-bg">
        <div className="mesh-gradient-1" />
        <div className="mesh-gradient-2" />
        <div className="mesh-dots" />
      </div>

      {/* Pro Navbar */}
      <nav className="pro-nav">
        <div className="nav-content">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="logo-text">SkySure</span>
          </motion.div>

          <div className="nav-links hide-mobile">
            <a href="#platform" onClick={(e) => { e.preventDefault(); scrollToBlock('platform'); }} className="nav-link">Platform</a>
            <a href="#solutions" onClick={(e) => { e.preventDefault(); scrollToBlock('solutions'); }} className="nav-link">Solutions</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToBlock('pricing'); }} className="nav-link">Pricing</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="nav-signin">Sign In</Link>
            <Link to="/login" className="btn btn-primary nav-cta">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="platform" ref={heroRef} className="hero-section">
        <motion.div
          style={{ y: yHero, opacity: opacityHero, scale: scaleHero }}
          className="hero-content"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hero-badge"
          >
            <span className="badge-dot" />
            <span className="badge-text">Environmental Telemetry v3.2</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="hero-title"
          >
            Algorithmic Resilience for


            <span className="hero-title-accent">Urban Fleet.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hero-subtitle"
          >
            Parametric protection for delivery partners. We use real-time environmental telemetry to trigger instant payouts when weather or traffic density blocks your path, bypassing the traditional claims process.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hero-actions"
          >
            <Link to="/login" className="btn btn-primary btn-lg">
              Enterprise Access
              <ArrowRight size={18} className="btn-arrow" />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Partner Login
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hero-stats"
          >
            <div className="stat-item">
              <div className="stat-value">180s</div>
              <div className="stat-label">Settlement Time</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">98.4%</div>
              <div className="stat-label">Fraud Precision</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">14K+</div>
              <div className="stat-label">Active Riders</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="hero-visual"
        >
          <div className="visual-card">
            <div className="visual-radar">
              <Radar size={80} />
            </div>
            <div className="visual-content">
              <div className="visual-title">Live Monitoring</div>
              <div className="visual-subtitle">Weather Resilience Active</div>
            </div>
            <div className="visual-metrics">
              <div className="metric">
                <Droplets size={16} />
                <span>12mm/hr</span>
              </div>
              <div className="metric">
                <Wind size={16} />
                <span>45km/h</span>
              </div>
              <div className="metric">
                <ThermometerSun size={16} />
                <span>28°C</span>
              </div>
            </div>
            <div className="visual-pulse" />
          </div>
        </motion.div>
      </section>

      {/* --- BENTO SECTION: THE INTELLIGENCE --- */}
      <section id="solutions" className="bento-section">
        <div className="container">
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title text-main font-jakarta">The <span className="text-accent">Intelligence</span> Behind the Coverage.</h2>
            <p className="section-subtitle">Our algorithmic core processes environmental signals to ensure seamless resilience.</p>
          </motion.header>

          <div className="bento-grid">
            <BentoCard
              index={0} number="01" icon={Database}
              title="Parametric Ingestion"
              desc="SkySure hooks into global weather APIs and local traffic sensors to monitor precipitation and congestion in real-time."
            />
            <BentoCard
              index={1} number="02" icon={Zap}
              title="Algorithmic Triggers"
              desc="No human adjusters. When environmental data breaches your threshold, the payout protocol initiates automatically."
            />
            <BentoCard
              index={2} number="03" icon={Fingerprint}
              title="Ring Score Defense"
              desc="AI identifies geospatial clusters with 98% accuracy, segregating delays from coordinated fraud."
            />
            <BentoCard
              index={3} number="04" icon={Activity}
              title="Instant Liquidity"
              desc="Verified payouts are disbursed to digital wallets within 180 seconds, ensuring zero business interruption."
            />
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION: MINIMALIST PILLS --- */}
      <section className="features-section">
        <div className="container">
          <div className="features-minimal-grid">
            {[
              { icon: Wind, text: "Multi-Peril Monitoring" },
              { icon: Layers, text: "Persona-Adaptive Logic" },
              { icon: ThermometerSun, text: "Weekly Risk Loading" },
              { icon: ShieldCheck, text: "Geospatial Forensics" }
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="feature-pill"
              >
                <feat.icon size={18} />
                <span>{feat.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION: ADAPTIVE MATRIX --- */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <motion.header className="section-header text-center">
            <h2 className="section-title text-main font-jakarta">Adaptive Coverage Plans</h2>
            <p className="section-subtitle">Dynamic structures mapped to rider persona and environmental risk.</p>
          </motion.header>

          <div className="modern-pricing-grid">
            <ModernPricingCard
              tier="BASIC"
              subtitle="Student-Flex"
              premium="0.5%"
              coverage="60% Floor"
              cap="₹800"

              icon={Shield}
              delay={0.1}
            />
            <ModernPricingCard
              tier="STANDARD"
              subtitle="Gig-Pro"
              premium="1.0%"
              coverage="80% Floor"
              cap="₹1,200"

              icon={Zap}
              popular={true}
              delay={0.2}
            />
            <ModernPricingCard
              tier="PRO"
              subtitle="Full-Timer"
              premium="1.5%"
              coverage="95% Floor"
              cap="₹1,500"

              icon={Target}
              delay={0.3}
            />
          </div>
        </div>
      </section>




      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="cta-card"
          >
            <div className="cta-content">
              <h3>Ready to Secure Your Fleet?</h3>
              <p>Join thousands of partners who trust SkySure for instant parametric protection.</p>
              <Link to="/login" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
            </div>
            <div className="cta-decoration">
              <Rocket size={120} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span>SkySure / Protocol 3.2</span>
            </div>
            <div className="footer-links">
              <a href="#">Platform</a>
              <a href="#">Solutions</a>
              <a href="#">Pricing</a>
              <a href="#">Support</a>
            </div>
            <div className="footer-copyright">
              © 2026 Resilience Group. All assets encrypted.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Find this function at the bottom of Landing.jsx and replace it
function BentoCard({ number, icon: Icon, title, desc, index }) {
  // Logic: Odd numbers (01, 03) from Left, Even numbers (02, 04) from Right
  const isEven = parseInt(number) % 2 === 0;

  return (
    <motion.div
      // Starting state (hidden)
      initial={{
        opacity: 0,
        x: isEven ? 150 : -150,
        scale: 0.9
      }}
      // Active state (when in view)
      whileInView={{
        opacity: 1,
        x: 0,
        scale: 1
      }}
      // Exit state (when scrolling away)
      exit={{
        opacity: 0,
        x: isEven ? 150 : -150,
        scale: 0.9
      }}
      // Animation triggers every time (once: false)
      viewport={{
        once: false,
        amount: 0.2 // Triggers when 20% of the card is visible
      }}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1], // Custom professional ease
        delay: index * 0.05
      }}
      className="bento-card"
    >
      <div className="bento-number">{number}</div>
      <div className="bento-icon">
        <Icon size={28} />
      </div>
      <div className="bento-content">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="feature-card"
    >
      <div className="feature-icon">
        <Icon size={24} />
      </div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </motion.div>
  );
}

function ModernPricingCard({ tier, subtitle, premium, coverage, cap, icon: Icon, popular, delay, trigger = "Medium" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`modern-pricing-card ${popular ? 'popular' : ''}`}
    >
      {popular && (
        <div className="popular-badge-container">
          <div className="popular-badge-glow" />
          <div className="popular-badge"><Zap size={14} className="badge-icon" /> Most Popular</div>
        </div>
      )}

      <div className="card-header">
        <motion.div
          className="card-icon-wrapper"
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          <Icon size={32} className="card-icon" />
        </motion.div>
        <h3 className="card-tier">{tier}</h3>
        <p className="card-subtitle">{subtitle}</p>
      </div>

      <div className="card-divider" />

      <div className="card-metrics">
        <div className="metric">
          <span className="metric-label">Weekly Premium</span>
          <span className="metric-value">{premium} <span className="metric-sub">of Earnings</span></span>
        </div>
        <div className="metric">
          <span className="metric-label">Income Coverage</span>
          <span className="metric-value">{coverage}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Payout Cap</span>
          <span className="metric-value">{cap} <span className="metric-sub">/ day</span></span>
        </div>
        <div className="metric highlight-metric">
          <span className="metric-label">Trigger Sensitivity</span>
          <span className="metric-value">{trigger}</span>
        </div>
      </div>

      <div className="card-action">
        <Link to="/login" className={`btn ${popular ? 'btn-primary' : 'btn-outline'} w-full`}>
          Select {tier}
        </Link>
      </div>
    </motion.div>
  );
}

function Satellite(props) { return <Box {...props} /> }
