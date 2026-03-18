import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { MdLock, MdVisibility, MdVisibilityOff, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import { FaPaperPlane } from 'react-icons/fa';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', border: '#ede9e3', bgSoft: '#faf9f7' };

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY' && session) setSessionReady(true); });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setSessionReady(true); });
  }, []);

  const validatePassword = p => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(p);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!validatePassword(password)) { setError('Min 8 chars with uppercase, lowercase, number & special char'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { error: ue } = await supabase.auth.updateUser({ password });
      if (ue) throw new Error(ue.message);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) { setError(err.message || 'Failed to reset password.'); } finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '13px 44px 13px 44px', border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '15px', outline: 'none', background: T.bgSoft, fontFamily: 'inherit', boxSizing: 'border-box' };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bgSoft, padding: '20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`}</style>
      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px', padding: '48px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaPaperPlane size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: '700', color: T.text }}>CheckTravelPrice</span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <MdCheckCircle size={72} />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '800', color: T.text, marginBottom: '12px' }}>Password Updated!</h2>
            <p style={{ color: T.textMid, marginBottom: '24px' }}>Your password has been reset. Redirecting to sign in...</p>
          </div>
        ) : (
          <>
            <div style={{ color: T.primary, display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <MdLock size={56} />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', color: T.text }}>Set New Password</h1>
            <p style={{ textAlign: 'center', color: T.textMid, fontSize: '14px', marginBottom: '24px' }}>Choose a strong new password for your account.</p>

            {!sessionReady && (
              <div style={{ background: '#fef3c7', border: `1.5px solid ${T.accent}`, padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
                Invalid or expired reset link.{' '}
                <span onClick={() => navigate('/forgot-password')} style={{ color: T.primary, cursor: 'pointer', fontWeight: '700' }}>Request a new one</span>
              </div>
            )}
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

            <form onSubmit={handleReset}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: T.textMid, textTransform: 'uppercase' }}>New Password *</label>
                <div style={{ position: 'relative' }}>
                  <MdLock size={18} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Create new password" required disabled={!sessionReady} style={inp}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight, display: 'flex' }}>
                    {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: T.textMid, marginTop: '4px' }}>Min 8 chars, uppercase, lowercase, number & special char</p>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: T.textMid, textTransform: 'uppercase' }}>Confirm New Password *</label>
                <div style={{ position: 'relative' }}>
                  <MdLock size={18} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} placeholder="Re-enter new password" required disabled={!sessionReady} style={inp}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                </div>
              </div>
              <button type="submit" disabled={loading || !sessionReady}
                style={{ width: '100%', padding: '14px', background: loading || !sessionReady ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading || !sessionReady ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Updating...' : <>Set New Password <MdArrowForward size={17} /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}