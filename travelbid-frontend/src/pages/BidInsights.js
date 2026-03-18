import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import TopNav from './TopNav';
import { MdLocationOn, MdPeople, MdAccessTime, MdLockOpen, MdLock, MdArrowForward, MdBarChart, MdWhatshot, MdOutlineVerified } from 'react-icons/md';
import { BiTrendingUp } from 'react-icons/bi';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} .bid-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.1)!important;}`;
document.head.appendChild(css);

const getDestImg = (d = '') => {
  const s = d.toLowerCase();
  if (s.includes('goa')) return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=70';
  if (s.includes('bali')) return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=70';
  if (s.includes('paris')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=70';
  if (s.includes('japan')||s.includes('tokyo')) return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=70';
  if (s.includes('dubai')) return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=70';
  if (s.includes('kerala')) return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=70';
  if (s.includes('maldives')) return 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&q=70';
  if (s.includes('kashmir')||s.includes('manali')) return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=70';
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=70';
};

export default function BidInsights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState(null);

  useEffect(() => { loadMyBids(); }, []);

  const loadMyBids = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bids').select(`*, trip_requests (id, title, destination, travelers, start_date, end_date, trip_type, preferences, status, created_at, user_id)`).eq('agency_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setBids(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleUnlock = async (bid) => {
    if (!window.confirm('Unlock this lead?\n\nYou will get access to the traveler\'s full contact details.')) return;
    setUnlockingId(bid.id);
    try {
      const { error: updateError } = await supabase.from('bids').update({ is_unlocked: true }).eq('id', bid.id);
      if (updateError) throw updateError;
      const { data: tp } = await supabase.from('user_profiles').select('full_name, phone, email').eq('id', bid.trip_requests.user_id).single();
      const existing = JSON.parse(localStorage.getItem('unlocked_leads') || '[]');
      if (!existing.find(l => l.id === bid.id)) {
        existing.push({ id: bid.id, tripId: bid.trip_id, tripTitle: bid.trip_requests?.title || 'Trip', destination: bid.trip_requests?.destination || '', travelers: bid.trip_requests?.travelers || '', travelDates: `${bid.trip_requests?.start_date} to ${bid.trip_requests?.end_date}`, preferences: bid.trip_requests?.preferences || '', bidAmount: bid.bid_amount, travelerName: tp?.full_name || 'Traveler', travelerEmail: tp?.email || 'Not provided', travelerPhone: tp?.phone || 'Not provided', unlockedAt: new Date().toISOString() });
        localStorage.setItem('unlocked_leads', JSON.stringify(existing));
      }
      setBids(prev => prev.map(b => b.id === bid.id ? { ...b, is_unlocked: true } : b));
      alert('Lead unlocked!');
      navigate('/my-lead-details');
    } catch (e) { console.error(e); alert('Failed to unlock lead.'); } finally { setUnlockingId(null); }
  };

  const tabs = [
    { key: 'active', label: 'Active Bids', count: bids.filter(b => !b.is_unlocked && b.trip_requests?.status === 'Live').length },
    { key: 'unlocked', label: 'Unlocked', count: bids.filter(b => b.is_unlocked).length },
    { key: 'all', label: 'All Bids', count: bids.length },
  ];

  const filtered = activeTab === 'active' ? bids.filter(b => !b.is_unlocked && b.trip_requests?.status === 'Live')
    : activeTab === 'unlocked' ? bids.filter(b => b.is_unlocked) : bids;

  const getPostedAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const usedBids = bids.length;
  const unlockedLeads = bids.filter(b => b.is_unlocked).length;
  const lockedLeads = bids.filter(b => !b.is_unlocked).length;

  const stats = [
    { label: 'Used Bids', value: usedBids, icon: <MdBarChart size={24} />, color: T.primary, bg: `${T.primary}12`, sub: 'Total bids submitted' },
    { label: 'Unlocked Leads', value: unlockedLeads, icon: <MdLockOpen size={24} />, color: '#10b981', bg: '#dcfce7', sub: 'Contact details revealed' },
    { label: 'Locked Leads', value: lockedLeads, icon: <MdLock size={24} />, color: T.accent, bg: `${T.accent}20`, sub: 'Pending unlock' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Bid Insights" />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 32px', animation: 'fadeUp 0.5s ease' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BiTrendingUp size={30} color={T.primary} /> Bid Insights
          </h1>
          <p style={{ color: T.textMid, fontSize: '16px' }}>Track your bids and unlock traveler contact details</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '52px', height: '52px', background: s.bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: '13px', color: T.textLight, marginBottom: '4px', fontWeight: '600' }}>{s.label}</p>
                <p style={{ fontSize: '30px', fontWeight: '800', color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: T.textLight }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '6px', borderRadius: '12px', border: `1px solid ${T.border}`, marginBottom: '28px', width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: activeTab === tab.key ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : 'transparent', color: activeTab === tab.key ? 'white' : T.textMid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: T.textMid }}>Loading your bids...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', padding: '80px 40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
            <MdBarChart size={64} color={T.border} style={{ display: 'block', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{activeTab === 'active' ? 'No Active Bids' : activeTab === 'unlocked' ? 'No Unlocked Leads' : 'No Bids Yet'}</h3>
            <p style={{ color: T.textMid, marginBottom: '24px' }}>{activeTab !== 'unlocked' ? 'Go to dashboard and submit your first bid!' : 'Unlock leads to view traveler contact info.'}</p>
            <button onClick={() => navigate('/dashboard')} style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
              Browse Trips <MdArrowForward size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filtered.map(bid => {
              const trip = bid.trip_requests;
              return (
                <div key={bid.id} className="bid-card"
                  style={{ background: 'white', borderRadius: '20px', border: bid.is_unlocked ? `2px solid #10b981` : `1px solid ${T.border}`, overflow: 'hidden', transition: 'all 0.3s', display: 'grid', gridTemplateColumns: '180px 1fr', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={getDestImg(trip?.destination)} alt={trip?.destination} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '160px' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '10px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.95)', color: T.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MdLocationOn size={12} color={T.primary} /> {trip?.destination}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 onClick={() => navigate(`/trip/${bid.trip_id}`)} style={{ fontSize: '17px', fontWeight: '700', color: T.primary, cursor: 'pointer', margin: 0 }}>{trip?.title || 'Trip'}</h3>
                          {bid.is_unlocked
                            ? <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}><MdOutlineVerified size={12} /> Unlocked</span>
                            : trip?.status === 'Live' && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Active</span>
                          }
                        </div>
                        <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: T.textMid, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdPeople size={13} color={T.textLight} /> {trip?.travelers} people</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MdAccessTime size={13} color={T.textLight} /> {getPostedAgo(bid.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                        <p style={{ fontSize: '12px', color: T.textLight, marginBottom: '2px', fontWeight: '600' }}>Your Bid</p>
                        <p style={{ fontSize: '24px', fontWeight: '800', color: T.primary, margin: 0 }}>{bid.bid_amount}</p>
                      </div>
                    </div>
                    <div style={{ background: T.bg, padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: T.textMid, lineHeight: 1.6, borderLeft: `3px solid ${T.border}` }}>
                      {bid.message?.length > 120 ? bid.message.slice(0, 120) + '...' : bid.message}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {bid.is_unlocked ? (
                        <button onClick={() => navigate('/my-lead-details')}
                          style={{ padding: '10px 22px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          View Lead Details <MdArrowForward size={15} />
                        </button>
                      ) : (
                        <button onClick={() => handleUnlock(bid)} disabled={unlockingId === bid.id}
                          style={{ padding: '10px 22px', background: unlockingId === bid.id ? '#ccc' : `linear-gradient(135deg, ${T.accent}, #e8a800)`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: unlockingId === bid.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 12px rgba(245,166,35,0.3)` }}>
                          <MdLockOpen size={16} /> {unlockingId === bid.id ? 'Unlocking...' : 'Unlock Lead'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}