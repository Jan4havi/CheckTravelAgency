import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward, MdWarning } from 'react-icons/md';
import { FaPaperPlane } from 'react-icons/fa';

const T = {
  primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623',
  text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa',
  border: '#ede9e3', bgSoft: '#faf9f7',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors.general) setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setErrors({ general: 'Please enter your email and password' }); return; }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message?.toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials')) setErrors({ general: 'INVALID_CREDENTIALS' });
      else if (msg.includes('rate limit') || msg.includes('too many')) setErrors({ general: 'RATE_LIMIT' });
      else setErrors({ general: err.message || 'Login failed. Please try again.' });
    } finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '13px 16px 13px 44px', border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '15px', outline: 'none', background: T.bgSoft, color: T.text, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`}</style>

      {/* LEFT — Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=85" alt="Travel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,26,46,0.85) 0%, rgba(232,93,38,0.4) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaPaperPlane size={16} color="white" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: 'white' }}>CheckTravelPrice</span>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '800', color: 'white', lineHeight: 1.2, marginBottom: '16px' }}>
              Your Next<br />Adventure<br />Awaits
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: 1.7 }}>Connect with verified travel agencies<br />and get the best deals for your trips.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              {[['10K+', 'Travelers'], ['500+', 'Agencies'], ['₹0', 'Always Free']].map(([v, l]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{v}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'white' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px' }}>Welcome back</h1>
            <p style={{ color: T.textMid, fontSize: '15px' }}>Sign in to continue your journey</p>
          </div>

          {errors.general === 'INVALID_CREDENTIALS' && (
            <div style={{ background: '#fff7f5', border: `1.5px solid ${T.primary}40`, padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: T.primary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><MdWarning size={16} /> Wrong email or password</p>
              <button onClick={() => navigate('/forgot-password')} style={{ fontSize: '13px', color: T.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline', padding: 0 }}>Forgot your password?</button>
            </div>
          )}
          {errors.general === 'RATE_LIMIT' && (
            <div style={{ background: '#fee2e2', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
              Too many attempts. Please wait a few minutes.
            </div>
          )}
          {errors.general && !['INVALID_CREDENTIALS', 'RATE_LIMIT'].includes(errors.general) && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{errors.general}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: T.textMid }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <MdEmail size={18} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required style={inp}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: T.textMid }}>Password</label>
              <div style={{ position: 'relative' }}>
                <MdLock size={18} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required style={{ ...inp, paddingRight: '48px' }}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight, display: 'flex' }}>
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: T.primary, textDecoration: 'none', fontWeight: '600' }}>Forgot Password?</Link>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 6px 20px rgba(232,93,38,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Signing in...' : <>Sign In <MdArrowForward size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${T.border}` }}>
            <p style={{ textAlign: 'center', fontSize: '14px', color: T.textMid, marginBottom: '12px' }}>
              Don't have an account? <Link to="/signup" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Create account</Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: '14px', color: T.textMid }}>
              Travel agency? <Link to="/agency-signup" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}