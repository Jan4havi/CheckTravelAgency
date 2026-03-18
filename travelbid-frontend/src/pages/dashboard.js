import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import TopNav from './TopNav';
import { MdLocationOn, MdPeople, MdCalendarToday, MdArrowForward, MdArrowRightAlt, MdFlightTakeoff, MdCategory, MdCurrencyRupee, MdTipsAndUpdates, MdCheck, MdEdit, MdDelete, MdInfo, MdLock } from 'react-icons/md';
import { FaPaperPlane } from 'react-icons/fa';
import { HiOutlineGlobeAlt } from 'react-icons/hi';

const T = {
  primary: '#e85d26', primaryLight: '#ff7d4d', primaryDark: '#c44a18',
  accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa',
  bg: '#faf9f7', bgCard: '#ffffff', border: '#ede9e3',
};

const spinCSS = document.createElement('style');
spinCSS.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  .trip-card:hover { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,0.12)!important; }
  .submit-btn:hover { background:${T.primaryDark}!important; transform:translateY(-2px); }
`;
document.head.appendChild(spinCSS);

const getDestinationImage = (destination = '') => {
  const d = destination.toLowerCase();
  if (d.includes('goa')) return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80';
  if (d.includes('bali')) return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80';
  if (d.includes('paris')||d.includes('france')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80';
  if (d.includes('japan')||d.includes('tokyo')||d.includes('kyoto')) return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80';
  if (d.includes('dubai')) return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80';
  if (d.includes('kerala')) return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80';
  if (d.includes('rajasthan')||d.includes('jaipur')) return 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80';
  if (d.includes('manali')||d.includes('himachal')||d.includes('kashmir')) return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80';
  if (d.includes('maldives')) return 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80';
  if (d.includes('thailand')||d.includes('phuket')) return 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80';
  if (d.includes('singapore')) return 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80';
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allTrips, setAllTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [myActiveTrip, setMyActiveTrip] = useState(null); // traveler's existing active trip
  const [editingTrip, setEditingTrip] = useState(false);  // are we editing?
  const [formData, setFormData] = useState({
    source: '', destination: '', travelers: '', startDate: '',
    endDate: '', tripScope: '', tripType: '', budget: '', preferences: '', sourceOnboarding: ''
  });
  const isAgency = user?.user_type === 'agency';
  const [profileComplete, setProfileComplete] = useState(null); // null=checking, true/false
  const [showProfileAlert, setShowProfileAlert] = useState(false);

  useEffect(() => { checkProfileComplete(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkProfileComplete = async () => {
    if (!user) return;
    try {
      if (isAgency) {
        const { data } = await supabase.from('agency_profiles').select('phone, address, website, gst_number, pan_number, bank_name, account_number, ifsc_code, account_holder').eq('id', user.id).maybeSingle();
        const complete = data && data.phone && data.address && data.website && data.gst_number && data.pan_number && data.bank_name && data.account_number && data.ifsc_code && data.account_holder;
        setProfileComplete(!!complete);
      } else {
        const { data } = await supabase.from('user_profiles').select('phone, email').eq('id', user.id).maybeSingle();
        const complete = data && data.phone && data.email;
        setProfileComplete(!!complete);
      }
    } catch { setProfileComplete(true); } // fail open
  };

  useEffect(() => {
    if (isAgency) loadAllTrips();
    else loadMyActiveTrip();
  }, [isAgency]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllTrips = async () => {
    setTripsLoading(true);
    try {
      const { data, error } = await supabase.from('trip_requests').select('*').eq('status', 'Live').order('created_at', { ascending: false });
      if (error) throw error;
      setAllTrips(data || []);
    } catch (e) { console.error(e); } finally { setTripsLoading(false); }
  };

  const loadMyActiveTrip = async () => {
    try {
      const { data } = await supabase.from('trip_requests')
        .select('*').eq('user_id', user.id).eq('status', 'Live').maybeSingle();
      if (data) {
        setMyActiveTrip(data);
        // Pre-fill form with existing trip data for editing
        setFormData({
          source: data.source || '',
          destination: data.destination || '',
          travelers: data.travelers?.toString() || '',
          startDate: data.start_date || '',
          endDate: data.end_date || '',
          tripScope: data.trip_scope || '',
          tripType: data.trip_type || '',
          budget: data.budget || '',
          preferences: data.preferences || '',
          sourceOnboarding: data.source_onboarding || '',
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Block if profile not complete
    if (!profileComplete) {
      setShowProfileAlert(true);
      setLoading(false);
      return;
    }
    if (myActiveTrip && !editingTrip) {
        // Should not reach here — button is blocked — but safety check
        alert('You already have an active trip. Edit or delete it before posting a new one.');
        setLoading(false);
        return;
      }
      if (myActiveTrip && editingTrip) {
        // UPDATE existing trip
        const { error } = await supabase.from('trip_requests').update({
          title: `${formData.tripType || 'Trip'} to ${formData.destination}`,
          source: formData.source, destination: formData.destination,
          trip_type: formData.tripType, trip_scope: formData.tripScope,
          budget: formData.budget,
          travelers: parseInt(formData.travelers) || 1,
          start_date: formData.startDate, end_date: formData.endDate,
          preferences: formData.preferences,
        }).eq('id', myActiveTrip.id);
        if (error) throw error;
        alert('Trip updated successfully!');
        setEditingTrip(false);
        await loadMyActiveTrip();
        navigate(`/trip/${myActiveTrip.id}`);
      } else {
        // INSERT new trip
        const { data, error } = await supabase.from('trip_requests').insert({
          user_id: user.id,
          title: `${formData.tripType || 'Trip'} to ${formData.destination}`,
          source: formData.source, destination: formData.destination,
          trip_type: formData.tripType, trip_scope: formData.tripScope,
          budget: formData.budget,
          travelers: parseInt(formData.travelers) || 1,
          start_date: formData.startDate, end_date: formData.endDate,
          preferences: formData.preferences, status: 'Live'
        }).select().single();
        if (error) throw error;
        setMyActiveTrip(data);
        navigate(`/trip/${data.id}`);
      }
    } catch (e) { console.error(e); alert('Failed to save trip.'); } finally { setLoading(false); }
  };

  const handleDeleteTrip = async () => {
    if (!myActiveTrip) return;
    if (!window.confirm('Delete your active trip? This will remove all bids received so far.')) return;
    try {
      const { error } = await supabase.from('trip_requests').delete().eq('id', myActiveTrip.id);
      if (error) throw error;
      setMyActiveTrip(null);
      setEditingTrip(false);
      setFormData({ source: '', destination: '', travelers: '', startDate: '', endDate: '', tripScope: '', tripType: '', budget: '', preferences: '', sourceOnboarding: '' });
    } catch (e) { console.error(e); alert('Failed to delete trip.'); }
  };

  const getDaysLeft = (createdAt) => {
    const diff = Math.ceil((new Date(createdAt).getTime() + 7 * 86400000 - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const getPostedAgo = (createdAt) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const inp = { width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#faf9f7', color: T.text, boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const lbl = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: T.textMid };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Dashboard" />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 32px', animation: 'fadeIn 0.5s ease' }}>

        {/* TRAVELER */}
        {!isAgency && (
          <>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MdFlightTakeoff size={30} color={T.primary} /> {myActiveTrip ? (editingTrip ? 'Edit Your Trip' : 'Your Active Trip') : 'Post Your Trip'}
                </h1>
                <p style={{ color: T.textMid, fontSize: '16px' }}>
                  {myActiveTrip && !editingTrip ? 'You have one active trip. Edit it or delete to post a new one.' : 'Share your travel plans and receive quotes from verified agencies'}
                </p>
              </div>
              {/* Active trip action buttons */}
              {myActiveTrip && !editingTrip && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate(`/trip/${myActiveTrip.id}`)}
                    style={{ padding: '10px 20px', background: `${T.primary}12`, color: T.primary, border: `1.5px solid ${T.primary}30`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdArrowForward size={16} /> View Trip
                  </button>
                  <button onClick={() => setEditingTrip(true)}
                    style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 12px rgba(232,93,38,0.3)` }}>
                    <MdEdit size={16} /> Edit Trip
                  </button>
                  <button onClick={handleDeleteTrip}
                    style={{ padding: '10px 20px', background: '#fff5f5', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdDelete size={16} /> Delete
                  </button>
                </div>
              )}
              {editingTrip && (
                <button onClick={() => { setEditingTrip(false); }}
                  style={{ padding: '10px 20px', background: T.bg, color: T.textMid, border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Block new post if active trip exists and not editing */}
            {myActiveTrip && !editingTrip ? (
              /* Show active trip summary card */
              <div style={{ background: 'white', borderRadius: '20px', border: `2px solid ${T.primary}30`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                  <img src={getDestinationImage(myActiveTrip.destination)} alt={myActiveTrip.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.85), rgba(26,26,46,0.4))' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ background: '#10b981', color: 'white', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', marginBottom: '8px' }}>● Active</div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{myActiveTrip.title}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{myActiveTrip.destination} · {myActiveTrip.travelers} people · {myActiveTrip.start_date}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '14px 20px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>Budget</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: T.accent }}>{myActiveTrip.budget || 'Not set'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    {[
                      { label: 'Trip Type', value: myActiveTrip.trip_type || 'N/A' },
                      { label: 'Scope', value: myActiveTrip.trip_scope || 'N/A' },
                      { label: 'Dates', value: `${myActiveTrip.start_date} → ${myActiveTrip.end_date}` },
                      { label: 'Travelers', value: `${myActiveTrip.travelers} People` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: T.bg, padding: '12px 16px', borderRadius: '10px', border: `1px solid ${T.border}` }}>
                        <p style={{ fontSize: '11px', color: T.textLight, fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: T.text, margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {myActiveTrip.preferences && (
                    <div style={{ background: `${T.primary}08`, padding: '14px 18px', borderRadius: '10px', borderLeft: `3px solid ${T.primary}`, marginBottom: '20px' }}>
                      <p style={{ fontSize: '13px', color: T.textMid, lineHeight: 1.7, margin: 0 }}>{myActiveTrip.preferences}</p>
                    </div>
                  )}
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdInfo size={18} color="#d97706" />
                    <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                      You can only have <strong>1 active trip</strong> at a time. Delete this trip to post a new one, or edit it to update the details.
                    </p>
                  </div>
                </div>
              </div>
            ) : (

            <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80" alt="Travel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.85), rgba(26,26,46,0.4))' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 40px' }}>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>{editingTrip ? 'Edit Your Trip Request' : 'Create Your Trip Request'}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Agencies bid on your trip — you choose the best offer</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px' }}>
                    {[['Free', 'For travelers'], ['15+ Bids', 'Average per trip'], ['24hrs', 'First response']].map(([v, l]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: T.accent }}>{v}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '36px 40px' }}>

                {/* Traveler guide: how to post a good trip */}
                <div style={{ background: `${T.primary}06`, border: `1px solid ${T.primary}20`, borderRadius: '14px', padding: '16px 20px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <MdTipsAndUpdates size={18} color={T.primary} />
                    <p style={{ fontSize: '13px', fontWeight: '700', color: T.primary, margin: 0 }}>How to get the best quotes from agencies?</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    {[
                      'Set a realistic budget range',
                      'Mention exact travel dates',
                      'Add number of adults & children',
                      'Specify hotel preference (budget/3★/5★)',
                      'Mention meals preference (veg/non-veg)',
                      'List any specific activities you want',
                      'Mention if flights are needed',
                      'Add any special requests (anniversary, etc.)',
                    ].map(tip => (
                      <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textMid }}>
                        <MdCheck size={13} color={T.primary} /> {tip}
                      </div>
                    ))}
                  </div>
                  {/* Example trip post — properly formatted */}
                  <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${T.primary}20`, overflow: 'hidden' }}>
                    <div style={{ background: `${T.primary}12`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MdTipsAndUpdates size={14} color={T.primary} />
                      <p style={{ fontSize: '11px', fontWeight: '800', color: T.primary, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example of a great trip post</p>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', gap: '8px' }}>
                      {[
                        { icon: '📍', label: 'Destination', value: 'Goa (North + South)' },
                        { icon: '👥', label: 'Travelers', value: '2 adults' },
                        { icon: '📅', label: 'Dates', value: '15 Dec – 20 Dec (5 nights)' },
                        { icon: '💰', label: 'Budget', value: '₹50,000 – ₹80,000 total for 2 people' },
                        { icon: '🏨', label: 'Hotel', value: '3★ preferred, near beach' },
                        { icon: '🍽️', label: 'Meals', value: 'Breakfast included, vegetarian only' },
                        { icon: '🚗', label: 'Transport', value: 'AC cab for all days, no flights needed' },
                        { icon: '🏄', label: 'Activities', value: 'Water sports, sunset cruise, sightseeing' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', gap: '10px', padding: '7px 10px', borderRadius: '8px', background: T.bg, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{row.icon}</span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: T.text, minWidth: '90px' }}>{row.label}:</span>
                            <span style={{ fontSize: '12px', color: T.textMid }}>{row.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: '12px', alignItems: 'end', marginBottom: '24px' }}>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><MdLocationOn size={14} color={T.primary} /> From (Departure City) *</label>
                    <input type="text" placeholder="Mumbai, Delhi, Pune..." value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} required style={inp}
                      onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '2px' }}>
                    <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MdArrowRightAlt size={22} color="white" />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><MdLocationOn size={14} color={T.primary} /> To (Destination) *</label>
                    {editingTrip ? (
                      <div style={{ position: 'relative' }}>
                        <input type="text" value={formData.destination} disabled
                          style={{ ...inp, background: '#f3f4f6', color: T.textLight, cursor: 'not-allowed', paddingRight: '44px' }} />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MdLock size={15} color={T.textLight} />
                        </div>
                        <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px' }}>Destination cannot be changed when editing</p>
                      </div>
                    ) : (
                      <input type="text" placeholder="Goa, Bali, Paris, Dubai..." value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} required style={inp}
                        onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><MdPeople size={14} color={T.primary} /> Travelers *</label>
                    <select value={formData.travelers} onChange={e => setFormData({ ...formData, travelers: e.target.value })} required style={inp}>
                      <option value="">Select</option>
                      {Array.from({ length: 9 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>)}
                      <option value="10+">10+ People</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><MdCalendarToday size={14} color={T.primary} /> Start Date *</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} style={inp}
                      onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><MdCalendarToday size={14} color={T.primary} /> End Date *</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required min={formData.startDate || new Date().toISOString().split('T')[0]} style={inp}
                      onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><HiOutlineGlobeAlt size={14} color={T.primary} /> Trip Scope *</label>
                    <select value={formData.tripScope} onChange={e => setFormData({ ...formData, tripScope: e.target.value })} required style={inp}>
                      <option value="">Select scope</option>
                      <option value="national">National (Within India)</option>
                      <option value="international">International</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}><MdCategory size={14} color={T.primary} /> Trip Type *</label>
                    <select value={formData.tripType} onChange={e => setFormData({ ...formData, tripType: e.target.value })} required style={inp}>
                      <option value="">Select type</option>
                      {['Leisure', 'Adventure', 'Romantic', 'Family', 'Pilgrimage', 'Honeymoon', 'Business', 'Educational'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Budget Range */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdCurrencyRupee size={14} color={T.primary} /> Budget Range (Per Person) *
                  </label>
                  <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} required style={inp}>
                    <option value="">Select budget range</option>
                    <option value="Under ₹10,000">Under ₹10,000</option>
                    <option value="₹10,000 – ₹25,000">₹10,000 – ₹25,000</option>
                    <option value="₹25,000 – ₹50,000">₹25,000 – ₹50,000</option>
                    <option value="₹50,000 – ₹1,00,000">₹50,000 – ₹1,00,000</option>
                    <option value="₹1,00,000 – ₹2,00,000">₹1,00,000 – ₹2,00,000</option>
                    <option value="₹2,00,000 – ₹5,00,000">₹2,00,000 – ₹5,00,000</option>
                    <option value="Above ₹5,00,000">Above ₹5,00,000</option>
                  </select>
                  <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px' }}>
                    Providing a realistic budget helps agencies send better quotes.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={lbl}>Special Preferences & Requirements</label>
                  <textarea value={formData.preferences} onChange={e => setFormData({ ...formData, preferences: e.target.value })}
                    placeholder="Hotel preference (budget/3★/5★), meals (veg/non-veg), activities, room type, flight needed, special occasions, accessibility needs..." rows="6"
                    style={{ ...inp, resize: 'vertical', minHeight: '150px' }}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={lbl}>How did you hear about us? *</label>
                  <select value={formData.sourceOnboarding} onChange={e => setFormData({ ...formData, sourceOnboarding: e.target.value })} required style={inp}>
                    <option value="">Select a source</option>
                    {[['google','Google Search'],['instagram','Instagram'],['facebook','Facebook'],['youtube','YouTube'],['friend_family','Friend / Family'],['whatsapp','WhatsApp'],['other','Other']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                {/* Profile incomplete warning */}
                {profileComplete === false && (
                  <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MdInfo size={22} color="#d97706" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', margin: 0, marginBottom: '4px' }}>
                        Complete your profile first
                      </p>
                      <p style={{ fontSize: '13px', color: '#b45309', margin: 0 }}>
                        {isAgency ? 'Complete your profile: phone, address, GST, PAN, website and bank account details are required before bidding.' : 'Add your phone number and email to your profile before posting a trip.'}
                      </p>
                    </div>
                    <button onClick={() => navigate('/profile')}
                      style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Complete Profile
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading || profileComplete === false} className="submit-btn"
                  style={{ width: '100%', padding: '16px', background: loading || profileComplete === false ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: loading ? 'none' : `0 6px 20px rgba(232,93,38,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  {loading ? (editingTrip ? 'Saving...' : 'Submitting...') : editingTrip ? <><MdEdit size={16} /> Save Changes</> : <><FaPaperPlane size={16} /> Submit Trip Request</>}
                </button>
              </form>
            </div>
            )} {/* end active trip conditional */}
          </>
        )}

        {/* AGENCY */}
        {isAgency && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  Live Trip Requests
                </h1>
                <p style={{ color: T.textMid, fontSize: '16px' }}>Browse and bid on active trip requests from travelers</p>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ background: 'white', padding: '16px 24px', borderRadius: '14px', border: `1px solid ${T.border}`, textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: T.primary }}>{allTrips.length}</div>
                  <div style={{ fontSize: '12px', color: T.textLight, fontWeight: '600' }}>Active Trips</div>
                </div>
                {(() => {
                  const plan = user?.membership_plan || 'Free';
                  const totalBids = plan === 'Pro' ? 25 : plan === 'Basic' ? 15 : 10;
                  const bidsLeft = Math.max(0, totalBids - (user?.bids_used_this_month || 0));
                  const pct = Math.round((bidsLeft / totalBids) * 100);
                  const barColor = bidsLeft <= 3 ? '#ef4444' : bidsLeft <= 7 ? T.accent : '#10b981';
                  return (
                    <div style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', border: `1px solid ${T.border}`, minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: T.textLight, fontWeight: '600' }}>Bids Left</span>
                        <span style={{ fontSize: '11px', background: `${T.primary}15`, color: T.primary, padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>{plan}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: barColor }}>{bidsLeft}</span>
                        <span style={{ fontSize: '14px', color: T.textLight }}> / {totalBids}</span>
                      </div>
                      <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '6px' }} />
                      </div>
                      {bidsLeft <= 3 && <p onClick={() => navigate('/membership-plan')} style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px', fontWeight: '600', cursor: 'pointer' }}>Running low! Upgrade →</p>}
                    </div>
                  );
                })()}
              </div>
            </div>

            {tripsLoading ? (
              <div style={{ textAlign: 'center', padding: '80px', color: T.textMid }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', display: 'block', margin: '0 auto 16px' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Loading trips...
              </div>
            ) : allTrips.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '20px', padding: '80px 40px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                <MdFlightTakeoff size={56} color={T.border} style={{ display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No trips yet</h3>
                <p style={{ color: T.textMid }}>Trip requests from travelers will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {allTrips.map(trip => {
                  const daysLeft = getDaysLeft(trip.created_at);
                  const img = getDestinationImage(trip.destination);
                  return (
                    <div key={trip.id} className="trip-card"
                      style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, overflow: 'hidden', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: '220px 1fr' }}>
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img src={img} alt={trip.destination} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '160px' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)' }} />
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.95)', color: T.text, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MdLocationOn size={13} color={T.primary} /> {trip.destination}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '24px 28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text }}>{trip.title}</h3>
                              <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Live</span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: T.textMid, flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdPeople size={14} color={T.textLight} /> {trip.travelers} {trip.travelers === 1 ? 'Person' : 'People'}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdCalendarToday size={13} color={T.textLight} /> {trip.start_date} → {trip.end_date}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdCategory size={13} color={T.textLight} /> {trip.trip_type}</span>
                              {trip.budget && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdCurrencyRupee size={13} color={T.primary} /><strong style={{ color: T.primary }}>{trip.budget}</strong></span>}
                            </div>
                          </div>
                          {daysLeft > 0 && (
                            <div style={{ background: daysLeft <= 2 ? '#fee2e2' : '#fef3c7', color: daysLeft <= 2 ? '#991b1b' : '#92400e', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                              {daysLeft}d left
                            </div>
                          )}
                        </div>
                        {trip.preferences && (
                          <div style={{ background: '#faf9f7', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: T.textMid, lineHeight: 1.6, borderLeft: `3px solid ${T.primary}` }}>
                            {trip.preferences.length > 120 ? trip.preferences.slice(0, 120) + '...' : trip.preferences}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: T.textLight }}>Posted {getPostedAgo(trip.created_at)}</span>
                          <button onClick={() => navigate(`/trip/${trip.id}`)}
                            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 12px rgba(232,93,38,0.25)` }}>
                            Submit Bid <MdArrowForward size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}