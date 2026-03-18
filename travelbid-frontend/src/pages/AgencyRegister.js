import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdBusiness, MdEmail, MdPhone, MdLock, MdArrowForward, MdCheck } from 'react-icons/md';
import { FaPaperPlane } from 'react-icons/fa';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', border: '#ede9e3', bgSoft: '#faf9f7' };

export default function AgencyRegister() {
  const navigate = useNavigate();
  const { agencySignup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ agency_name: '', email: '', phone: '', gst_number: '', pan_number: '', address: '', website: '', password: '', confirmPassword: '' });

  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePhone = p => /^[6-9]\d{9}$/.test(p);
  const validatePassword = p => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(p);
  const validateGST = g => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g);
  const validatePAN = p => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(p);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: ['gst_number', 'pan_number'].includes(name) ? value.toUpperCase() : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (errors.general) setErrors({ ...errors, general: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.agency_name.trim()) errs.agency_name = 'Please enter agency name';
    if (!validateEmail(formData.email)) errs.email = 'Valid email required';
    if (!validatePhone(formData.phone)) errs.phone = 'Valid 10-digit number required';
    if (!validateGST(formData.gst_number)) errs.gst_number = 'Valid 15-character GST required';
    if (!validatePAN(formData.pan_number)) errs.pan_number = 'Valid 10-character PAN required';
    if (!formData.address.trim()) errs.address = 'Business address required';
    if (!formData.website.trim()) errs.website = 'Website is required';
    else if (!/^https?:\/\/.+\..+/.test(formData.website) && !formData.website.includes('.')) errs.website = 'Enter a valid website URL (e.g. https://yoursite.com)';
    if (!validatePassword(formData.password)) errs.password = 'Min 8 chars with uppercase, lowercase, number & special char';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await agencySignup(formData);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'ALREADY_REGISTERED') setErrors({ general: 'ALREADY_REGISTERED', email: 'Already registered' });
      else if (err.message === 'RATE_LIMIT') setErrors({ general: 'RATE_LIMIT' });
      else setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally { setLoading(false); }
  };

  const inp = (hasErr, withIcon = true) => ({ width: '100%', padding: withIcon ? '11px 14px 11px 40px' : '11px 14px', border: `1.5px solid ${hasErr ? '#ef4444' : T.border}`, borderRadius: '9px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: T.bgSoft, color: T.text, boxSizing: 'border-box', transition: 'border-color 0.2s' });
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.4px' };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`}</style>

      {/* LEFT — Form */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 48px', background: 'white', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaPaperPlane size={14} color="white" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: '700', color: T.text }}>CheckTravelPrice</span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '800', color: T.text, marginBottom: '6px' }}>Register Your Agency</h1>
          <p style={{ color: T.textMid, fontSize: '14px', marginBottom: '20px' }}>Join India's top travel bidding platform</p>

          {errors.general === 'ALREADY_REGISTERED' && (
            <div style={{ background: '#fff7ed', border: `1.5px solid ${T.accent}`, padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>Email already registered!</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '8px', background: T.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Sign In</button>
                <button onClick={() => navigate('/forgot-password')} style={{ flex: 1, padding: '8px', background: 'white', color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Forgot Password</button>
              </div>
            </div>
          )}
          {errors.general === 'RATE_LIMIT' && <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', color: '#991b1b' }}>Too many attempts. Please wait a few minutes.</div>}
          {errors.general && !['ALREADY_REGISTERED', 'RATE_LIMIT'].includes(errors.general) && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px' }}>{errors.general}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Agency Name *</label>
              <div style={{ position: 'relative' }}>
                <MdBusiness size={16} color={T.textLight} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" name="agency_name" value={formData.agency_name} onChange={handleChange} placeholder="Your travel agency name" required style={inp(errors.agency_name)}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.agency_name ? '#ef4444' : T.border} />
              </div>
              {errors.agency_name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '3px' }}>{errors.agency_name}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Email *</label>
                <div style={{ position: 'relative' }}>
                  <MdEmail size={16} color={T.textLight} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="agency@email.com" required style={inp(errors.email)}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.email ? '#ef4444' : T.border} />
                </div>
                {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '3px' }}>{errors.email}</p>}
              </div>
              <div>
                <label style={lbl}>Mobile *</label>
                <div style={{ position: 'relative' }}>
                  <MdPhone size={16} color={T.textLight} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" maxLength="10" required style={inp(errors.phone)}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.phone ? '#ef4444' : T.border} />
                </div>
                {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '3px' }}>{errors.phone}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>GST Number *</label>
                <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} placeholder="22AAAAA0000A1Z5" maxLength="15" required style={{ ...inp(errors.gst_number, false), textTransform: 'uppercase' }}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.gst_number ? '#ef4444' : T.border} />
                {errors.gst_number && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '3px' }}>{errors.gst_number}</p>}
              </div>
              <div>
                <label style={lbl}>PAN Number *</label>
                <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} placeholder="ABCDE1234F" maxLength="10" required style={{ ...inp(errors.pan_number, false), textTransform: 'uppercase' }}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.pan_number ? '#ef4444' : T.border} />
                {errors.pan_number && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '3px' }}>{errors.pan_number}</p>}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Business Address *</label>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Complete business address" required rows="2" style={{ ...inp(errors.address, false), resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.address ? '#ef4444' : T.border} />
              {errors.address && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '3px' }}>{errors.address}</p>}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Website *</label>
              <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://yourwebsite.com" required style={inp(errors.website, false)}
                onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.website ? '#ef4444' : T.border} />
              {errors.website && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px' }}>{errors.website}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={lbl}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <MdLock size={16} color={T.textLight} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" required style={inp(errors.password)}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.password ? '#ef4444' : T.border} />
                </div>
                {errors.password && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px' }}>{errors.password}</p>}
              </div>
              <div>
                <label style={lbl}>Confirm *</label>
                <div style={{ position: 'relative' }}>
                  <MdLock size={16} color={T.textLight} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter" required style={inp(errors.confirmPassword)}
                    onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : T.border} />
                </div>
                {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px' }}>{errors.confirmPassword}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: loading ? 'none' : `0 6px 20px rgba(232,93,38,0.3)` }}>
              {loading ? 'Registering...' : <>Register Agency <MdArrowForward size={17} /></>}
            </button>
          </form>

          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: T.textMid, marginBottom: '6px' }}>Already registered? <Link to="/login" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Sign in</Link></p>
            <p style={{ fontSize: '13px', color: T.textMid }}>Are you a traveler? <Link to="/signup" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Sign up here</Link></p>
          </div>
        </div>
      </div>

      {/* RIGHT — Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=85" alt="Agency" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(26,26,46,0.6) 0%, rgba(232,93,38,0.55) 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Join 500+ Verified Agencies</h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.7 }}>Access thousands of quality traveler leads. Compete, win, and grow your travel business.</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {['Quality leads', 'GST verified platform', 'Direct chat with travelers'].map(t => (
                <span key={t} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdCheck size={12} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}