import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdPerson, MdEmail, MdPhone, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward, MdCheck } from 'react-icons/md';
import { FaPaperPlane } from 'react-icons/fa';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', border: '#ede9e3', bgSoft: '#faf9f7' };

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [otpStep, setOtpStep] = useState(false); // false = form, true = OTP entry
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePhone = p => /^[6-9]\d{9}$/.test(p);
  const validatePassword = p => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(p);

  const sendOtp = () => {
    if (!validatePhone(formData.phone)) { setErrors({ ...errors, phone: 'Enter valid 10-digit mobile number first' }); return; }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpStep(true);
    setResendTimer(30);
    // Start resend countdown
    const interval = setInterval(() => setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; }), 1000);
    // In production: call SMS API here (e.g. Fast2SMS, MSG91)
    console.log('OTP for demo:', code); // Remove in production
    alert(`Demo OTP: ${code}

(In production, this will be sent via SMS to +91${formData.phone})`);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      setOtpStep(false);
      setOtpError('');
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (errors.general) setErrors({ ...errors, general: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Require phone OTP verification before submitting
    if (!otpVerified) {
      setErrors({ general: 'Please verify your phone number with OTP before creating account.' });
      return;
    }
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Please enter your full name';
    if (!validateEmail(formData.email)) errs.email = 'Please enter a valid email';
    if (!validatePhone(formData.phone)) errs.phone = 'Enter valid 10-digit Indian mobile number';
    if (!validatePassword(formData.password)) errs.password = 'Min 8 chars with uppercase, lowercase, number & special char';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await signup({ full_name: formData.full_name, email: formData.email, phone: formData.phone, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'ALREADY_REGISTERED') setErrors({ general: 'ALREADY_REGISTERED', email: 'Already registered' });
      else if (err.message === 'RATE_LIMIT') setErrors({ general: 'RATE_LIMIT' });
      else setErrors({ general: err.message || 'Signup failed. Please try again.' });
    } finally { setLoading(false); }
  };

  const inp = (hasErr, icon = true) => ({ width: '100%', padding: `12px 16px 12px ${icon ? '44px' : '16px'}`, border: `1.5px solid ${hasErr ? '#ef4444' : T.border}`, borderRadius: '10px', fontSize: '14px', outline: 'none', background: T.bgSoft, color: T.text, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' });

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`}</style>

      {/* LEFT — Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: 'white', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaPaperPlane size={14} color="white" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: '700', color: T.text }}>CheckTravelPrice</span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '800', color: T.text, marginBottom: '6px' }}>Create your account</h1>
          <p style={{ color: T.textMid, fontSize: '14px', marginBottom: '24px' }}>Start getting competitive travel quotes</p>

          {errors.general === 'ALREADY_REGISTERED' && (
            <div style={{ background: '#fff7ed', border: `1.5px solid ${T.accent}`, padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>Email already registered!</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '8px', background: T.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
                <button onClick={() => navigate('/forgot-password')} style={{ flex: 1, padding: '8px', background: 'white', color: T.primary, border: `1.5px solid ${T.primary}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Forgot Password</button>
              </div>
            </div>
          )}
          {errors.general === 'RATE_LIMIT' && (
            <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: '#991b1b', fontWeight: '500' }}>Too many attempts. Please wait a few minutes.</div>
          )}
          {errors.general && !['ALREADY_REGISTERED', 'RATE_LIMIT'].includes(errors.general) && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{errors.general}</div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { name: 'full_name', label: 'Full Name', placeholder: 'Rahul Sharma', type: 'text', icon: <MdPerson size={17} color={T.textLight} /> },
              { name: 'email', label: 'Email Address', placeholder: 'you@example.com', type: 'email', icon: <MdEmail size={17} color={T.textLight} /> },
            ].map(({ name, label, placeholder, type, maxLength, icon }) => (
              <div key={name} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: T.textMid }}>{label} *</label>
                <div style={{ position: 'relative', display: 'flex', gap: name === 'phone' ? '8px' : '0' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>{icon}</span>
                    <input type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} required maxLength={maxLength}
                      style={{ ...inp(errors[name]), paddingRight: name === 'phone' && otpVerified ? '44px' : undefined }}
                      onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors[name] ? '#ef4444' : T.border} />
                    {name === 'phone' && otpVerified && (
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', display: 'flex' }}>
                        <MdCheck size={18} />
                      </span>
                    )}
                  </div>
                  {name === 'phone' && !otpVerified && (
                    <button type="button" onClick={sendOtp} disabled={formData.phone.length !== 10}
                      style={{ padding: '0 16px', background: formData.phone.length === 10 ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : '#e2e8f0', color: formData.phone.length === 10 ? 'white' : '#94a3b8', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: formData.phone.length === 10 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {name === 'phone' && otpVerified && <p style={{ color: '#10b981', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>Phone verified!</p>}
                {errors[name] && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors[name]}</p>}

                {/* OTP Entry Box — shows after Send OTP clicked */}
                {name === 'phone' && otpStep && !otpVerified && (
                  <div style={{ marginTop: '12px', background: `${T.primary}06`, border: `1.5px solid ${T.primary}30`, borderRadius: '12px', padding: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: T.text, marginBottom: '10px' }}>
                      Enter the 6-digit OTP sent to +91 {formData.phone}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="tel" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setOtpError(''); }} maxLength="6" placeholder="000000"
                        style={{ flex: 1, padding: '12px 16px', border: `1.5px solid ${otpError ? '#ef4444' : T.border}`, borderRadius: '10px', fontSize: '18px', fontWeight: '700', letterSpacing: '8px', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                      <button type="button" onClick={verifyOtp} disabled={otp.length !== 6}
                        style={{ padding: '12px 20px', background: otp.length === 6 ? '#10b981' : '#e2e8f0', color: otp.length === 6 ? 'white' : '#94a3b8', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: otp.length === 6 ? 'pointer' : 'not-allowed' }}>
                        Verify
                      </button>
                    </div>
                    {otpError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{otpError}</p>}
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '11px', color: T.textLight }}>Didn't receive? 
                        {resendTimer > 0
                          ? <span style={{ color: T.textLight }}> Resend in {resendTimer}s</span>
                          : <span onClick={sendOtp} style={{ color: T.primary, cursor: 'pointer', fontWeight: '600' }}> Resend OTP</span>
                        }
                      </p>
                      <span onClick={() => { setOtpStep(false); setOtp(''); setOtpError(''); }} style={{ fontSize: '11px', color: T.textLight, cursor: 'pointer' }}>Change number</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: T.textMid }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <MdLock size={17} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Create strong password" required style={{ ...inp(errors.password), paddingRight: '44px' }}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.password ? '#ef4444' : T.border} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight, display: 'flex' }}>
                  {showPass ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                </button>
              </div>
              {errors.password ? <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p> : <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px' }}>Min 8 chars, uppercase, lowercase, number & special char</p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: T.textMid }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <MdLock size={17} color={T.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required style={inp(errors.confirmPassword)}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : T.border} />
              </div>
              {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#e0b0a0' : `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: loading ? 'none' : `0 6px 20px rgba(232,93,38,0.3)` }}>
              {loading ? 'Creating Account...' : <>Create Account <MdArrowForward size={17} /></>}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: T.textMid, marginBottom: '8px' }}>Already have an account? <Link to="/login" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Sign in</Link></p>
            <p style={{ fontSize: '14px', color: T.textMid }}>Travel agency? <Link to="/agency-signup" style={{ color: T.primary, fontWeight: '700', textDecoration: 'none' }}>Register here</Link></p>
          </div>
        </div>
      </div>

      {/* RIGHT — Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85" alt="Travel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(26,26,46,0.5) 0%, rgba(232,93,38,0.6) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Free for travelers</h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.7 }}>Post your trip once. Get quotes from 15+ verified agencies. Compare and save thousands of rupees.</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {['No hidden charges', 'Verified agencies', 'Chat directly'].map(t => (
                <span key={t} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdCheck size={13} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}