import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdVerified, MdLock, MdFlashOn, MdChat, MdArrowForward, MdStar, MdCheck } from 'react-icons/md';
import { FaPaperPlane, FaUsers, FaCompass } from 'react-icons/fa';

const T = {
  primary: '#e85d26', primaryLight: '#ff7d4d', primaryDark: '#c44a18',
  accent: '#f5a623', dark: '#1a1a2e', darkMid: '#2d2d44',
  text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa',
  bg: '#ffffff', bgSoft: '#faf9f7', border: '#ede9e3',
};

const destinations = [
  { name: 'Bali', country: 'Indonesia', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80', tag: 'Trending' },
  { name: 'Santorini', country: 'Greece', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80', tag: 'Popular' },
  { name: 'Kyoto', country: 'Japan', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80', tag: 'Top Rated' },
  { name: 'Goa', country: 'India', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80', tag: 'Hot Deal' },
  { name: 'Paris', country: 'France', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80', tag: 'Luxury' },
  { name: 'Dubai', country: 'UAE', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80', tag: 'Premium' },
];

const steps = [
  { num: '01', title: 'Post Your Trip', desc: 'Share destination, dates, travelers & preferences. Takes 2 minutes.', icon: <FaPaperPlane size={26} /> },
  { num: '02', title: 'Agencies Compete', desc: 'Verified travel agencies review your request and submit their best budgets.', icon: <FaUsers size={26} /> },
  { num: '03', title: 'Compare & Request Chat', desc: 'Review proposals side by side, chat with agencies, choose the best deal.', icon: <FaCompass size={26} /> },
];

const features = [
  { icon: <MdVerified size={26} />, title: 'Verified Agencies Only', desc: 'Every agency is GST verified and background checked' },
  { icon: <MdFlashOn size={26} />, title: 'Fast Responses', desc: 'Get your first bid within hours, no wasting time to chat, find, get offers from separate websites' },
  { icon: <MdChat size={26} />, title: 'Direct Chat', desc: 'Talk directly with agencies to customize your package' },
  { icon: <MdLock size={26} />, title: 'Privacy Protected', desc: 'Your contact details shared only after you decide to chat and agency pay for lead' },
];

const testimonials = [
  { initials: 'RS', name: 'Rahul Sharma', role: 'Traveler, Delhi', text: 'Got 8 quotes within 24 hours for my Goa trip. I found best platform to connect with agents and compare offers!', stars: 5 },
  { initials: 'PA', name: 'Paradise Adventures', role: 'Travel Agency, Mumbai', text: 'This platform doubled our bookings in 3 months. The lead quality is exceptional.', stars: 5 },
  { initials: 'PS', name: 'Priya Singh', role: 'Traveler, Bangalore', text: 'Planning our Europe honeymoon was so easy. Multiple agencies competed for our Trip!', stars: 5 },
];

const plans = [
  {
    name: 'Traveler', price: '₹0', period: 'Forever free', highlight: false,
    features: [
      '1 active trip at a time',
      'Receive all agency bids',
      '3 chat requests per trip',
      'View full quotations',
      'Basic support',
    ],
  },
  {
    name: 'Agency Basic', price: '₹299', period: '/month', highlight: true,
    features: [
      '15 bids per month',
      'Unlock traveler leads',
      'High budget trip access',
      'Direct chat with travelers',
      'Email support',
    ],
  },
  {
    name: 'Agency Pro', price: '₹499', period: '/month', highlight: false,
    features: [
      '25 bids per month',
      'Unlock traveler leads',
      'Luxury budget trip access',
      'Priority listing',
      'Priority support',
    ],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeDestination, setActiveDestination] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveDestination(p => (p + 1) % destinations.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, color: T.text, lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Playfair+Display:wght@600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .dest-card:hover { transform: translateY(-8px) scale(1.02) !important; }
        .step-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(232,93,38,0.15) !important; }
        .btn-primary:hover { background: ${T.primaryDark} !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,93,38,0.4) !important; }
        .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1) !important; }
        .feature-card:hover { border-color: ${T.primary}50 !important; background: ${T.primary}04 !important; }
        .plan-card { display: flex; flex-direction: column; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(255,255,255,0.97)' : 'white', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`, transition: 'all 0.3s', padding: '0 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaPaperPlane size={16} color="white" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: T.text, fontFamily: "'Playfair Display', serif" }}>CheckTravelPrice</span>
          </div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {['How it Works', 'Features', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                style={{ textDecoration: 'none', color: T.textMid, fontSize: '15px', fontWeight: '500', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = T.primary}
                onMouseLeave={e => e.target.style.color = T.textMid}>
                {item}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: `1.5px solid ${T.border}`, color: T.textMid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '8px 20px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
              Traveler Login
            </button>
            <button onClick={() => navigate('/agency-login')}
              style={{ background: 'none', border: `1.5px solid ${T.border}`, color: T.textMid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '8px 20px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}>
              Agency Login
            </button>
            <button className="btn-primary" onClick={() => navigate('/signup')}
              style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', boxShadow: `0 4px 12px rgba(232,93,38,0.3)` }}>
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: '120px', paddingBottom: '80px', paddingLeft: '5%', paddingRight: '5%', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${T.primary}15`, color: T.primary, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', background: T.primary, borderRadius: '50%', display: 'inline-block' }}></span>
            India's #1 Travel Bidding Platform
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '52px', fontWeight: '800', lineHeight: 1.15, marginBottom: '24px', color: T.text }}>
            Let Agencies
            <span style={{ display: 'block', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Compete For</span>
            Your Trip
          </h1>
          <p style={{ fontSize: '18px', color: T.textMid, marginBottom: '36px', lineHeight: 1.7, maxWidth: '480px' }}>
            Post your travel plans once. Receive quotes from verified agencies.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button className="btn-primary" onClick={() => navigate('/signup')}
              style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', boxShadow: `0 6px 20px rgba(232,93,38,0.35)`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Post Your Trip Free <MdArrowForward size={18} />
            </button>
            <button onClick={() => navigate('/agency-signup')}
              style={{ background: 'white', color: T.text, border: `1.5px solid ${T.border}`, padding: '14px 28px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = T.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.border; }}>
              Join as Agency
            </button>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[['10K+', 'Happy Travelers'], ['500+', 'Verified Agencies'], ['₹0', 'For Travelers']].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: T.primary }}>{num}</div>
                <div style={{ fontSize: '13px', color: T.textLight, fontWeight: '500' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination grid */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', transform: 'perspective(1000px) rotateY(-3deg)' }}>
            {destinations.map((dest, i) => (
              <div key={dest.name} className="dest-card"
                style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', position: 'relative', aspectRatio: '3/4', transform: i === activeDestination ? 'translateY(-8px) scale(1.02)' : 'none', boxShadow: i === activeDestination ? '0 20px 40px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)' }}
                onClick={() => setActiveDestination(i)}>
                <img src={dest.img} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%)', opacity: i === activeDestination ? 1 : 0.6, transition: 'opacity 0.3s' }}>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px' }}>
                    <div style={{ background: `${T.primary}cc`, color: 'white', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>{dest.tag}</div>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{dest.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{dest.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', top: '-16px', right: '-16px', background: 'white', padding: '12px 16px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: T.primary }}>15+</div>
            <div style={{ fontSize: '11px', color: T.textLight, fontWeight: '600' }}>Offers avg per trip</div>
          </div>
          <div style={{ position: 'absolute', bottom: '-16px', left: '20px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, padding: '12px 18px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(232,93,38,0.3)', color: 'white' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><MdVerified size={14} /> Free for travelers</div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>No hidden charges</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '80px 5%', background: T.bgSoft }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${T.primary}15`, color: T.primary, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>For Travelers</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '800', marginBottom: '12px' }}>How It Works</h2>
            <p style={{ fontSize: '17px', color: T.textMid, maxWidth: '480px', margin: '0 auto' }}>Get your dream trip quotation in three simple steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {steps.map((step) => (
              <div key={step.num} className="step-card" style={{ background: 'white', padding: '36px 28px', borderRadius: '20px', border: `1px solid ${T.border}`, transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '54px', fontWeight: '900', color: T.primary, opacity: 0.4, lineHeight: 1, fontFamily: "'Playfair Display', serif", userSelect: 'none', letterSpacing: '-2px' }}>
                  {step.num}
                </div>
                <div style={{ width: '56px', height: '56px', background: `${T.primary}12`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, marginBottom: '20px' }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: T.text }}>{step.title}</h3>
                <p style={{ color: T.textMid, fontSize: '15px', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — AGENCY */}
      <section style={{ padding: '0 5% 80px', background: T.bgSoft }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${T.dark}12`, color: T.dark, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>For Travel Agencies</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>How Agencies Win Clients</h2>
            <p style={{ fontSize: '17px', color: T.textMid, maxWidth: '480px', margin: '0 auto' }}>A simple system to find, bid and close quality leads</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {[
              {
                num: '01',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
                title: 'Browse Live Trips',
                points: ['Destination & dates listed', 'Traveler budget visible', 'Real verified requests only'],
              },
              {
                num: '02',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                title: 'Submit Quotation',
                points: ['Set your package price', 'Add itinerary & inclusions', 'Bid is private — traveler eyes only'],
              },
              {
                num: '03',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: 'Unlock & Close',
                points: ['Pay only when traveler picks you', 'Get full contact details', 'Contact & win your client'],
              },
            ].map(step => (
              <div key={step.num} className="step-card"
                style={{ background: 'white', padding: '32px 28px', borderRadius: '20px', border: `1px solid ${T.border}`, transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '54px', fontWeight: '900', color: T.primary, opacity: 0.4, lineHeight: 1, fontFamily: "'Playfair Display', serif", userSelect: 'none', letterSpacing: '-2px' }}>
                  {step.num}
                </div>
                <div style={{ width: '52px', height: '52px', background: `${T.primary}12`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, marginBottom: '18px' }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '14px', color: T.text }}>{step.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {step.points.map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: T.textMid, marginBottom: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.primary, flexShrink: 0 }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Agency CTA */}
          <div style={{ marginTop: '40px', background: `linear-gradient(135deg, ${T.dark}, #2d2d44)`, borderRadius: '20px', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>Ready to grow your agency?</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Join 500+ verified agencies already winning clients on CheckTravelPrice</p>
            </div>
            <button onClick={() => navigate('/agency-signup')}
              style={{ padding: '13px 32px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', boxShadow: `0 4px 16px rgba(232,93,38,0.4)` }}>
              Register Your Agency <MdArrowForward size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${T.primary}15`, color: T.primary, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>Why Choose Us</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '800', marginBottom: '20px', lineHeight: 1.2 }}>You Need One Marketplace for Agencies and Travellers</h2>
              <p style={{ fontSize: '16px', color: T.textMid, marginBottom: '36px', lineHeight: 1.7 }}>One platform where travelers get competitive quotes and agencies get quality leads.</p>
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="feature-card" style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '16px', borderRadius: '12px', border: `1px solid ${T.border}`, background: T.bgSoft, transition: 'all 0.3s', cursor: 'default' }}>
                  <div style={{ width: '44px', height: '44px', background: `${T.primary}10`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '15px' }}>{title}</div>
                    <div style={{ color: T.textMid, fontSize: '14px' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', height: '500px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80" alt="Travel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${T.dark}cc 0%, transparent 60%)` }} />
              </div>
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: '13px', color: T.textLight, marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MdFlashOn size={14} color={T.accent} /> New Bids Received
                </div>
                {[{ name: 'Sunrise Travels', amount: '₹42,500', badge: '4.9' }, { name: 'Paradise Tours', amount: '₹38,000', badge: 'Verified' }].map(bid => (
                  <div key={bid.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{bid.name}</div>
                      <div style={{ fontSize: '12px', color: T.primary, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MdStar size={12} /> {bid.badge}
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: T.primary }}>{bid.amount}</div>
                  </div>
                ))}
                <button style={{ width: '100%', marginTop: '12px', padding: '10px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Compare All Bids <MdArrowForward size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 5%', background: T.bgSoft }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '800', marginBottom: '12px' }}>Simple Pricing</h2>
          <p style={{ fontSize: '17px', color: T.textMid, marginBottom: '56px' }}>Free for travelers. Flexible for agencies.</p>

          {/* Cards — equal height via CSS grid + flex column */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'stretch' }}>
            {plans.map(plan => (
              <div key={plan.name} className="plan-card"
                style={{
                  background: plan.highlight ? `linear-gradient(160deg, ${T.primary} 0%, ${T.primaryLight} 100%)` : 'white',
                  padding: '32px 28px',
                  borderRadius: '20px',
                  border: plan.highlight ? 'none' : `1px solid ${T.border}`,
                  boxShadow: plan.highlight ? `0 20px 48px rgba(232,93,38,0.32)` : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: plan.highlight ? 'scale(1.04)' : 'none',
                  color: plan.highlight ? 'white' : T.text,
                  position: 'relative',
                  zIndex: plan.highlight ? 2 : 1,
                }}>

                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: T.accent, color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', padding: '4px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}

                {/* Plan name */}
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: plan.highlight ? 'white' : T.text }}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '900', color: plan.highlight ? 'white' : T.primary, lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: '14px', color: plan.highlight ? 'rgba(255,255,255,0.75)' : T.textLight, marginLeft: '4px', fontWeight: '500' }}>
                    {plan.period}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: plan.highlight ? 'rgba(255,255,255,0.2)' : T.border, marginBottom: '20px' }} />

                {/* Features — flex:1 so button always stays at bottom */}
                <ul style={{ listStyle: 'none', marginBottom: '28px', flex: 1, textAlign: 'left' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', fontSize: '14px', color: plan.highlight ? 'rgba(255,255,255,0.92)' : T.textMid, lineHeight: 1.5 }}>
                      <MdCheck size={17} color={plan.highlight ? 'white' : T.primary} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button — always at bottom */}
                <button
                  onClick={() => navigate(plan.name === 'Traveler' ? '/signup' : '/agency-signup')}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: plan.highlight ? 'white' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`,
                    color: plan.highlight ? T.primary : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '15px',
                    transition: 'opacity 0.2s',
                    marginTop: 'auto',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '800', marginBottom: '12px' }}>What People Say</h2>
            <p style={{ fontSize: '17px', color: T.textMid }}>Loved by travelers and agencies across India</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {testimonials.map(t => (
              <div key={t.name} className="testimonial-card" style={{ background: T.bgSoft, padding: '28px', borderRadius: '20px', border: `1px solid ${T.border}`, transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
                  {Array.from({ length: t.stars }).map((_, i) => <MdStar key={i} size={18} color={T.accent} />)}
                </div>
                <p style={{ color: T.textMid, fontSize: '15px', lineHeight: 1.7, marginBottom: '24px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '14px' }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.name}</div>
                    <div style={{ color: T.textLight, fontSize: '13px' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '0 5%', marginBottom: '80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', background: `linear-gradient(135deg, ${T.dark}, ${T.darkMid})`, borderRadius: '28px', padding: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '40px', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '10%', width: '200px', height: '200px', background: `${T.primary}20`, borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '800', color: 'white', marginBottom: '12px' }}>Ready to Find Your Best Deal?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>Join 10,000+ travelers who saved time & money with us.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            <button className="btn-primary" onClick={() => navigate('/signup')}
              style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Start for Free <MdArrowForward size={18} />
            </button>
            <button onClick={() => navigate('/agency-signup')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1.5px solid rgba(255,255,255,0.2)', padding: '14px 24px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
              Join as Agency
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: T.dark, color: 'rgba(255,255,255,0.6)', padding: '60px 5% 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '48px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaPaperPlane size={14} color="white" />
                </div>
                <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: "'Playfair Display', serif" }}>CheckTravelPrice</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7 }}>India's premier travel bidding marketplace connecting travelers with verified agencies.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Product</h4>
              {['How it Works', 'Features', 'Pricing', 'Contact Us', 'Privacy Policy'].map(link => (
                <div key={link} style={{ marginBottom: '10px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', cursor: 'pointer' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>{link}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', textAlign: 'center', fontSize: '13px' }}>
            © 2025 CheckTravelPrice. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}