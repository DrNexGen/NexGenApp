import { useState } from 'react'

const PHOTO_HERO = 'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SPFEw2mG97D9xwX_QUtzTlGutBcxqK-CoZNMeE8eZb8lN0aPJYQ1YFRIAsdOgMTt1kcMdUkL_2b-HBH7guRhSpKtN4osf_jNv020mTHp4iQNDCycp4WFdgZueiX6vGFWmQO8EJXZwKemJ7=s680-w680-h510-rw'
const PHOTO_CLINIC = 'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9Ri1lkxdJrST8gvvCA3gbQJAJlhXULBtS0__j4_yBYOYa2UMNRVCpFALaUMdrHJ_BC52l_ncDyECmtOlCjcyNmwEafk-o0BYXaKHuadv4mHy3SZgioIJtrmwcNBDBcTRMy-Sn3wKnTuGnE=w284-h203-n-k-no-nu'

export default function LandingPage({ onEnterApp }) {
  const [showMap, setShowMap] = useState(false)

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <img src={PHOTO_HERO} alt="NexGen Ortho & Physio Care clinic" className="hero-img" />
        <div className="hero-content">
          <div className="hero-badge">Open 24 Hours</div>
          <h1 className="hero-title">NexGen Ortho &<br />Physio Care</h1>
          <p className="hero-sub">Expert Orthopaedic & Physiotherapy Care in Bengaluru</p>
          <div className="hero-actions">
            <a href="tel:09480038423" className="hero-btn hero-btn-primary">
              <IconPhone /> Call Now
            </a>
            <button className="hero-btn hero-btn-outline" onClick={onEnterApp}>
              <IconLock /> Staff Portal
            </button>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="info-bar">
        <div className="info-item">
          <IconClock />
          <div>
            <strong>Open 24 Hours</strong>
            <span>All days</span>
          </div>
        </div>
        <div className="info-divider" />
        <div className="info-item">
          <IconMapPin />
          <div>
            <strong>New BEL Road</strong>
            <span>Bengaluru</span>
          </div>
        </div>
        <div className="info-divider" />
        <div className="info-item">
          <IconPhone />
          <div>
            <strong>094800 38423</strong>
            <span>Call us</span>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="land-section">
        <h2 className="land-heading">About Us</h2>
        <div className="about-grid">
          <img src={PHOTO_CLINIC} alt="Clinic interior" className="about-photo" />
          <div className="about-text-block">
            <p>
              NexGen Ortho & Physio Care is a leading orthopaedic and physiotherapy
              clinic located on New BEL Road, Bengaluru. We provide comprehensive
              musculoskeletal care with state-of-the-art facilities and experienced
              specialists.
            </p>
            <p>
              From fracture management and joint care to post-surgical rehabilitation
              and sports injury treatment — we are committed to getting you back to
              your best, pain-free life.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="land-section land-section-alt">
        <h2 className="land-heading">Our Services</h2>
        <div className="services-grid">
          <ServiceCard
            icon={<IconBone />}
            title="Orthopaedics"
            items={['Fracture treatment', 'Joint replacement', 'Arthritis care', 'Sports injuries', 'Spine disorders', 'Injection therapy']}
          />
          <ServiceCard
            icon={<IconActivity />}
            title="Physiotherapy"
            items={['Manual therapy', 'Exercise rehabilitation', 'Electrotherapy (IFT/TENS/US)', 'Post-op rehab', 'Post-fracture rehab', 'Sports rehab']}
          />
        </div>
      </section>

      {/* Doctors */}
      <section className="land-section">
        <h2 className="land-heading">Our Doctors</h2>
        <div className="doctors-grid">
          <DoctorCard
            name="Dr. Varun"
            dept="Orthopaedics"
            desc="Specialist in orthopaedic surgery, fracture management, joint care, and sports medicine."
            color="var(--teal-700)"
          />
          <DoctorCard
            name="Dr. Umashankar"
            dept="Physiotherapy"
            desc="Expert in rehabilitation, manual therapy, electrotherapy, and post-surgical recovery."
            color="var(--teal-600)"
          />
        </div>
      </section>

      {/* Contact */}
      <section className="land-section land-section-alt">
        <h2 className="land-heading">Visit Us</h2>
        <div className="contact-card">
          <div className="contact-row">
            <IconMapPin />
            <div>
              <strong>54, New BEL Road</strong>
              <span>Bengaluru, Karnataka 560094</span>
            </div>
          </div>
          <div className="contact-row">
            <IconPhone />
            <div>
              <a href="tel:09480038423"><strong>094800 38423</strong></a>
            </div>
          </div>
          <div className="contact-row">
            <IconClock />
            <div>
              <strong>Open 24 Hours</strong>
              <span>All days including Sundays & holidays</span>
            </div>
          </div>
          <button className="map-toggle" onClick={() => setShowMap(!showMap)}>
            {showMap ? 'Hide Map' : 'Show on Map'} →
          </button>
          {showMap && (
            <iframe
              title="NexGen location"
              className="map-frame"
              loading="lazy"
              src="https://www.google.com/maps?q=54+New+BEL+Road+Bengaluru+Karnataka+560094&output=embed"
            />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Need Expert Care?</h2>
        <p>Book your appointment today or walk in anytime — we're open 24 hours.</p>
        <div className="cta-actions">
          <a href="tel:09480038423" className="hero-btn hero-btn-white">
            <IconPhone /> Call 094800 38423
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div className="footer-brand">
          <IconStethoscope />
          <strong>NexGen Ortho & Physio Care</strong>
        </div>
        <p>54, New BEL Road, Bengaluru, Karnataka 560094</p>
        <p>© {new Date().getFullYear()} NexGen Ortho & Physio Care. All rights reserved.</p>
        <button className="footer-staff" onClick={onEnterApp}>Staff Portal →</button>
      </footer>
    </div>
  )
}

function ServiceCard({ icon, title, items }) {
  return (
    <div className="service-card">
      <div className="service-icon">{icon}</div>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}><IconCheck /> {item}</li>
        ))}
      </ul>
    </div>
  )
}

function DoctorCard({ name, dept, desc, color }) {
  const initials = name.replace('Dr. ', '').slice(0, 2).toUpperCase()
  return (
    <div className="doctor-card">
      <div className="doctor-avatar" style={{ background: color }}>{initials}</div>
      <h3>{name}</h3>
      <div className="doctor-dept">{dept}</div>
      <p>{desc}</p>
    </div>
  )
}

/* ---------- Icons ---------- */
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  )
}

function IconMapPin() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function IconBone() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 8.5l7 7"/>
      <path d="M8.5 8.5a2 2 0 1 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2z"/>
      <path d="M15.5 15.5a2 2 0 1 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2z"/>
    </svg>
  )
}

function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconStethoscope() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 8.5l7 7"/>
      <path d="M8.5 8.5a2 2 0 1 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2z"/>
      <path d="M15.5 15.5a2 2 0 1 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2z"/>
    </svg>
  )
}
