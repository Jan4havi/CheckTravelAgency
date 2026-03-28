import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdOutlineRequestPage, MdMessage, MdReceipt,
  MdStar, MdPerson, MdSupportAgent, MdInsights, MdLockOpen,
  MdLogout, MdKeyboardArrowDown
} from 'react-icons/md';

const T = {
  primary: '#e85d26', accent: '#f5a623',
  text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa',
  border: '#ede9e3', bgSoft: '#faf9f7',
};

export default function TopNav({ activePage }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isAgency = user?.user_type === 'agency';

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const travelerLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <MdDashboard size={17} /> },
    { label: 'My Requests', path: '/my-requests', icon: <MdOutlineRequestPage size={17} /> },
    { label: 'Messages', path: '/messages', icon: <MdMessage size={17} /> },
    { label: 'Invoice', path: '/invoice', icon: <MdReceipt size={17} />, badge: 'Soon' },
    { label: 'Membership', path: '/membership-plan', icon: <MdStar size={17} /> },
    { label: 'Profile', path: '/profile', icon: <MdPerson size={17} /> },
    { label: 'Support', path: '/support', icon: <MdSupportAgent size={17} /> },
  ];

  const agencyLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <MdDashboard size={17} /> },
    { label: 'Bid Insights', path: '/bid-insights', icon: <MdInsights size={17} /> },
    { label: 'My Leads', path: '/my-lead-details', icon: <MdLockOpen size={17} /> },
    { label: 'Messages', path: '/messages', icon: <MdMessage size={17} /> },
    { label: 'Invoice', path: '/invoice', icon: <MdReceipt size={17} />, badge: 'Soon' },
    { label: 'Membership', path: '/membership-plan', icon: <MdStar size={17} /> },
    { label: 'Profile', path: '/profile', icon: <MdPerson size={17} /> },
    { label: 'Support', path: '/support', icon: <MdSupportAgent size={17} /> },
  ];

  const links = isAgency ? agencyLinks : travelerLinks;
  const displayName = isAgency ? user?.agency_name : user?.full_name;
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'white', borderBottom: `1px solid ${T.border}`,
      height: '64px', display: 'flex', alignItems: 'center',
      paddingLeft: '32px', paddingRight: '32px',
      justifyContent: 'space-between',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 10px rgba(232,93,38,0.3)` }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: '700', color: T.text }}>
          CheckTravelPrice
        </span>
      </div>

      {/* Profile dropdown */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button onClick={() => setMenuOpen(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: menuOpen ? T.bgSoft : 'white', border: `1.5px solid ${menuOpen ? T.primary : T.border}`, borderRadius: '40px', padding: '5px 14px 5px 5px', cursor: 'pointer', transition: 'all 0.2s' }}>
          <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
            {initial}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: T.text, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName || 'User'}
          </span>
          <MdKeyboardArrowDown size={18} color={T.textLight} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>

        {menuOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'white', borderRadius: '18px', border: `1px solid ${T.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.13)', minWidth: '240px', overflow: 'hidden', zIndex: 300 }}>

            {/* User header */}
            <div style={{ padding: '18px 20px', background: T.bgSoft, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                  <div style={{ fontSize: '12px', color: T.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${T.primary}15`, color: T.primary, padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginTop: '6px' }}>
                    <MdStar size={11} /> {user?.membership_plan || 'Free'} Plan
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            {links.map(link => (
              <button key={link.path} onClick={() => { navigate(link.path); setMenuOpen(false); }}
                style={{ width: '100%', padding: '12px 20px', background: activePage === link.label ? `${T.primary}08` : 'white', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: activePage === link.label ? T.primary : T.textMid, fontWeight: activePage === link.label ? '700' : '500', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s', borderLeft: activePage === link.label ? `3px solid ${T.primary}` : '3px solid transparent' }}
                onMouseEnter={e => { if (activePage !== link.label) e.currentTarget.style.background = T.bgSoft; }}
                onMouseLeave={e => { if (activePage !== link.label) e.currentTarget.style.background = 'white'; }}>
                <span style={{ color: activePage === link.label ? T.primary : T.textLight, display: 'flex' }}>{link.icon}</span>
                <span style={{ flex: 1 }}>{link.label}</span>
                {link.badge && (
                  <span style={{ background: T.accent, color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px' }}>{link.badge}</span>
                )}
              </button>
            ))}

            {/* Logout */}
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                style={{ width: '100%', padding: '13px 20px', background: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <MdLogout size={17} color="#ef4444" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}