import { useState, useEffect, useRef } from 'react'

const PHOTO_LOGO = '/images/image1.png'
const PHOTO_PHYSIO = '/images/image2.png'
const PHOTO_RECEPTION = '/images/image3.png'
const PHOTO_DOCTORS = '/images/image4.png'
const PHOTO_CLINIC = '/images/image5.png'

export default function LandingPage({ onEnterApp }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.15 })
    reveals.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const toggleFaq = (i) => setFaqOpen(faqOpen === i ? null : i)

  return (
    <div className="lp">
      {/* NAV */}
      <nav className={`lp-nav${scrolled ? ' lp-nav-scrolled' : ''}`}>
        <a href="#" className="lp-logo">
          <img src={PHOTO_LOGO} alt="NexGen logo" />
          <span className="lp-logo-text">NexGen <span>Ortho & Physio</span></span>
        </a>
        <ul className={menuOpen ? 'lp-nav-links open' : 'lp-nav-links'}>
          <li><a href="#services" onClick={() => setMenuOpen(false)}>Services</a></li>
          <li><a href="#doctor" onClick={() => setMenuOpen(false)}>Doctors</a></li>
          <li><a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a></li>
          <li><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
        </ul>
        <a href="tel:09480038423" className="lp-nav-cta">Call Now</a>
        <button className={`lp-hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-content" style={{ animation: 'fadeUp .8s ease both' }}>
          <div className="lp-hero-text">
            <div className="lp-rating">
              <span className="lp-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              <span>Trusted by 1000+ patients</span>
            </div>
            <h1>Expert Orthopaedic &<br />Physiotherapy Care</h1>
            <p>Comprehensive bone, joint & rehabilitation care with experienced specialists in Bengaluru. Open 24 hours, every day.</p>
            <div className="lp-hero-btns">
              <a href="tel:09480038423" className="lp-btn lp-btn-primary">Call Now</a>
              <a href="#services" className="lp-btn lp-btn-outline">Our Services</a>
            </div>
          </div>
          <div className="lp-hero-image">
            <img src={PHOTO_CLINIC} alt="NexGen Clinic" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats reveal">
        <div className="lp-stat">
          <span className="lp-stat-num">24/7</span>
          <span className="lp-stat-label">Open All Days</span>
        </div>
        <div className="lp-stat">
          <span className="lp-stat-num">3+</span>
          <span className="lp-stat-label">Expert Doctors</span>
        </div>
        <div className="lp-stat">
          <span className="lp-stat-num">1000+</span>
          <span className="lp-stat-label">Happy Patients</span>
        </div>
        <div className="lp-stat">
          <span className="lp-stat-num">10+</span>
          <span className="lp-stat-label">Specialised Services</span>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="lp-section">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag">WHAT WE OFFER</span>
          <h2 className="lp-section-title">Our Services</h2>
          <p className="lp-section-sub">Comprehensive orthopaedic and physiotherapy treatments for all age groups</p>
          <div className="lp-services-grid">
            {SERVICES.map((s, i) => (
              <div className="lp-service-card" key={i}>
                <div className="lp-service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS */}
      <section id="doctor" className="lp-section lp-section-alt">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag">MEET OUR TEAM</span>
          <h2 className="lp-section-title">Our Doctors</h2>
          <p className="lp-section-sub">Experienced specialists dedicated to your well-being</p>

          <div className="lp-doctor-wrap">
            <div className="lp-doctor-img-wrap">
              <img src={PHOTO_DOCTORS} alt="Our Doctors" />
            </div>
            <div className="lp-doctor-info">
              <h3>Dr. Varun</h3>
              <p className="lp-doctor-role">Orthopaedic Surgeon</p>
              <p>Specialist in orthopaedic surgery, fracture management, joint replacement, arthritis care and sports medicine. Committed to getting you back on your feet.</p>
              <div className="lp-doctor-stats">
                <div><strong>500+</strong><span>Surgeries</span></div>
                <div><strong>10+</strong><span>Years Exp.</span></div>
                <div><strong>4.9</strong><span>Rating</span></div>
              </div>
            </div>
          </div>

          <div className="lp-doctors-cards reveal">
            <div className="lp-doc-card">
              <div className="lp-doc-avatar" style={{ background: '#00a896' }}>UG</div>
              <h4>Dr. Umashankar G.B</h4>
              <p className="lp-doc-role">Physiotherapy &middot; MPT in Sports</p>
              <p>Expert in sports physiotherapy, rehabilitation, manual therapy, and post-surgical recovery programmes.</p>
            </div>
            <div className="lp-doc-card">
              <div className="lp-doc-avatar" style={{ background: '#0b2d5e' }}>PK</div>
              <h4>Dr. Praveen Kumar P</h4>
              <p className="lp-doc-role">Physician &middot; MD Internal Medicine</p>
              <p>Consultant physician specialising in internal medicine, general health, and chronic disease management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="lp-section">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag">WHY CHOOSE US</span>
          <h2 className="lp-section-title">Why NexGen?</h2>
          <div className="lp-why-grid">
            {WHY_US.map((w, i) => (
              <div className="lp-why-item" key={i}>
                <div className="lp-why-icon">{w.icon}</div>
                <div>
                  <h4>{w.title}</h4>
                  <p>{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="lp-section lp-section-alt">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag">OUR CLINIC</span>
          <h2 className="lp-section-title">Gallery</h2>
          <div className="lp-gallery-grid">
            <div><img src={PHOTO_LOGO} alt="Clinic signboard" /></div>
            <div><img src={PHOTO_RECEPTION} alt="Reception" /></div>
            <div className="lp-gallery-tall"><img src={PHOTO_PHYSIO} alt="Physiotherapy room" /></div>
            <div><img src={PHOTO_CLINIC} alt="Clinic interior" /></div>
            <div><img src={PHOTO_DOCTORS} alt="Doctor nameplates" /></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag">COMMON QUESTIONS</span>
          <h2 className="lp-section-title">Frequently Asked Questions</h2>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => (
              <div className={`lp-faq-item${faqOpen === i ? ' open' : ''}`} key={i}>
                <button className="lp-faq-q" onClick={() => toggleFaq(i)}>
                  {f.q}
                  <span className="lp-faq-arrow">&#9660;</span>
                </button>
                <div className="lp-faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag">PATIENT REVIEWS</span>
          <h2 className="lp-section-title">What Our Patients Say</h2>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-testimonial" key={i}>
                <div className="lp-test-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>"{t.text}"</p>
                <div className="lp-test-author">
                  <div className="lp-test-avatar">{t.name[0]}</div>
                  <span className="lp-test-name">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="lp-contact">
        <div className="lp-section-inner reveal">
          <span className="lp-section-tag" style={{ color: '#00a896' }}>GET IN TOUCH</span>
          <h2 className="lp-section-title" style={{ color: '#fff' }}>Contact Us</h2>
          <p className="lp-section-sub" style={{ color: '#94a3b8' }}>Visit us or call anytime — we're open 24 hours</p>
          <div className="lp-contact-grid">
            <div className="lp-contact-item">
              <h4>Address</h4>
              <p>54, New BEL Road<br />Bengaluru, Karnataka 560094</p>
            </div>
            <div className="lp-contact-item">
              <h4>Phone</h4>
              <p><a href="tel:09480038423">094800 38423</a></p>
            </div>
            <div className="lp-contact-item">
              <h4>Hours</h4>
              <p>Open 24 Hours<br />All days including holidays</p>
            </div>
            <div className="lp-contact-item">
              <h4>Services</h4>
              <p>Orthopaedics<br />Physiotherapy<br />General Medicine</p>
            </div>
          </div>
          <div className="lp-map-wrap">
            <iframe
              title="NexGen location"
              loading="lazy"
              src="https://www.google.com/maps?q=54+New+BEL+Road+Bengaluru+Karnataka+560094&output=embed"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p>&copy; {new Date().getFullYear()} NexGen Ortho & Physio Care. All rights reserved. &nbsp;|&nbsp; <button className="lp-footer-staff" onClick={onEnterApp}>Staff Portal</button></p>
      </footer>

      {/* FLOATING BUTTONS */}
      <div className="lp-float-btns">
        <a href="https://wa.me/919480038423" className="lp-float-btn lp-float-wa" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.174-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
        <a href="tel:09480038423" className="lp-float-btn lp-float-call" aria-label="Call">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
      </div>
    </div>
  )
}

/* ── DATA ── */
const SERVICES = [
  { icon: '🦴', title: 'Fracture Treatment', desc: 'Expert care for all types of fractures with modern fixation techniques and swift recovery plans.' },
  { icon: '🏥', title: 'Joint Replacement', desc: 'Total and partial knee & hip replacement surgeries with latest implant technology.' },
  { icon: '💪', title: 'Physiotherapy', desc: 'Comprehensive rehabilitation including manual therapy, electrotherapy (IFT/TENS/US) and exercise programmes.' },
  { icon: '🏃', title: 'Sports Medicine', desc: 'Specialised treatment for sports injuries, ligament tears, and athletic rehabilitation.' },
  { icon: '🩺', title: 'General Medicine', desc: 'Internal medicine consultation for chronic diseases, general health check-ups and preventive care.' },
  { icon: '💉', title: 'Injection Therapy', desc: 'PRP therapy, joint injections, and pain management procedures for faster healing.' },
  { icon: '🧠', title: 'Spine Care', desc: 'Diagnosis and treatment of back pain, disc problems, sciatica, and spinal disorders.' },
  { icon: '🦿', title: 'Post-Op Rehab', desc: 'Structured post-surgical rehabilitation programmes to restore strength and mobility.' },
]

const WHY_US = [
  { icon: '🕐', title: 'Open 24 Hours', desc: 'Round-the-clock care, every day including Sundays and holidays.' },
  { icon: '👨‍⚕️', title: 'Expert Specialists', desc: 'Experienced orthopaedic surgeon, physiotherapist, and physician on our team.' },
  { icon: '🏥', title: 'Modern Facility', desc: 'State-of-the-art equipment and comfortable treatment rooms.' },
  { icon: '📍', title: 'Prime Location', desc: 'Conveniently located on New BEL Road, easily accessible from all parts of Bengaluru.' },
  { icon: '💰', title: 'Affordable Care', desc: 'Quality healthcare at reasonable prices with transparent billing.' },
  { icon: '❤️', title: 'Patient-First Approach', desc: 'Personalised treatment plans tailored to each patient\'s needs and lifestyle.' },
]

const FAQS = [
  { q: 'What are the clinic timings?', a: 'NexGen Ortho & Physio Care is open 24 hours, 7 days a week, including Sundays and public holidays. You can walk in or call anytime.' },
  { q: 'Do I need an appointment?', a: 'Walk-ins are welcome. However, booking an appointment by calling 094800 38423 can help reduce your waiting time.' },
  { q: 'What conditions do you treat?', a: 'We treat fractures, joint pain, arthritis, sports injuries, back pain, disc problems, post-surgical rehabilitation, and general medical conditions.' },
  { q: 'Do you offer physiotherapy?', a: 'Yes, we have a dedicated physiotherapy department led by Dr. Umashankar G.B (MPT in Sports). Services include manual therapy, electrotherapy, exercise rehab, and sports rehabilitation.' },
  { q: 'Where is the clinic located?', a: 'We are located at 54, New BEL Road, Bengaluru, Karnataka 560094. The clinic is easily accessible by road and public transport.' },
  { q: 'What payment methods do you accept?', a: 'We accept cash, UPI, debit/credit cards, and most major insurance providers.' },
]

const TESTIMONIALS = [
  { name: 'Rajesh Kumar', text: 'Excellent orthopaedic care. Dr. Varun is very skilled and the staff is courteous. My knee surgery went smoothly and recovery was quick.' },
  { name: 'Priya Sharma', text: 'The physiotherapy sessions with Dr. Umashankar were very effective. My back pain reduced significantly within two weeks of treatment.' },
  { name: 'Suresh Reddy', text: 'Best clinic on New BEL Road. Open 24 hours is a blessing. The facilities are modern and clean. Highly recommended for ortho issues.' },
]
