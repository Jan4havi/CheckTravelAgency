import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsAPI, bidsAPI, getErrorMessage } from '../services/api';
import {
  MdPeople, MdCalendarToday, MdCategory, MdArrowBack, MdArrowForward,
  MdStar, MdCheck, MdOutlineVerified, MdLock, MdClose, MdTipsAndUpdates,
  MdEdit, MdDescription, MdOpenInNew, MdVerifiedUser, MdInfo,
} from 'react-icons/md';
import { FaGavel } from 'react-icons/fa';

const T = {
  primary: '#e85d26', primaryLight: '#ff7d4d', primaryDark: '#c44a18',
  accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa',
  bg: '#faf9f7', border: '#ede9e3',
};
const css = document.createElement('style');
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
  @keyframes spin    { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
`;
document.head.appendChild(css);

const getDestImg = (d = '') => {
  const s = d.toLowerCase();
  if (s.includes('goa'))     return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80';
  if (s.includes('bali'))    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80';
  if (s.includes('paris'))   return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80';
  if (s.includes('japan')||s.includes('tokyo')||s.includes('kyoto')) return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80';
  if (s.includes('dubai'))   return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80';
  if (s.includes('kerala'))  return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80';
  if (s.includes('maldives'))return 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80';
  if (s.includes('kashmir')||s.includes('manali')) return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80';
  if (s.includes('rajasthan')||s.includes('jaipur')) return 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=80';
  if (s.includes('thailand')||s.includes('phuket')) return 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80';
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : 'N/A';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab]             = useState('details');
  const [tripData, setTripData]               = useState(null);
  const [bids, setBids]                       = useState([]);
  const [bidStats, setBidStats]               = useState(null);
  const [myBid, setMyBid]                     = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [showStatusMenu, setShowStatusMenu]   = useState(false);
  const [showBidModal, setShowBidModal]       = useState(false);
  const [editingBid, setEditingBid]           = useState(false);
  const [bidSubmitting, setBidSubmitting]     = useState(false);
  const [agencyProfileComplete, setAgencyProfileComplete] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [viewingAgency, setViewingAgency]     = useState(null);
  const [chatRequests, setChatRequests]       = useState([]);
  const [bidData, setBidData]                 = useState({ bidAmount: '', proposal: '', inclusions: '', exclusions: '', cancellation: '' });

  const isAgency = user?.user_type === 'agency';

  // ── Profile completeness check from auth context ──────────────────────────
  useEffect(() => {
    if (isAgency && user) {
      const complete = !!(user.phone && user.address && user.website && user.gst_number && user.pan_number);
      setAgencyProfileComplete(complete);
    }
  }, [isAgency, user]);

  // ── Load trip + bids ──────────────────────────────────────────────────────
  useEffect(() => { loadTripData(); }, [id]); // eslint-disable-line

  const loadTripData = async () => {
    setLoading(true);
    try {
      // GET /api/v1/trips/{id}
      const { data: trip } = await tripsAPI.get(id);
      setTripData(trip);

      // GET /api/v1/bids/stats/{trip_id} — public, no auth
      try {
        const { data: stats } = await bidsAPI.stats(id);
        setBidStats(stats);
      } catch { /* optional */ }

      if (isAgency) {
        // Agency sees only their own bid
        try {
          const { data } = await bidsAPI.myBidForTrip(id);
          setMyBid(data);
        } catch { setMyBid(null); }
      } else {
        // Traveler sees all bids on their trip — GET /api/v1/bids/trip/{id}
        try {
          const { data } = await bidsAPI.forTrip(id);
          const list = data.results || data || [];
          setBids(list);
          list.forEach(b => bidsAPI.markViewed(b.id).catch(() => {}));
        } catch { setBids([]); }
      }

      setChatRequests(JSON.parse(localStorage.getItem(`chat_requests_${id}`) || '[]'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getDuration = () => {
    if (!tripData?.start_date || !tripData?.end_date) return 'N/A';
    return `${Math.ceil((new Date(tripData.end_date) - new Date(tripData.start_date)) / 86400000)} Days`;
  };

  // ── Status update / delete ────────────────────────────────────────────────
  const updateStatus = async (newStatus) => {
    try {
      newStatus === 'Closed'
        ? await tripsAPI.close(id)
        : await tripsAPI.update(id, { status: newStatus });
      setTripData(prev => ({ ...prev, status: newStatus }));
      setShowStatusMenu(false);
    } catch { alert('Failed to update status'); }
  };

  const deleteTrip = async () => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await tripsAPI.delete(id);
      navigate('/my-requests');
    } catch { alert('Failed to delete trip'); }
  };

  // ── Chat requests (stored in localStorage per trip) ───────────────────────
  const MAX_CHAT = 3;

  const handleChatRequest = (agencyId) => {
    const existing = JSON.parse(localStorage.getItem(`chat_requests_${id}`) || '[]');
    if (existing.length >= MAX_CHAT) {
      alert(`You can only send chat requests to a maximum of ${MAX_CHAT} agencies per trip.\n\nThis ensures fairness for agencies who pay to unlock your lead.`);
      return;
    }
    if (existing.some(r => r.agencyId === agencyId)) {
      alert('You have already sent a chat request to this agency.');
      return;
    }
    const updated = [...existing, { tripId: id, agencyId, travelerId: user?.id, travelerName: user?.display_name, requestedAt: new Date().toISOString(), status: 'pending' }];
    localStorage.setItem(`chat_requests_${id}`, JSON.stringify(updated));
    setChatRequests(updated);
    const remaining = MAX_CHAT - updated.length;
    alert(`Chat request sent!\n\nYou have ${remaining} chat request${remaining !== 1 ? 's' : ''} remaining for this trip.`);
  };

  const isChatRequested  = id2 => chatRequests.some(r => r.agencyId === id2);
  const chatRequestsLeft = MAX_CHAT - chatRequests.length;
  const maxChatReached   = chatRequests.length >= MAX_CHAT;

  // ── Submit / edit bid ─────────────────────────────────────────────────────
  const handleSubmitBid = async () => {
    if (!bidData.bidAmount || !bidData.proposal) { alert('Please fill required fields'); return; }
    setBidSubmitting(true);
    try {
      const fullMessage = bidData.proposal
        + (bidData.inclusions   ? `\n\nInclusions: ${bidData.inclusions}`               : '')
        + (bidData.exclusions   ? `\n\nExclusions: ${bidData.exclusions}`               : '')
        + (bidData.cancellation ? `\n\nPayment & Cancellation: ${bidData.cancellation}` : '');

      if (myBid) {
        const { data } = await bidsAPI.update(myBid.id, { bid_amount: `₹${bidData.bidAmount}`, message: fullMessage });
        setMyBid(data);
        alert('Proposal updated successfully!');
      } else {
        const { data } = await bidsAPI.create({ trip_id: tripData.id, bid_amount: `₹${bidData.bidAmount}`, message: fullMessage });
        setMyBid(data);
        alert('Bid submitted successfully!');
      }
      setShowBidModal(false);
      setBidData({ bidAmount: '', proposal: '', inclusions: '', exclusions: '', cancellation: '' });
      setActiveTab('proposals');
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e) || 'Failed to save bid.');
    } finally { setBidSubmitting(false); }
  };

  // ── Demo proposals shown when no real bids exist yet ─────────────────────
  const demoProposals = [
    { id: 'd1', agency_name: 'Paradise Travel Co.',  rating: 4.9, reviews: 3729, skills: ['Beach Vacations','Family Tours'],  message: 'We have extensive experience organizing vacations and can create the perfect itinerary. Personalized service with 24/7 support.',         bid_amount: '₹38,500', replyTime: 'Within a few hours' },
    { id: 'd2', agency_name: 'Wanderlust Travels',   rating: 4.8, reviews: 2156, skills: ['Group Travel','Water Sports'],     message: 'Specializing in customized packages with premium resort partnerships. Includes complimentary transfers and exclusive discounts.',       bid_amount: '₹42,000', replyTime: 'Within 24 hours'    },
    { id: 'd3', agency_name: 'Coastal Adventures',   rating: 4.7, reviews: 1893, skills: ['Beach Holidays','Adventure'],      message: 'Your perfect escape awaits! Personalized itineraries with the best resorts and authentic local experiences.',                        bid_amount: '₹36,000', replyTime: 'Within 12 hours'    },
  ];

  const inp = { width: '100%', padding: '13px 16px', border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', outline: 'none', background: T.bg, boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px', background: T.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <p style={{ color: T.textMid }}>Loading trip details...</p>
    </div>
  );

  if (!tripData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <h2>Trip not found</h2>
      <button onClick={() => navigate('/dashboard')} style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Back to Dashboard</button>
    </div>
  );

  const totalProposals = bidStats?.total_bids ?? (isAgency ? (myBid ? 1 : 0) : bids.length);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', animation: 'fadeUp 0.5s ease' }}>

      {/* ── Hero banner ── */}
      <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
        <img src={getDestImg(tripData.destination)} alt={tripData.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(26,26,46,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, padding: '20px 5%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', left: 0, right: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => navigate('/dashboard')}
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdArrowBack size={16} /> Back
            </button>
            {isAgency ? (
              <span style={{ background: '#dcfce7', color: '#166634', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>Live</span>
            ) : (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowStatusMenu(!showStatusMenu)}
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {tripData.status} ▾
                </button>
                {showStatusMenu && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'white', borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden', minWidth: '140px' }}>
                    {['Live','Closed'].map(s => (
                      <button key={s} onClick={() => updateStatus(s)}
                        style={{ width: '100%', padding: '11px 16px', background: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: T.text, borderBottom: s !== 'Closed' ? `1px solid ${T.border}` : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>{s}</button>
                    ))}
                    <button onClick={deleteTrip}
                      style={{ width: '100%', padding: '11px 16px', background: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>Delete Trip</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '10px' }}>
              {tripData.trip_type} Trip to {tripData.destination}
            </h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { icon: <MdPeople size={13}/>,        text: `${tripData.travelers} ${tripData.travelers === 1 ? 'Person' : 'People'}` },
                { icon: <MdCalendarToday size={13}/>,  text: `${fmtDate(tripData.start_date)} → ${fmtDate(tripData.end_date)}` },
                { icon: <MdCategory size={13}/>,      text: tripData.trip_scope || 'N/A' },
                { icon: <FaGavel size={12}/>,          text: `${totalProposals} Proposals` },
              ].map(({ icon, text }) => (
                <span key={text} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.95)', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {icon} {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5% 48px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '6px', borderRadius: '12px', border: `1px solid ${T.border}`, margin: '24px 0', width: 'fit-content', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {['details','proposals','files'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: activeTab === tab ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : 'transparent', color: activeTab === tab ? 'white' : T.textMid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', boxShadow: activeTab === tab ? `0 4px 12px rgba(232,93,38,0.3)` : 'none' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── DETAILS ── */}
        {activeTab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '20px', border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: T.text, marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${T.border}` }}>Trip Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {[
                  ...(tripData.source ? [['Departure', tripData.source]] : []),
                  ['Destination', tripData.destination],
                  ['Trip Type',   tripData.trip_type  || 'N/A'],
                  ['Trip Scope',  tripData.trip_scope || 'N/A'],
                  ['Travelers',   `${tripData.travelers} ${tripData.travelers === 1 ? 'Person' : 'People'}`],
                  ['Duration',    getDuration()],
                  ['Start Date',  fmtDate(tripData.start_date)],
                  ['End Date',    fmtDate(tripData.end_date)],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: T.bg, padding: '14px 16px', borderRadius: '12px', border: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: '11px', color: T.textLight, marginBottom: '5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: T.text, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
              {tripData.preferences && (
                <div style={{ background: `${T.primary}08`, padding: '20px', borderRadius: '14px', borderLeft: `4px solid ${T.primary}` }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: T.primary, marginBottom: '10px' }}>Special Preferences</h4>
                  <p style={{ fontSize: '14px', color: T.textMid, lineHeight: 1.7, margin: 0 }}>{tripData.preferences}</p>
                </div>
              )}

              {/* Agency: bid button or status */}
              {isAgency && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${T.border}` }}>
                  {myBid ? (
                    <div>
                      <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <MdCheck size={20} color="#0891b2" />
                        <span style={{ color: '#0891b2', fontWeight: '600', fontSize: '15px' }}>Bid submitted: {myBid.bid_amount}</span>
                      </div>
                      <button onClick={() => { setBidData({ bidAmount: myBid.bid_amount?.replace(/[^0-9]/g,'') || '', proposal: myBid.message || '', inclusions: '', exclusions: '', cancellation: '' }); setEditingBid(true); setShowBidModal(true); }}
                        style={{ width: '100%', padding: '12px', background: 'white', color: T.primary, border: `2px solid ${T.primary}`, borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <MdEdit size={16} /> Edit Your Bid
                      </button>
                    </div>
                  ) : agencyProfileComplete === false ? (
                    <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <MdInfo size={20} color="#d97706" />
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', margin: 0 }}>Complete your profile to bid</p>
                      </div>
                      <p style={{ fontSize: '13px', color: '#b45309', marginBottom: '12px', lineHeight: 1.6 }}>Phone, address, GST, PAN, website and bank account details are all required before you can bid.</p>
                      <button onClick={() => navigate('/profile')}
                        style={{ width: '100%', padding: '11px', background: '#d97706', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <MdEdit size={15} /> Complete Profile Now
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingBid(false); setShowBidModal(true); }}
                      style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 6px 20px rgba(232,93,38,0.35)` }}>
                      <FaGavel size={16} /> Submit Your Bid
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${T.border}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: T.text }}>Posted On</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.textMid, fontSize: '13px' }}>Date</span>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: T.text }}>{new Date(tripData.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ color: T.textMid, fontSize: '13px' }}>Time</span>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: T.text }}>{new Date(tripData.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, padding: '24px', borderRadius: '20px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: '900', marginBottom: '4px' }}>{totalProposals}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Agency Proposals</div>
                {bidStats?.avg_amount && (
                  <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '6px' }}>Avg: ₹{Math.round(bidStats.avg_amount).toLocaleString('en-IN')}</div>
                )}
                <button onClick={() => setActiveTab('proposals')}
                  style={{ marginTop: '16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '16px auto 0' }}>
                  {isAgency ? 'View Your Proposal' : 'View All'} <MdArrowForward size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PROPOSALS ── */}
        {activeTab === 'proposals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '800', color: T.text }}>
                {isAgency ? 'Competition Overview' : 'Agency Proposals'}
              </h2>
              {isAgency && bidStats && bidStats.total_bids > 0 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'AVG BID',    val: `₹${Math.round(bidStats.avg_amount).toLocaleString('en-IN')}`, bg: T.bg,       color: T.primary,   border: T.border },
                    { label: 'RANGE',      val: `₹${bidStats.min_amount?.toLocaleString('en-IN')} – ₹${bidStats.max_amount?.toLocaleString('en-IN')}`, bg: T.bg, color: T.textMid, border: T.border },
                    { label: 'TOTAL BIDS', val: bidStats.total_bids,                                            bg: '#fef3c7',  color: '#92400e',   border: '#fde68a' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, padding: '10px 18px', borderRadius: '12px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: T.textLight, fontWeight: '700', marginBottom: '2px' }}>{s.label}</p>
                      <p style={{ fontSize: '18px', fontWeight: '800', color: s.color, margin: 0 }}>{s.val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAgency && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MdLock size={20} color="#d97706" />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', margin: 0 }}>Bid amounts and proposals are confidential</p>
                  <p style={{ fontSize: '12px', color: '#b45309', margin: '2px 0 0' }}>Only the traveler can see individual bids. Use the average price above to stay competitive.</p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '20px' }}>
              {isAgency ? (
                myBid ? (
                  <div style={{ background: 'white', padding: '28px', borderRadius: '20px', border: `2px solid ${T.primary}`, boxShadow: '0 4px 16px rgba(232,93,38,0.1)' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'start' }}>
                      <div style={{ width: '52px', height: '52px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', color: 'white', flexShrink: 0 }}>
                        {user?.display_name?.charAt(0) || 'A'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '700', color: T.text }}>{user?.display_name}</h4>
                          <span style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Your Bid</span>
                        </div>
                        <p style={{ fontSize: '13px', color: T.textLight }}>Submitted {myBid.created_at ? new Date(myBid.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '11px', color: T.textLight, marginBottom: '2px', fontWeight: '600' }}>Your Bid Amount</p>
                        <p style={{ fontSize: '26px', fontWeight: '900', color: T.primary, margin: 0 }}>{myBid.bid_amount}</p>
                      </div>
                    </div>
                    <div style={{ background: T.bg, padding: '16px 20px', borderRadius: '12px', borderLeft: `3px solid ${T.primary}`, fontSize: '14px', color: T.textMid, lineHeight: 1.7, marginBottom: '16px' }}>
                      {myBid.message}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setBidData({ bidAmount: myBid.bid_amount?.replace(/[^0-9]/g,'') || '', proposal: myBid.message || '', inclusions: '', exclusions: '', cancellation: '' }); setEditingBid(true); setShowBidModal(true); }}
                        style={{ padding: '10px 22px', background: 'white', color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = T.primary; }}>
                        <MdEdit size={16} /> Edit Proposal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'white', padding: '60px 40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                    <FaGavel size={56} color={T.border} style={{ display: 'block', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>You haven't bid yet</h3>
                    <p style={{ color: T.textMid, marginBottom: '24px' }}>Be the first to submit a quotation for this trip!</p>
                    <button onClick={() => setActiveTab('details')} style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                      <FaGavel size={15} /> Submit Your Bid
                    </button>
                  </div>
                )
              ) : (
                /* Traveler: all real bids, or demo cards */
                (bids.length > 0 ? bids : demoProposals).map(bid => (
                  <div key={bid.id} style={{ background: 'white', padding: '28px', borderRadius: '20px', border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'start' }}>
                      <div onClick={() => setViewingAgency(bid)}
                        style={{ width: '52px', height: '52px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', color: 'white', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        {(bid.agency_name || bid.name)?.charAt(0) || 'A'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 onClick={() => setViewingAgency(bid)} style={{ fontSize: '16px', fontWeight: '700', color: T.primary, marginBottom: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {bid.agency_name || bid.name} <MdOpenInNew size={14} />
                        </h4>
                        {bid.rating && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
                            <MdStar size={13} color={T.accent} /> {bid.rating} ({bid.reviews?.toLocaleString()})
                          </div>
                        )}
                        {bid.skills && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {bid.skills.map(s => <span key={s} style={{ background: T.bg, color: T.textMid, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', border: `1px solid ${T.border}` }}>{s}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '11px', color: T.textLight, marginBottom: '2px', fontWeight: '600' }}>Bid Amount</p>
                        <p style={{ fontSize: '26px', fontWeight: '900', color: T.primary, margin: 0 }}>{bid.bid_amount}</p>
                        {bid.replyTime && <p style={{ fontSize: '11px', color: T.textLight, marginTop: '2px' }}>{bid.replyTime}</p>}
                      </div>
                    </div>
                    <div style={{ background: T.bg, padding: '16px 20px', borderRadius: '12px', marginBottom: '12px', borderLeft: `3px solid ${T.primary}30`, fontSize: '14px', color: T.textMid, lineHeight: 1.7 }}>
                      {(bid.message || bid.proposal || '').slice(0, 120)}{(bid.message || bid.proposal || '').length > 120 ? '...' : ''}
                    </div>
                    <button onClick={() => setViewingQuotation(bid)}
                      style={{ marginBottom: '14px', padding: '9px 20px', background: 'white', color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MdDescription size={15} /> View Full Quotation
                    </button>
                    {bid.agency_id !== user?.id && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {[...Array(MAX_CHAT)].map((_, i) => (
                            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i < chatRequests.length ? T.primary : '#e2e8f0' }} />
                          ))}
                          <span style={{ fontSize: '12px', color: T.textLight, fontWeight: '600' }}>{chatRequestsLeft > 0 ? `${chatRequestsLeft} requests left` : 'Limit reached'}</span>
                        </div>
                        {isChatRequested(bid.id || bid.agency_id) ? (
                          <div style={{ padding: '10px 20px', background: '#dcfce7', color: '#166634', borderRadius: '10px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MdOutlineVerified size={16} /> Chat Request Sent
                          </div>
                        ) : maxChatReached ? (
                          <div style={{ padding: '10px 20px', background: '#fef3c7', color: '#92400e', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>Max 3 agencies reached</div>
                        ) : (
                          <button onClick={() => handleChatRequest(bid.id || bid.agency_id)}
                            style={{ padding: '10px 22px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 12px rgba(232,93,38,0.3)` }}>
                            Send Chat Request <MdArrowForward size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── FILES ── */}
        {activeTab === 'files' && (
          <div style={{ background: 'white', padding: '60px 40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: T.text }}>Files</h2>
            <p style={{ color: T.textMid }}>File attachments feature coming soon</p>
          </div>
        )}
      </div>

      {/* ── Agency Profile Modal ── */}
      {viewingAgency && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setViewingAgency(null)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '520px', width: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>
                    {(viewingAgency.agency_name || viewingAgency.name)?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>{viewingAgency.agency_name || viewingAgency.name}</h3>
                    <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Verified Agency</span>
                  </div>
                </div>
                <button onClick={() => setViewingAgency(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <MdClose size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: T.text }}>{viewingAgency.agency_name || viewingAgency.name}</p>
                <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
                  <MdVerifiedUser size={20} color="#166534" />
                  <p style={{ fontSize: '11px', fontWeight: '800', color: '#166534', margin: '2px 0 0', textTransform: 'uppercase' }}>GST Verified</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isChatRequested(viewingAgency.id || viewingAgency.agency_id) && !maxChatReached ? (
                  <button onClick={() => { handleChatRequest(viewingAgency.id || viewingAgency.agency_id); setViewingAgency(null); }}
                    style={{ flex: 1, padding: '12px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Send Chat Request <MdArrowForward size={15} />
                  </button>
                ) : isChatRequested(viewingAgency.id || viewingAgency.agency_id) ? (
                  <div style={{ flex: 1, padding: '12px', background: '#dcfce7', color: '#166634', borderRadius: '10px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <MdOutlineVerified size={16} /> Chat Request Sent
                  </div>
                ) : null}
                <button onClick={() => { setViewingQuotation(viewingAgency); setViewingAgency(null); }}
                  style={{ flex: 1, padding: '12px', background: 'white', color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <MdDescription size={15} /> View Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quotation Modal ── */}
      {viewingQuotation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setViewingQuotation(null)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, padding: '24px 28px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quotation from</p>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: 'white', margin: 0 }}>{viewingQuotation.agency_name || viewingQuotation.name}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Total Bid Amount</p>
                <p style={{ fontSize: '28px', fontWeight: '900', color: 'white', margin: 0 }}>{viewingQuotation.bid_amount}</p>
              </div>
            </div>
            <div style={{ background: T.bg, padding: '14px 28px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {[['Destination', tripData?.destination], ['Travelers', `${tripData?.travelers} people`], ['Dates', `${fmtDate(tripData?.start_date)} → ${fmtDate(tripData?.end_date)}`]].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontSize: '10px', color: T.textLight, fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '24px 28px' }}>
              {(() => {
                const msg = viewingQuotation.message || viewingQuotation.proposal || '';
                const lines = msg.split('\n').filter(l => l.trim());
                const inclIdx  = lines.findIndex(l => l.toLowerCase().includes('inclusion'));
                const exclIdx  = lines.findIndex(l => l.toLowerCase().includes('exclusion'));
                const termsIdx = lines.findIndex(l => l.toLowerCase().includes('payment') || l.toLowerCase().includes('cancel'));
                const proposalLines = lines.filter((_, i) => i !== inclIdx && i !== exclIdx && i !== termsIdx);
                return (
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', color: T.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MdDescription size={14} /> Package Details
                      </h4>
                      <div style={{ background: T.bg, borderRadius: '12px', padding: '16px 20px', borderLeft: `3px solid ${T.primary}` }}>
                        {proposalLines.map((line, i) => <p key={i} style={{ fontSize: '14px', color: T.textMid, lineHeight: 1.8, margin: '0 0 4px' }}>{line}</p>)}
                      </div>
                    </div>
                    {inclIdx !== -1 && (
                      <div style={{ marginBottom: '14px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', marginBottom: '10px' }}>✅ Inclusions</h4>
                        <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bbf7d0' }}>
                          <p style={{ fontSize: '14px', color: '#166534', lineHeight: 1.8, margin: 0 }}>{lines[inclIdx].replace(/✅|inclusions?:/gi, '').trim()}</p>
                        </div>
                      </div>
                    )}
                    {exclIdx !== -1 && (
                      <div style={{ marginBottom: '14px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', marginBottom: '10px' }}>❌ Exclusions</h4>
                        <div style={{ background: '#fff5f5', borderRadius: '10px', padding: '14px 16px', border: '1px solid #fecaca' }}>
                          <p style={{ fontSize: '14px', color: '#991b1b', lineHeight: 1.8, margin: 0 }}>{lines[exclIdx].replace(/❌|exclusions?:/gi, '').trim()}</p>
                        </div>
                      </div>
                    )}
                    {termsIdx !== -1 && (
                      <div style={{ marginBottom: '14px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', marginBottom: '10px' }}>💳 Payment & Cancellation</h4>
                        <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '14px 16px', border: '1px solid #fde68a' }}>
                          <p style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.8, margin: 0 }}>{lines[termsIdx].replace(/💳|payment:|cancel[^:]*:/gi, '').trim()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${T.border}` }}>
                {!isChatRequested(viewingQuotation.id || viewingQuotation.agency_id) && !maxChatReached && (
                  <button onClick={() => { handleChatRequest(viewingQuotation.id || viewingQuotation.agency_id); setViewingQuotation(null); }}
                    style={{ flex: 1, padding: '13px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Send Chat Request <MdArrowForward size={16} />
                  </button>
                )}
                {isChatRequested(viewingQuotation.id || viewingQuotation.agency_id) && (
                  <div style={{ flex: 1, padding: '13px', background: '#dcfce7', color: '#166634', borderRadius: '10px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <MdOutlineVerified size={16} /> Chat Request Sent
                  </div>
                )}
                <button onClick={() => setViewingQuotation(null)}
                  style={{ padding: '13px 24px', background: T.bg, color: T.textMid, border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bid Submission Modal ── */}
      {showBidModal && isAgency && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '680px', width: '100%', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '28px 32px 20px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: T.text, marginBottom: '4px' }}>{myBid ? 'Edit Your Quotation' : 'Submit Your Quotation'}</h2>
                  <p style={{ color: T.textMid, fontSize: '13px' }}>{tripData?.title} · {tripData?.travelers} people · {fmtDate(tripData?.start_date)}</p>
                </div>
                <button onClick={() => { setShowBidModal(false); setBidData({ bidAmount: '', proposal: '', inclusions: '', exclusions: '', cancellation: '' }); }}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MdClose size={18} color={T.textMid} />
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
              {/* Tips */}
              <div style={{ background: `${T.primary}06`, border: `1px solid ${T.primary}25`, borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <MdTipsAndUpdates size={18} color={T.primary} />
                  <p style={{ fontSize: '13px', fontWeight: '700', color: T.primary, margin: 0 }}>What makes a winning quotation?</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {['Clear total price per person','Hotel name & star rating','Meals included (B/L/D)','Transport details (flight/cab)','No. of nights & itinerary','Activities & sightseeing list','What is NOT included','Payment & cancellation terms'].map(tip => (
                    <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textMid }}>
                      <MdCheck size={13} color={T.primary} /> {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bid Amount */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Total Package Price (₹) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', fontWeight: '700', color: T.textMid }}>₹</span>
                  <input type="number" value={bidData.bidAmount} onChange={e => setBidData({ ...bidData, bidAmount: e.target.value })} placeholder="e.g. 85000"
                    style={{ ...inp, paddingLeft: '34px' }}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                </div>
                <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px' }}>Only visible to the traveler — other agencies cannot see your bid amount.</p>
              </div>

              {/* Proposal */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Your Proposal / Quotation Details *</label>
                <textarea value={bidData.proposal} onChange={e => setBidData({ ...bidData, proposal: e.target.value })}
                  placeholder={"Describe your complete package:\n\nHotel: [name & stars]\nMeals: Breakfast + Dinner\nTransport: AC cab, airport pickup/drop\nActivities: [list]\nItinerary: Day 1 - Arrival..."}
                  rows="7" style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>

              {/* Inclusions / Exclusions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>✅ Inclusions</label>
                  <textarea value={bidData.inclusions} onChange={e => setBidData({ ...bidData, inclusions: e.target.value })}
                    placeholder={"Hotel\nBreakfast\nAirport transfers\nSightseeing cab"}
                    rows="4" style={{ ...inp, resize: 'vertical', borderColor: '#bbf7d0' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#bbf7d0'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>❌ Exclusions</label>
                  <textarea value={bidData.exclusions} onChange={e => setBidData({ ...bidData, exclusions: e.target.value })}
                    placeholder={"Flights\nPersonal expenses\nLunch & dinner\nEntry tickets"}
                    rows="4" style={{ ...inp, resize: 'vertical', borderColor: '#fecaca' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = '#fecaca'} />
                </div>
              </div>

              {/* Cancellation */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Cancellation & Payment Terms</label>
                <input type="text" value={bidData.cancellation} onChange={e => setBidData({ ...bidData, cancellation: e.target.value })}
                  placeholder="e.g. 30% advance, free cancellation up to 7 days before trip" style={inp}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 32px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowBidModal(false); setBidData({ bidAmount: '', proposal: '', inclusions: '', exclusions: '', cancellation: '' }); }}
                style={{ padding: '12px 22px', background: T.bg, color: T.textMid, border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmitBid} disabled={bidSubmitting}
                style={{ padding: '12px 28px', background: bidSubmitting ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: bidSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: bidSubmitting ? 'none' : `0 4px 12px rgba(232,93,38,0.3)` }}>
                <FaGavel size={15} /> {bidSubmitting ? (myBid ? 'Updating...' : 'Submitting...') : (myBid ? 'Update Quotation' : 'Submit Quotation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}