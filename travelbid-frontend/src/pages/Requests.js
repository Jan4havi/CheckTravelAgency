import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsAPI } from '../services/api';
import TopNav from './TopNav';
import {
  MdLocationOn, MdPeople, MdCalendarToday, MdLockOpen, MdMessage,
  MdArrowForward, MdFlightTakeoff, MdCategory, MdAccessTime,
  MdOutlineVerified, MdAdd,
} from 'react-icons/md';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} .req-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.1)!important;}`;
document.head.appendChild(css);

const getDestImg = (d = '') => {
  const s = d.toLowerCase();
  if (s.includes('goa'))    return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=70';
  if (s.includes('bali'))   return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=70';
  if (s.includes('paris'))  return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=70';
  if (s.includes('japan') || s.includes('tokyo') || s.includes('kyoto'))
    return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=70';
  if (s.includes('dubai'))   return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=70';
  if (s.includes('kerala'))  return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=70';
  if (s.includes('maldives')) return 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&q=70';
  if (s.includes('kashmir') || s.includes('manali'))
    return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=70';
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=70';
};

export default function Requests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState('live');
  const [liveTrips, setLiveTrips]     = useState([]);
  const [previousTrips, setPreviousTrips] = useState([]);
  const [unlockedLeads, setUnlockedLeads] = useState([]);
  const [loading, setLoading]         = useState(true);

  const isLeadDetailsPage = location.pathname === '/my-lead-details';
  const isAgency = user?.user_type === 'agency';

  useEffect(() => {
    if (isAgency) loadUnlockedLeads();
    else loadMyTrips();
  }, [isAgency]); // eslint-disable-line

  // ── Traveler: load trips via GET /api/v1/trips/my ──────────────────────────
  const loadMyTrips = async () => {
    setLoading(true);
    try {
      const { data } = await tripsAPI.myTrips(); // no status filter → get all
      const trips = Array.isArray(data) ? data : [];
      setLiveTrips(trips.filter(t => t.status === 'Live'));
      setPreviousTrips(trips.filter(t => t.status !== 'Live'));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // ── Agency: load unlocked leads from localStorage ─────────────────────────
  const loadUnlockedLeads = () => {
    setLoading(true);
    try {
      setUnlockedLeads(JSON.parse(localStorage.getItem('unlocked_leads') || '[]'));
    } catch { setUnlockedLeads([]); } finally { setLoading(false); }
  };

  const getPostedAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : 'N/A';

  const activePage = isAgency ? 'My Leads' : 'My Requests';

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage={activePage} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 32px', animation: 'fadeUp 0.5s ease' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAgency
              ? <><MdLockOpen size={30} color={T.primary} /> My Lead Details</>
              : <><MdFlightTakeoff size={30} color={T.primary} /> My Trip Requests</>}
          </h1>
          <p style={{ color: T.textMid, fontSize: '16px' }}>
            {isAgency ? 'View complete details of your unlocked traveler leads' : 'Track your posted trip requests and agency bids'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '6px', borderRadius: '12px', border: `1px solid ${T.border}`, marginBottom: '28px', width: 'fit-content' }}>
          {[
            { key: 'live',     label: isAgency ? `Unlocked (${unlockedLeads.length})` : `Live (${liveTrips.length})` },
            { key: 'previous', label: isAgency ? 'Archived (0)' : `Previous (${previousTrips.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: activeTab === tab.key ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : 'transparent', color: activeTab === tab.key ? 'white' : T.textMid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === tab.key ? `0 4px 12px rgba(232,93,38,0.3)` : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '60px', color: T.textMid }}>Loading...</div>}

        {/* ── LIVE TAB ── */}
        {!loading && activeTab === 'live' && (
          <>
            {/* AGENCY — unlocked leads */}
            {isAgency && (
              unlockedLeads.length > 0 ? (
                <div style={{ display: 'grid', gap: '24px' }}>
                  {unlockedLeads.map(lead => (
                    <div key={lead.id} style={{ background: 'white', borderRadius: '20px', border: '2px solid #10b981', overflow: 'hidden', boxShadow: '0 4px 16px rgba(16,185,129,0.1)' }}>
                      {/* Hero strip */}
                      <div style={{ position: 'relative', height: '110px', overflow: 'hidden' }}>
                        <img src={getDestImg(lead.destination)} alt={lead.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.85) 0%, rgba(26,26,46,0.3) 100%)' }} />
                        <div style={{ position: 'absolute', inset: 0, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>{lead.tripTitle}</h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdLocationOn size={13} /> {lead.destination}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdPeople size={13} /> {lead.travelers} people</span>
                              <span>Bid: {lead.bidAmount}</span>
                            </div>
                          </div>
                          <span style={{ background: '#10b981', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MdOutlineVerified size={14} /> Unlocked
                          </span>
                        </div>
                      </div>

                      {/* Lead info */}
                      <div style={{ padding: '28px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: T.text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MdPeople size={18} color={T.primary} /> Traveler Information
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                          {[
                            { icon: <MdPeople size={13} />,       label: 'Full Name',     value: lead.travelerName },
                            { icon: <MdMessage size={13} />,      label: 'Email',         value: lead.travelerEmail },
                            { icon: <MdMessage size={13} />,      label: 'Phone',         value: lead.travelerPhone },
                            { icon: <MdCalendarToday size={13} />, label: 'Travel Dates', value: lead.travelDates },
                          ].map(({ icon, label, value }) => (
                            <div key={label} style={{ background: T.bg, padding: '14px 16px', borderRadius: '12px', border: `1px solid ${T.border}` }}>
                              <p style={{ fontSize: '11px', color: T.textLight, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>{icon} {label}</p>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: T.text, margin: 0, wordBreak: 'break-word' }}>{value || 'Not provided'}</p>
                            </div>
                          ))}
                        </div>
                        {lead.preferences && (
                          <div style={{ background: `${T.primary}08`, padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', borderLeft: `4px solid ${T.primary}` }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '700', color: T.primary, marginBottom: '8px' }}>Trip Requirements</h4>
                            <p style={{ fontSize: '14px', color: T.textMid, lineHeight: 1.7, margin: 0 }}>{lead.preferences}</p>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '12px', color: T.textLight }}>Unlocked: {new Date(lead.unlockedAt).toLocaleString('en-IN')}</p>
                          <button onClick={() => navigate('/messages', { state: { leadId: lead.id, tripId: lead.tripId } })}
                            style={{ padding: '12px 28px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 16px rgba(232,93,38,0.3)` }}>
                            <MdMessage size={16} /> Message Traveler
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'white', padding: '80px 40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <MdLockOpen size={64} color={T.border} style={{ display: 'block', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No Unlocked Leads Yet</h3>
                  <p style={{ color: T.textMid, marginBottom: '24px' }}>Unlock leads from Bid Insights to view complete traveler details.</p>
                  <button onClick={() => navigate('/bid-insights')}
                    style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                    Go to Bid Insights <MdArrowForward size={16} />
                  </button>
                </div>
              )
            )}

            {/* TRAVELER — live trips */}
            {!isAgency && (
              liveTrips.length > 0 ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {liveTrips.map(trip => (
                    <div key={trip.id} className="req-card" onClick={() => navigate(`/trip/${trip.id}`)}
                      style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s', display: 'grid', gridTemplateColumns: '180px 1fr', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img src={getDestImg(trip.destination)} alt={trip.destination} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '140px' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)' }} />
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.95)', color: T.text, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MdLocationOn size={11} color={T.primary} /> {trip.destination}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                          <h3 style={{ fontSize: '17px', fontWeight: '700', color: T.text }}>{trip.title}</h3>
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', flexShrink: 0, marginLeft: '8px' }}>Live</span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: T.textMid, flexWrap: 'wrap', marginBottom: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdPeople size={13} color={T.textLight} /> {trip.travelers} people</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdCalendarToday size={13} color={T.textLight} /> {fmtDate(trip.start_date)}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdCategory size={13} color={T.textLight} /> {trip.trip_type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: '12px', color: T.textLight, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MdAccessTime size={13} /> {getPostedAgo(trip.created_at)}
                          </span>
                          <button onClick={e => { e.stopPropagation(); navigate(`/trip/${trip.id}`); }}
                            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View <MdArrowForward size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'white', padding: '80px 40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <MdFlightTakeoff size={64} color={T.border} style={{ display: 'block', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No Live Requests</h3>
                  <p style={{ color: T.textMid, marginBottom: '24px' }}>You don't have any active trip requests yet.</p>
                  <button onClick={() => navigate('/dashboard')}
                    style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                    <MdAdd size={18} /> Post New Trip
                  </button>
                </div>
              )
            )}
          </>
        )}

        {/* ── PREVIOUS TAB ── */}
        {!loading && activeTab === 'previous' && (
          !isAgency && previousTrips.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {previousTrips.map(trip => (
                <div key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)}
                  style={{ background: 'white', padding: '20px 24px', borderRadius: '14px', border: `1px solid ${T.border}`, cursor: 'pointer', opacity: 0.85, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{trip.title}</h3>
                    <div style={{ fontSize: '13px', color: T.textMid, display: 'flex', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdLocationOn size={13} color={T.textLight} /> {trip.destination}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdPeople size={13} color={T.textLight} /> {trip.travelers}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdCalendarToday size={13} color={T.textLight} /> {fmtDate(trip.start_date)}</span>
                    </div>
                  </div>
                  <span style={{ background: '#f3f4f6', color: '#374151', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>{trip.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'white', padding: '60px 40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
              <MdFlightTakeoff size={48} color={T.border} style={{ display: 'block', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{isAgency ? 'No Archived Leads' : 'No Previous Requests'}</h3>
              <p style={{ color: T.textMid }}>Your completed trips will appear here.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}