import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward, MdWarning, MdBusiness } from 'react-icons/md';
import { FaBriefcase } from 'react-icons/fa';

const A = {
  primary: '#0891b2', primaryLight: '#06b6d4', accent: '#0e7490',
  text: '#1e293b', textMid: '#475569', textLight: '#94a3b8',
  border: '#e2e8f0', bgSoft: '#f8fafc',
};

export default function AgencyLogin() {
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
    if (!formData.email || !formData.password) { 
      setErrors({ general: 'Please enter your email and password' }); 
      return; 
    }
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password, "agency");
      console.log(user);
      
      // Check if user is agency
      if (user.user_type !== 'agency') {
        setErrors({ general: 'This is an agency login. Please use traveler login.' });
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message?.toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials')) setErrors({ general: 'INVALID_CREDENTIALS' });
      else if (msg.includes('rate limit') || msg.includes('too many')) setErrors({ general: 'RATE_LIMIT' });
      else setErrors({ general: err.message || 'Login failed. Please try again.' });
    } finally { 
      setLoading(false); 
    }
  };

  const inp = { 
    width: '100%', padding: '13px 16px 13px 44px', border: `1.5px solid ${A.border}`, 
    borderRadius: '10px', fontSize: '15px', outline: 'none', background: A.bgSoft, 
    color: A.text, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' 
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`}</style>

      {/* LEFT — Image with Agency Branding */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=85" alt="Business" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(8,145,178,0.9) 0%, rgba(6,182,212,0.7) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaBriefcase size={16} color="white" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: 'white' }}>CheckTravelPrice</span>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '800', color: 'white', lineHeight: 1.2, marginBottom: '16px' }}>
              Grow Your<br />Travel<br />Business
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', lineHeight: 1.7 }}>
              Connect with thousands of travelers<br />and expand your customer base.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              {[['10K+', 'Active Leads'], ['₹0', 'Commission'], ['24/7', 'Support']].map(([v, l]) => (
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
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
              borderRadius: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)'
            }}>
              <MdBusiness size={28} color="white" />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: A.text, marginBottom: '8px' }}>
              Agency Portal
            </h1>
            <p style={{ color: A.textMid, fontSize: '15px' }}>Sign in to manage your travel business</p>
          </div>

          {errors.general === 'INVALID_CREDENTIALS' && (
            <div style={{ background: '#f0f9ff', border: `1.5px solid ${A.primary}40`, padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: A.primary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdWarning size={16} /> Wrong email or password
              </p>
              <button onClick={() => navigate('/forgot-password')} style={{ fontSize: '13px', color: A.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline', padding: 0 }}>
                Forgot your password?
              </button>
            </div>
          )}
          {errors.general === 'RATE_LIMIT' && (
            <div style={{ background: '#fee2e2', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
              Too many attempts. Please wait a few minutes.
            </div>
          )}
          {errors.general && !['INVALID_CREDENTIALS', 'RATE_LIMIT'].includes(errors.general) && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: A.textMid }}>
                Business Email
              </label>
              <div style={{ position: 'relative' }}>
                <MdEmail size={18} color={A.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="agency@example.com" 
                  required 
                  style={inp}
                  onFocus={e => e.target.style.borderColor = A.primary} 
                  onBlur={e => e.target.style.borderColor = A.border} 
                />
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: A.textMid }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <MdLock size={18} color={A.textLight} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Enter your password" 
                  required 
                  style={{ ...inp, paddingRight: '48px' }}
                  onFocus={e => e.target.style.borderColor = A.primary} 
                  onBlur={e => e.target.style.borderColor = A.border} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(v => !v)} 
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: A.textLight, display: 'flex' }}
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: A.primary, textDecoration: 'none', fontWeight: '600' }}>
                Forgot Password?
              </Link>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', padding: '14px', 
                background: loading ? '#b0d8e0' : `linear-gradient(135deg, ${A.primary}, ${A.primaryLight})`, 
                color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                boxShadow: loading ? 'none' : `0 6px 20px rgba(8,145,178,0.3)`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
              }}
            >
              {loading ? 'Signing in...' : <>Sign In <MdArrowForward size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${A.border}` }}>
            <p style={{ textAlign: 'center', fontSize: '14px', color: A.textMid, marginBottom: '12px' }}>
              New agency? <Link to="/agency-signup" style={{ color: A.primary, fontWeight: '700', textDecoration: 'none' }}>Register your business</Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: '14px', color: A.textMid }}>
              Looking to travel? <Link to="/login" style={{ color: A.primary, fontWeight: '700', textDecoration: 'none' }}>Traveler login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}