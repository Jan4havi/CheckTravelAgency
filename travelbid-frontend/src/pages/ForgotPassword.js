import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { MdEmail, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import { FaPaperPlane } from 'react-icons/fa';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', border: '#ede9e3', bgSoft: '#faf9f7' };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    setLoading(true); setError('');
    try {
      const { error: re } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (re) { setError(re.message?.toLowerCase().includes('rate') ? 'Too many attempts. Please wait a few minutes.' : re.message); return; }
      setStep('success');
    } catch { setError('Something went wrong. Please try again.'); } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bgSoft, padding: '20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`}</style>
      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px', padding: '48px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaPaperPlane size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: '700', color: T.text }}>CheckTravelPrice</span>
        </div>

        {step === 'request' && (
          <>
            <div style={{ width: '64px', height: '64px', background: `${T.primary}12`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: T.primary }}>
              <MdEmail size={30} />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', color: T.text }}>Forgot Password?</h1>
            <p style={{ textAlign: 'center', color: T.textMid, fontSize: '14px', marginBottom: '28px' }}>Enter your email and we'll send a reset link instantly.</p>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
            <form onSubmit={handleSend}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: T.textMid, textTransform: 'uppercase' }}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <MdEmail size={18} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" required
                    style={{ width: '100%', padding: '13px 16px 13px 44px', border: `1.5px solid ${error ? '#ef4444' : T.border}`, borderRadius: '10px', fontSize: '15px', outline: 'none', background: T.bgSoft, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = error ? '#ef4444' : T.border} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', background: loading ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Sending...' : <>Send Reset Link <MdArrowForward size={17} /></>}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: T.textMid }}>Remembered it? <Link to="/login" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Sign in</Link></p>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <MdCheckCircle size={72} />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '800', color: T.text, marginBottom: '12px' }}>Check Your Email!</h2>
            <p style={{ color: T.textMid, marginBottom: '8px', fontSize: '15px' }}>Reset link sent to:</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: T.primary, marginBottom: '24px' }}>{email}</p>
            <div style={{ background: T.bgSoft, border: `1px solid ${T.border}`, padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, marginBottom: '8px' }}>Next Steps:</p>
              <ol style={{ fontSize: '13px', color: T.textMid, paddingLeft: '18px', margin: 0, lineHeight: 2.2 }}>
                <li>Open your email inbox</li>
                <li>Click the reset link in the email</li>
                <li>Set your new password</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>
            <p style={{ fontSize: '13px', color: T.textMid, marginBottom: '20px' }}>
              Didn't get it? <span onClick={() => { setStep('request'); setError(''); }} style={{ color: T.primary, cursor: 'pointer', fontWeight: '600' }}>Try again</span>
            </p>
            <button onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Back to Sign In <MdArrowForward size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}