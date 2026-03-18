import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from './TopNav';
import { MdReceipt, MdArrowBack, MdBarChart, MdSyncAlt, MdDownload, MdNotifications, MdLock, MdCheck } from 'react-icons/md';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`;
document.head.appendChild(css);

export default function Invoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAgency = user?.user_type === 'agency';

  const upcoming = isAgency ? [
    { icon: <MdBarChart size={22} />, title: 'Lead Payment Invoices', desc: 'Auto-generated invoices for every unlocked lead' },
    { icon: <MdSyncAlt size={22} />, title: 'Membership Billing', desc: 'Monthly/annual plan invoices with PDF download' },
    { icon: <MdDownload size={22} />, title: 'Export to PDF', desc: 'One-click PDF export for your accounting needs' },
    { icon: <MdNotifications size={22} />, title: 'Email Receipts', desc: 'Automatic email receipts for every transaction' },
  ] : [
    { icon: <MdReceipt size={22} />, title: 'Membership Invoices', desc: 'View and download your monthly membership bills' },
    { icon: <MdLock size={22} />, title: 'Secure Payments', desc: 'Pay safely with cards, UPI, net banking' },
    { icon: <MdDownload size={22} />, title: 'PDF Downloads', desc: 'Download invoices for your records' },
    { icon: <MdCheck size={22} />, title: 'Encrypted Transactions', desc: 'Bank-grade security on all payments' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Invoice" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 32px', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
        <div style={{ width: '100px', height: '100px', background: `${T.primary}12`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: `2px solid ${T.primary}20`, color: T.primary }}>
          <MdReceipt size={48} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${T.accent}20`, color: '#92400e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
          Coming Soon
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '800', color: T.text, marginBottom: '16px' }}>
          {isAgency ? 'Invoices & Payments' : 'My Invoices'}
        </h1>
        <p style={{ fontSize: '17px', color: T.textMid, maxWidth: '500px', margin: '0 auto 48px', lineHeight: 1.7 }}>
          {isAgency ? "Invoice and payment management is under development. Soon you'll have everything you need to manage your agency finances." : "Invoice management for your membership is coming soon!"}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px', textAlign: 'left' }}>
          {upcoming.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: `1px solid ${T.border}`, display: 'flex', gap: '14px', alignItems: 'start' }}>
              <div style={{ width: '44px', height: '44px', background: `${T.primary}10`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, flexShrink: 0 }}>{icon}</div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: T.text, marginBottom: '4px' }}>{title}</h4>
                <p style={{ fontSize: '13px', color: T.textMid, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: `${T.primary}08`, padding: '18px 24px', borderRadius: '14px', border: `1px solid ${T.primary}20`, marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: T.primary, fontWeight: '600', margin: 0 }}>We're working hard to bring you the best invoice management experience. Stay tuned!</p>
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ padding: '13px 32px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', boxShadow: `0 4px 16px rgba(232,93,38,0.3)` }}>
          <MdArrowBack size={18} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}