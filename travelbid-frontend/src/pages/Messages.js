import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationsAPI, messagesAPI, getErrorMessage } from '../services/api';
import TopNav from './TopNav';
import { MdMessage, MdSend, MdLockOpen, MdLock, MdArrowForward, MdOutlineVerified } from 'react-icons/md';
import { BsChatDots } from 'react-icons/bs';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`;
document.head.appendChild(css);

const FAKE_MESSAGES = [
  { id: 'f1', content: 'Hi! I saw your bid on my trip. Can you tell me more about the package?', isOther: true },
  { id: 'f2', content: 'Sure! We offer a complete package including hotel, breakfast, and sightseeing. Best rates guaranteed!', isOther: false },
  { id: 'f3', content: 'That sounds great. What about airport transfers? Any group discounts?', isOther: true },
  { id: 'f4', content: 'Yes! Round-trip transfers included. For your group size we can offer a special discount.', isOther: false },
  { id: 'f5', content: 'Amazing! Can you also arrange activities and local experiences?', isOther: true },
  { id: 'f6', content: 'Of course! I can customize the full itinerary for you. When can we talk?', isOther: false },
];

const getUnlockedTripIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem('unlocked_leads') || '[]').map(l => String(l.tripId)).filter(Boolean)); }
  catch { return new Set(); }
};

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const isAgency = user?.user_type === 'agency';
  const unlockedTripIds = getUnlockedTripIds();

  const isItemUnlocked = (item) => {
    if (!isAgency) return true;
    if (!item) return false;
    const tripId = String(item.trip_id || item.data?.trip_id || '');
    return unlockedTripIds.has(tripId);
  };

  const isUnlocked = isItemUnlocked(selectedItem);

  useEffect(() => { loadConversations(); }, []); // eslint-disable-line

  // ── Polling for new messages (replaces supabase realtime) ─────────────────
  useEffect(() => {
    if (selectedItem && isUnlocked) {
      loadMessages(selectedItem.id);
      pollRef.current = setInterval(() => loadMessages(selectedItem.id), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedItem?.id, isUnlocked]); // eslint-disable-line

  useEffect(() => { scrollToBottom(); }, [messages]);
  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  // ── Load conversations via GET /api/v1/conversations/ ─────────────────────
  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data } = await conversationsAPI.list();
      const convs = Array.isArray(data) ? data : (data.results || []);
      setConversations(convs);

      // Auto-select if navigated with state (e.g. from My Leads)
      if (location.state?.tripId || location.state?.leadId) {
        const tripId = location.state.tripId;
        const leadId = location.state.leadId;
        let match = convs.find(c => String(c.trip_id) === String(tripId));
        if (!match && isAgency && tripId) {
          match = await createConversation(tripId);
          if (match) setConversations([match, ...convs]);
        }
        if (match) setSelectedItem(match);
      }
    } catch (e) { console.error(e); setConversations([]); } finally { setLoading(false); }
  };

  // ── Create conversation via POST /api/v1/conversations/ ───────────────────
  const createConversation = async (tripId) => {
    try {
      const leads = JSON.parse(localStorage.getItem('unlocked_leads') || '[]');
      const lead = leads.find(l => String(l.tripId) === String(tripId));
      if (!lead) return null;
      const { data } = await conversationsAPI.create({
        trip_id: tripId,
        traveler_id: lead.travelerId || null,
        agency_id: user.id,
      });
      return data;
    } catch (e) { console.error(e); return null; }
  };

  // ── Load messages via GET /api/v1/messages/{conversation_id} ─────────────
  const loadMessages = async (convId) => {
    try {
      const { data } = await messagesAPI.list(convId);
      const msgs = Array.isArray(data) ? data : (data.results || []);
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  // ── Send message via POST /api/v1/messages/ ───────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedItem || sending) return;
    setSending(true);
    const optimistic = {
      id: `tmp_${Date.now()}`,
      conversation_id: selectedItem.id,
      sender_id: user.id,
      sender_name: isAgency ? user.display_name : user.display_name,
      sender_type: isAgency ? 'agency' : 'traveler',
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    scrollToBottom();
    try {
      await messagesAPI.create({
        conversation_id: selectedItem.id,
        sender_id: user.id,
        sender_name: user.display_name || '',
        sender_type: isAgency ? 'agency' : 'traveler',
        content: optimistic.content,
      });
    } catch (e) {
      console.error(e);
      // Rollback optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      alert('Failed to send message.');
    } finally { setSending(false); }
  };

  const fmtTime = t => {
    if (!t) return '';
    const d = new Date(t), now = new Date(), diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getConvName   = (c) => isAgency ? (c.traveler_name || 'Traveler') : (c.agency_name || 'Agency');
  const getConvTrip   = (c) => c.trip_title || c.trip?.title || 'Trip Discussion';
  const activeName    = selectedItem ? getConvName(selectedItem) : '';
  const activeTrip    = selectedItem ? getConvTrip(selectedItem) : '';
  const activeInitial = activeName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Messages" />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeUp 0.5s ease' }}>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '800', color: T.text, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MdMessage size={28} color={T.primary} /> Messages
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', flex: 1, minHeight: 0 }}>

          {/* Sidebar */}
          <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: T.text, marginBottom: '2px' }}>Conversations</h2>
              <p style={{ fontSize: '12px', color: T.textLight }}>{conversations.length} total</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? <div style={{ padding: '40px', textAlign: 'center', color: T.textMid }}>Loading...</div>
                : conversations.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <BsChatDots size={40} color={T.border} style={{ display: 'block', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: '600', color: T.text, marginBottom: '6px' }}>No conversations yet</p>
                    <p style={{ fontSize: '12px', color: T.textMid, lineHeight: 1.6 }}>{isAgency ? 'Unlock a lead to start chatting.' : 'Conversations appear here.'}</p>
                    {isAgency && <button onClick={() => navigate('/bid-insights')} style={{ marginTop: '14px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Go to Bid Insights</button>}
                  </div>
                ) : conversations.map(conv => {
                  const unlocked = !isAgency || unlockedTripIds.has(String(conv.trip_id));
                  const selected = selectedItem?.id === conv.id;
                  const name = getConvName(conv);
                  const trip = getConvTrip(conv);
                  const initial = name?.charAt(0)?.toUpperCase() || '?';
                  const time = fmtTime(conv.updated_at);

                  return (
                    <div key={conv.id} onClick={() => { setSelectedItem(conv); setMessages([]); }}
                      style={{ padding: '13px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selected ? `${T.primary}07` : 'white', borderLeft: selected ? `3px solid ${T.primary}` : '3px solid transparent', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = T.bg; }}
                      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'white'; }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: '42px', height: '42px', background: unlocked ? `linear-gradient(135deg, ${T.primary}, ${T.accent})` : '#f0f0f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '17px', color: unlocked ? 'white' : T.textMid, flexShrink: 0 }}>
                          <span style={{ filter: unlocked ? 'none' : 'blur(4px)' }}>{initial}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '6px', filter: unlocked ? 'none' : 'blur(6px)', userSelect: unlocked ? 'auto' : 'none' }}>{name}</span>
                            <span style={{ fontSize: '11px', color: T.textLight, flexShrink: 0 }}>{time}</span>
                          </div>
                          <p style={{ fontSize: '12px', color: T.textMid, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', filter: unlocked ? 'none' : 'blur(4px)', userSelect: unlocked ? 'auto' : 'none' }}>{trip}</p>
                          {!unlocked && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <MdLock size={10} color={T.primary} />
                              <span style={{ fontSize: '10px', fontWeight: '700', color: T.primary }}>Unlock lead to chat</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Chat Window */}
          <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>
            {selectedItem ? (
              <>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', background: isUnlocked ? `linear-gradient(135deg, ${T.primary}, ${T.accent})` : '#f0f0f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', color: isUnlocked ? 'white' : T.textMid }}>
                    <span style={{ filter: isUnlocked ? 'none' : 'blur(4px)' }}>{activeInitial}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: T.text, marginBottom: '2px', filter: isUnlocked ? 'none' : 'blur(6px)', userSelect: isUnlocked ? 'auto' : 'none' }}>{activeName}</h3>
                    <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>{activeTrip}</p>
                  </div>
                  {isUnlocked
                    ? <span style={{ background: '#dcfce7', color: '#166634', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><MdOutlineVerified size={13} /> Unlocked</span>
                    : <span style={{ background: `${T.primary}15`, color: T.primary, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><MdLock size={13} /> Locked</span>
                  }
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', background: T.bg, position: 'relative' }}>
                  {isUnlocked ? (
                    messages.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                        <BsChatDots size={48} color={T.border} />
                        <p style={{ fontSize: '15px', fontWeight: '700', color: T.text }}>Start the conversation!</p>
                        <p style={{ fontSize: '13px', color: T.textMid, textAlign: 'center', maxWidth: '240px' }}>Say hello and discuss the trip details.</p>
                      </div>
                    ) : messages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                          {!isMe && <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>{msg.sender_name?.charAt(0) || '?'}</div>}
                          <div style={{ maxWidth: '65%' }}>
                            {!isMe && <p style={{ fontSize: '11px', color: T.textLight, marginBottom: '4px', marginLeft: '4px' }}>{msg.sender_name}</p>}
                            <div style={{ background: isMe ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : 'white', color: isMe ? 'white' : T.text, padding: '11px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: isMe ? 'none' : `1px solid ${T.border}` }}>
                              <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                            </div>
                            <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>{fmtTime(msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {FAKE_MESSAGES.map(msg => (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isOther ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: '8px' }}>
                            {msg.isOther && <div style={{ width: '28px', height: '28px', background: '#e2e8f0', borderRadius: '50%', flexShrink: 0 }} />}
                            <div style={{ maxWidth: '60%', background: msg.isOther ? 'white' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: msg.isOther ? T.text : 'white', padding: '11px 16px', borderRadius: msg.isOther ? '18px 18px 18px 4px' : '18px 18px 4px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                              <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,249,247,0.82)', backdropFilter: 'blur(3px)' }}>
                        <div style={{ background: 'white', borderRadius: '24px', padding: '36px 32px', textAlign: 'center', maxWidth: '340px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', border: `1px solid ${T.border}` }}>
                          <div style={{ color: T.primary, display: 'flex', justifyContent: 'center', marginBottom: '18px', animation: 'float 3s ease-in-out infinite' }}>
                            <MdLock size={56} />
                          </div>
                          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '21px', fontWeight: '800', color: T.text, marginBottom: '10px' }}>Unlock to Chat</h3>
                          <p style={{ fontSize: '14px', color: T.textMid, lineHeight: 1.7, marginBottom: '18px' }}>
                            Unlock this lead from Bid Insights to access full contact details and start chatting.
                          </p>
                          <button onClick={() => navigate('/bid-insights')}
                            style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 8px 24px rgba(232,93,38,0.38)` }}>
                            <MdLockOpen size={18} /> Unlock Lead Now <MdArrowForward size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {isUnlocked ? (
                  <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: 'white' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end', background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: '14px', padding: '8px 12px' }}>
                      <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message... (Enter to send)" rows="1"
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', maxHeight: '100px', lineHeight: 1.5 }} />
                      <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                        style={{ width: '36px', height: '36px', background: newMessage.trim() && !sending ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : '#e2e8f0', border: 'none', borderRadius: '10px', cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MdSend size={15} color={newMessage.trim() && !sending ? 'white' : '#94a3b8'} />
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: T.textLight, marginTop: '6px', textAlign: 'center' }}>Enter to send · Shift+Enter for new line</p>
                  </div>
                ) : (
                  <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: 'white' }}>
                    <div onClick={() => navigate('/bid-insights')}
                      style={{ display: 'flex', gap: '10px', alignItems: 'center', background: `${T.primary}08`, border: `1.5px solid ${T.primary}30`, borderRadius: '14px', padding: '13px 18px', cursor: 'pointer' }}>
                      <MdLock size={18} color={T.primary} />
                      <span style={{ fontSize: '14px', color: T.primary, fontWeight: '700' }}>Unlock lead to send messages</span>
                      <MdArrowForward size={16} color={T.primary} style={{ marginLeft: 'auto' }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <div style={{ color: `${T.primary}30`, animation: 'float 3s ease-in-out infinite' }}><BsChatDots size={80} /></div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '800', color: T.text }}>Your Messages</h3>
                <p style={{ fontSize: '14px', color: T.textMid, textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
                  {isAgency ? 'Unlock leads to start chatting with travelers!' : 'Select a conversation to start chatting.'}
                </p>
                {isAgency && (
                  <button onClick={() => navigate('/bid-insights')}
                    style={{ padding: '12px 28px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdLockOpen size={16} /> Unlock Leads <MdArrowForward size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}