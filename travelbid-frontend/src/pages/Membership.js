import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from './TopNav';
import { MdStar, MdCheck, MdArrowForward } from 'react-icons/md';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} .plan-card:hover{transform:translateY(-4px)!important;}`;
document.head.appendChild(css);

export default function Membership() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan] = useState(user?.membership_plan || 'Free');
  const isAgency = user?.user_type === 'agency';

  const travelerPlan = {
    name: 'Free', price: '₹0', period: '3 Months', color: T.primary,
    features: ['1 trip request to post / day', 'Receive all bids', '3 messaging requests / trip request', 'Basic support'],
  };

  const agencyPlans = [
    { name: 'Free', price: '₹0', period: '/month', color: T.textMid, features: ['2 bids/month', '1 Free lead unlocking', 'Small budget trips'], popular: false },
    { name: 'Basic', price: '₹299', period: '/month', color: T.primary, features: ['15 bids/month', 'Quality lead unlocking on chat request', 'High Budget Trips'], popular: true },
    { name: 'Pro', price: '₹999', period: '/month', color: '#7c3aed', features: ['25 bids/month', 'Quality lead unlocking on chat request', 'Luxury Budget Trips'], popular: false },
  ];

  const plans = isAgency ? agencyPlans : [travelerPlan];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Membership" />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px', animation: 'fadeUp 0.5s ease' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdStar size={30} color={T.accent} /> {isAgency ? 'Membership Plans' : 'Your Plan'}
          </h1>
          <p style={{ color: T.textMid }}>{isAgency ? 'Choose the perfect plan for your travel agency' : 'Your current membership plan'}</p>
        </div>

        {/* Current plan banner */}
        <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, padding: '24px 32px', borderRadius: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: `0 8px 24px rgba(232,93,38,0.25)` }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdStar size={18} color={T.accent} /> You are on the <strong>{currentPlan}</strong> plan
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
              {isAgency ? 'Upgrade to get more leads and grow your business' : 'Enjoy unlimited trip requests and agency offers — completely free!'}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdCheck size={18} /> {currentPlan} Plan Active
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: isAgency ? 'repeat(3, 1fr)' : '1fr', gap: '24px', maxWidth: isAgency ? '100%' : '440px', margin: isAgency ? '0' : '0 auto' }}>
          {plans.map(plan => (
            <div key={plan.name} className="plan-card"
              style={{ background: plan.popular ? `linear-gradient(160deg, ${T.text} 0%, #2d2d44 100%)` : 'white', padding: '32px', borderRadius: '20px', border: plan.popular ? 'none' : `1px solid ${T.border}`, boxShadow: plan.popular ? `0 20px 40px rgba(26,26,46,0.2)` : '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.3s', position: 'relative' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, color: 'white', padding: '5px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: plan.popular ? 'white' : T.text, marginBottom: '8px' }}>{plan.name}</h3>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '38px', fontWeight: '900', color: plan.popular ? T.accent : plan.color }}>{plan.price}</span>
                <span style={{ fontSize: '15px', color: plan.popular ? 'rgba(255,255,255,0.6)' : T.textLight, fontWeight: '500' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '28px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.85)' : T.textMid }}>
                    <MdCheck size={16} color={plan.popular ? T.accent : T.primary} /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => plan.name === 'Free' ? alert('You\'re already on the Free plan!') : alert(`Payment integration coming soon for ${plan.name} plan!`)}
                disabled={currentPlan === plan.name}
                style={{ width: '100%', padding: '13px', background: currentPlan === plan.name ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: currentPlan === plan.name ? (plan.popular ? 'rgba(255,255,255,0.5)' : T.textLight) : 'white', border: currentPlan === plan.name ? `1px solid ${plan.popular ? 'rgba(255,255,255,0.2)' : T.border}` : 'none', borderRadius: '10px', fontWeight: '700', cursor: currentPlan === plan.name ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {currentPlan === plan.name ? <><MdCheck size={16} /> Current Plan</> : <>Get {plan.name} <MdArrowForward size={15} /></>}
              </button>
            </div>
          ))}
        </div>

        {isAgency && (
          <div style={{ marginTop: '40px', background: 'white', borderRadius: '20px', padding: '28px 32px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text, marginBottom: '6px' }}>Need a custom plan?</h3>
              <p style={{ color: T.textMid, fontSize: '14px' }}>For large agencies with custom requirements, contact our sales team.</p>
            </div>
            <button onClick={() => alert('Contact sales coming soon!')}
              style={{ padding: '12px 24px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              Contact Sales <MdArrowForward size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}