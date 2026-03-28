import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supportAPI, getErrorMessage } from '../services/api';
import TopNav from './TopNav';
import { MdSupportAgent, MdAdd, MdSend, MdClose } from 'react-icons/md';
import { BsTicket } from 'react-icons/bs';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`;
document.head.appendChild(css);

export default function Support() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', priority: 'medium', description: '' });

  useEffect(() => { loadTickets(); }, []);

  // ── Load tickets via GET /api/v1/support/ ────────────────────────────────
  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supportAPI.list();
      // Backend may return raw list or paginated — handle both
      const list = Array.isArray(data) ? data : (data.results || []);
      setTickets(list.map(t => ({ ...t, messages: t.messages ? (typeof t.messages === 'string' ? JSON.parse(t.messages) : t.messages) : [] })));
    } catch (e) { console.error(e); setTickets([]); } finally { setLoading(false); }
  };

  // ── Create ticket via POST /api/v1/support/ ───────────────────────────────
  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.category || !newTicket.description) { alert('Please fill all required fields'); return; }
    setSubmitting(true);
    try {
      const firstMsg = [{
        id: `msg_${Date.now()}`,
        sender: user?.full_name || user?.display_name || 'User',
        isSupport: false,
        content: newTicket.description,
        timestamp: new Date().toISOString(),
      }];
      const payload = {
        user_id: user.id,
        user_name: user?.full_name || user?.display_name || 'User',
        user_email: user?.email || '',
        subject: newTicket.subject,
        message: newTicket.description,
        // These extra fields are stored if the backend accepts them
        category: newTicket.category,
        priority: newTicket.priority,
        messages: JSON.stringify(firstMsg),
        status: 'open',
      };
      const { data } = await supportAPI.create(payload);
      // Merge returned data with local firstMsg array
      const created = data || {};
      setTickets([{ ...created, messages: firstMsg }, ...tickets]);
      setNewTicket({ subject: '', category: '', priority: 'medium', description: '' });
      setShowModal(false);
    } catch (e) { console.error(e); alert(getErrorMessage(e) || 'Failed to create ticket.'); } finally { setSubmitting(false); }
  };

  // ── Reply is local-only for now (backend has no reply endpoint yet) ───────
  const handleSendReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;
    const msg = {
      id: `msg_${Date.now()}`,
      sender: user?.full_name || user?.display_name || 'User',
      isSupport: false,
      content: newReply,
      timestamp: new Date().toISOString(),
    };
    const updated = [...(selectedTicket.messages || []), msg];
    // Optimistic update — backend doesn't have a reply sub-endpoint yet
    const t = { ...selectedTicket, messages: updated };
    setTickets(tickets.map(x => x.id === selectedTicket.id ? t : x));
    setSelectedTicket(t);
    setNewReply('');
    setTimeout(() => { const el = document.getElementById('ticket-msgs'); if (el) el.scrollTop = el.scrollHeight; }, 100);
  };

  const statusColor = s => ({ open: { bg: '#dcfce7', color: '#166534' }, closed: { bg: '#f3f4f6', color: '#374151' }, 'on-hold': { bg: '#fef3c7', color: '#92400e' } }[s] || { bg: '#e0f2fe', color: '#0891b2' });
  const prioColor   = p => ({ high: { bg: '#fee2e2', color: '#991b1b' }, medium: { bg: '#fef3c7', color: '#92400e' }, low: { bg: '#e0f2fe', color: '#0891b2' } }[p] || { bg: '#f3f4f6', color: '#374151' });
  const fmtTime = t => { const d = Date.now() - new Date(t).getTime(); if (d < 60000) return 'Just now'; if (d < 3600000) return `${Math.floor(d / 60000)}m ago`; if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`; return `${Math.floor(d / 86400000)}d ago`; };
  const filtered = activeTab === 'all' ? tickets : tickets.filter(t => t.status === activeTab);
  const inp = { width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white' };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Support" />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 32px', animation: 'fadeUp 0.5s ease' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MdSupportAgent size={30} color={T.primary} /> Support Center
            </h1>
            <p style={{ color: T.textMid }}>Get help from our team</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ padding: '11px 24px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 12px rgba(232,93,38,0.3)` }}>
            <MdAdd size={18} /> New Ticket
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', height: 'calc(100vh - 220px)' }}>

          {/* Ticket List */}
          <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {[{ k: 'all', l: 'All' }, { k: 'open', l: 'Open' }, { k: 'on-hold', l: 'On Hold' }, { k: 'closed', l: 'Closed' }].map(({ k, l }) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${activeTab === k ? T.primary : T.border}`, background: activeTab === k ? `${T.primary}12` : 'transparent', color: activeTab === k ? T.primary : T.textMid, fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {l} ({(k === 'all' ? tickets : tickets.filter(t => t.status === k)).length})
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? <div style={{ padding: '40px', textAlign: 'center', color: T.textMid }}>Loading...</div>
                : filtered.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <BsTicket size={40} color={T.border} style={{ display: 'block', margin: '0 auto 12px' }} />
                    <p style={{ color: T.textMid, fontSize: '14px' }}>{activeTab === 'all' ? 'No tickets yet' : `No ${activeTab} tickets`}</p>
                  </div>
                ) : filtered.map(ticket => {
                  const sc = statusColor(ticket.status), pc = prioColor(ticket.priority);
                  return (
                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                      style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selectedTicket?.id === ticket.id ? `${T.primary}06` : 'white', borderLeft: selectedTicket?.id === ticket.id ? `3px solid ${T.primary}` : '3px solid transparent', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (selectedTicket?.id !== ticket.id) e.currentTarget.style.background = T.bg; }}
                      onMouseLeave={e => { if (selectedTicket?.id !== ticket.id) e.currentTarget.style.background = 'white'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.primary }}>#{(ticket.id || '').toString().slice(0, 8).toUpperCase()}</span>
                        <span style={{ fontSize: '11px', color: T.textLight }}>{fmtTime(ticket.created_at)}</span>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: T.text, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ ...sc, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>{ticket.status || 'open'}</span>
                        {ticket.priority && <span style={{ ...pc, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>{ticket.priority}</span>}
                        {ticket.category && <span style={{ background: '#f3f4f6', color: T.textMid, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize' }}>{ticket.category}</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Ticket Detail */}
          <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {selectedTicket ? (
              <>
                <div style={{ padding: '20px 28px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: T.primary }}>#{(selectedTicket.id || '').toString().slice(0, 8).toUpperCase()}</span>
                    <span style={{ ...statusColor(selectedTicket.status), padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' }}>{selectedTicket.status || 'open'}</span>
                    {selectedTicket.priority && <span style={{ ...prioColor(selectedTicket.priority), padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' }}>{selectedTicket.priority} Priority</span>}
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: T.text, marginBottom: '4px' }}>{selectedTicket.subject}</h2>
                  <p style={{ fontSize: '12px', color: T.textLight }}>Created {fmtTime(selectedTicket.created_at)}</p>
                </div>
                <div id="ticket-msgs" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(selectedTicket.messages || []).map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isSupport ? 'flex-start' : 'flex-end' }}>
                      <div style={{ maxWidth: '72%', background: msg.isSupport ? T.bg : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, border: msg.isSupport ? `1px solid ${T.border}` : 'none', padding: '14px 18px', borderRadius: msg.isSupport ? '4px 16px 16px 16px' : '16px 4px 16px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: msg.isSupport ? T.primary : 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>{msg.sender}</p>
                        <p style={{ fontSize: '14px', lineHeight: 1.6, color: msg.isSupport ? T.text : 'white', margin: 0, marginBottom: '6px' }}>{msg.content}</p>
                        <p style={{ fontSize: '11px', color: msg.isSupport ? T.textLight : 'rgba(255,255,255,0.7)', margin: 0 }}>{fmtTime(msg.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTicket.status !== 'closed' ? (
                  <div style={{ padding: '16px 28px', borderTop: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                      <textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Type your reply..." rows="2"
                        style={{ flex: 1, padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                      <button onClick={handleSendReply} disabled={!newReply.trim()}
                        style={{ width: '44px', height: '44px', background: newReply.trim() ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : '#e2e8f0', color: 'white', border: 'none', borderRadius: '10px', cursor: newReply.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MdSend size={18} color={newReply.trim() ? 'white' : '#94a3b8'} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 28px', background: T.bg, borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: T.textMid, margin: 0 }}>Ticket closed. Reply to reopen.</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <BsTicket size={64} color={T.border} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text }}>Select a Ticket</h3>
                <p style={{ color: T.textMid, fontSize: '14px' }}>Choose a ticket from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: T.text }}>Create Support Ticket</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textLight, display: 'flex' }}><MdClose size={22} /></button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Subject *</label>
              <input type="text" value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Brief description" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Category *</label>
                <select value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })} style={inp}>
                  <option value="">Select</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payment</option>
                  <option value="account">Account & Profile</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Priority</label>
                <select value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })} style={inp}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase' }}>Description *</label>
              <textarea value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} placeholder="Describe your issue..." rows="5" style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '11px 22px', background: T.bg, color: T.textMid, border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateTicket} disabled={submitting}
                style={{ padding: '11px 22px', background: submitting ? '#ccc' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdAdd size={16} /> {submitting ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}