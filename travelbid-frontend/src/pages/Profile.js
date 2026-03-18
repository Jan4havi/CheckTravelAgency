import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import TopNav from './TopNav';
import { MdPerson, MdEmail, MdPhone, MdBusiness, MdCreditCard, MdAccountBalance, MdEdit, MdCheck, MdClose, MdUploadFile, MdInfo } from 'react-icons/md';

const T = { primary: '#e85d26', primaryLight: '#ff7d4d', accent: '#f5a623', text: '#1a1a2e', textMid: '#4a4a6a', textLight: '#8888aa', bg: '#faf9f7', border: '#ede9e3' };
const css = document.createElement('style');
css.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`;
document.head.appendChild(css);

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [panFront, setPanFront] = useState(null);
  const [panBack, setPanBack] = useState(null);
  const isAgency = user?.user_type === 'agency';

  const [form, setForm] = useState({
    email: '', phone: '', gst_number: '', pan_number: '', address: '', website: '',
    bankName: '', accountNumber: '', ifscCode: '', accountHolder: '', bankPhone: '',
    aadhaarFront: null, aadhaarBack: null,
  });

  useEffect(() => {
    if (user) setForm({
      email: user.email || '',
      phone: user.phone || '',
      gst_number: user.gst_number || '',
      pan_number: user.pan_number || '',
      address: user.address || '',
      website: user.website || '',
      bankName: user.bank_name || user.bankName || '',
      accountNumber: user.account_number || user.accountNumber || '',
      ifscCode: user.ifsc_code || user.ifscCode || '',
      accountHolder: user.account_holder || user.accountHolder || '',
      bankPhone: user.bank_phone || user.bankPhone || '',
      aadhaarFront: null,
      aadhaarBack: null,
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isAgency) {
        const d = {
          phone: form.phone, gst_number: form.gst_number, pan_number: form.pan_number,
          address: form.address, website: form.website, bank_name: form.bankName,
          account_number: form.accountNumber, ifsc_code: form.ifscCode,
          account_holder: form.accountHolder, bank_phone: form.bankPhone,
        };
        const { error } = await supabase.from('agency_profiles').update(d).eq('id', user.id);
        if (error) throw error;
        setUser({ ...user, ...d });
      } else {
        const d = { phone: form.phone, email: form.email };
        const { error } = await supabase.from('user_profiles').update(d).eq('id', user.id);
        if (error) throw error;
        setUser({ ...user, ...d });
      }
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (e) { console.error(e); alert('Failed to save profile.'); } finally { setSaving(false); }
  };

  const inp = (editable = isEditing) => ({
    width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: '10px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    background: editable ? 'white' : T.bg, color: editable ? T.text : T.textMid, transition: 'border-color 0.2s',
  });

  const lbl = { display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.5px' };

  const SectionHeader = ({ icon, title, required }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: '36px', height: '36px', background: `${T.primary}12`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>{icon}</div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: T.text, flex: 1 }}>{title}</h3>
      {required && (
        <span style={{ fontSize: '11px', background: '#fff7ed', color: '#d97706', border: '1px solid #fed7aa', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', whiteSpace: 'nowrap' }}>
          Required to bid
        </span>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh', paddingTop: '64px' }}>
      <TopNav activePage="Profile" />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 32px', animation: 'fadeUp 0.5s ease' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MdPerson size={30} color={T.primary} /> Profile
            </h1>
            <p style={{ color: T.textMid }}>Manage your account information</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)}
              style={{ padding: '10px 24px', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 12px rgba(232,93,38,0.3)` }}>
              <MdEdit size={16} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px 24px', background: saving ? '#ccc' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdCheck size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setIsEditing(false)}
                style={{ padding: '10px 20px', background: 'white', color: T.textMid, border: `1.5px solid ${T.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdClose size={16} /> Cancel
              </button>
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

          {/* Gradient header strip */}
          <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, padding: '28px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '68px', height: '68px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', color: 'white', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
              {isAgency ? user?.agency_name?.charAt(0) : user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>
                {isAgency ? user?.agency_name : user?.full_name || 'User'}
              </h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isAgency ? <><MdBusiness size={12} /> Agency</> : <><MdPerson size={12} /> Traveler</>}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                  {user?.membership_plan || 'Free'} Plan
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '36px 40px' }}>

            {/* ── BASIC INFO ── */}
            <div style={{ marginBottom: '32px' }}>
              <SectionHeader icon={<MdPerson size={18} />} title="Basic Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={lbl}>{isAgency ? 'Agency Name' : 'Full Name'}</label>
                  <input type="text" value={isAgency ? user?.agency_name || '' : user?.full_name || ''} disabled
                    style={{ ...inp(false), cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px' }}>Cannot be changed</p>
                </div>
                <div>
                  <label style={lbl}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdEmail size={12} /> Email</span></label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    disabled={!isEditing || isAgency} style={inp(!isEditing || isAgency ? false : true)}
                    onFocus={e => { if (isEditing && !isAgency) e.target.style.borderColor = T.primary; }}
                    onBlur={e => e.target.style.borderColor = T.border} />
                </div>
                <div>
                  <label style={lbl}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdPhone size={12} /> Phone Number</span></label>
                  <input type="tel" value={form.phone}
                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setForm({ ...form, phone: v }); }}
                    disabled={!isEditing} maxLength="10" placeholder="9876543210" style={inp()}
                    onFocus={e => { if (isEditing) e.target.style.borderColor = T.primary; }}
                    onBlur={e => e.target.style.borderColor = T.border} />
                </div>
              </div>
            </div>

            {/* ── AADHAAR — Traveler only ── */}
            {!isAgency && (
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '32px', marginBottom: '32px' }}>
                <SectionHeader icon={<MdCreditCard size={18} />} title="Aadhaar Card" />
                <p style={{ fontSize: '13px', color: T.textMid, marginBottom: '20px', lineHeight: 1.6 }}>
                  Upload your Aadhaar card for identity verification. Kept private, used for verification only.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {[
                    { label: 'Front Side', key: 'aadhaarFront' },
                    { label: 'Back Side', key: 'aadhaarBack' },
                  ].map(({ label, key }) => {
                    const imgSrc = form[key];
                    return (
                      <div key={label}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: T.textMid, marginBottom: '8px', textTransform: 'uppercase' }}>{label}</p>
                        {imgSrc ? (
                          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                            <img src={imgSrc} alt={label} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            {isEditing && (
                              <button onClick={() => setForm({ ...form, [key]: null })}
                                style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdClose size={16} />
                              </button>
                            )}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16,185,129,0.9)', padding: '6px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <MdCheck size={14} color="white" />
                              <span style={{ fontSize: '12px', color: 'white', fontWeight: '700' }}>Uploaded</span>
                            </div>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', border: `2px dashed ${isEditing ? T.primary : T.border}`, borderRadius: '12px', cursor: isEditing ? 'pointer' : 'not-allowed', background: isEditing ? `${T.primary}04` : T.bg }}>
                            <MdUploadFile size={36} color={isEditing ? T.primary : T.textLight} />
                            <p style={{ marginTop: '10px', fontSize: '13px', color: isEditing ? T.primary : T.textLight, fontWeight: '600' }}>{isEditing ? 'Click to upload' : 'Not uploaded'}</p>
                            <p style={{ fontSize: '11px', color: T.textLight, marginTop: '4px' }}>JPG, PNG up to 5MB</p>
                            <input type="file" accept="image/*" disabled={!isEditing}
                              onChange={e => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onloadend = () => setForm({ ...form, [key]: r.result }); r.readAsDataURL(file); } }}
                              style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── AGENCY SECTIONS ── */}
            {isAgency && (
              <>
                {/* Business Details */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '32px', marginBottom: '32px' }}>
                  <SectionHeader icon={<MdBusiness size={18} />} title="Business Details" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={lbl}>GST Number</label>
                      <input type="text" value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                        disabled={!isEditing} placeholder="22AAAAA0000A1Z5" maxLength="15"
                        style={{ ...inp(), textTransform: 'uppercase' }}
                        onFocus={e => { if (isEditing) e.target.style.borderColor = T.primary; }}
                        onBlur={e => e.target.style.borderColor = T.border} />
                    </div>
                    <div>
                      <label style={lbl}>PAN Number</label>
                      <input type="text" value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                        disabled={!isEditing} placeholder="ABCDE1234F" maxLength="10"
                        style={{ ...inp(), textTransform: 'uppercase' }}
                        onFocus={e => { if (isEditing) e.target.style.borderColor = T.primary; }}
                        onBlur={e => e.target.style.borderColor = T.border} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Business Address</label>
                      <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                        disabled={!isEditing} placeholder="Complete business address" rows="3"
                        style={{ ...inp(), resize: 'vertical' }}
                        onFocus={e => { if (isEditing) e.target.style.borderColor = T.primary; }}
                        onBlur={e => e.target.style.borderColor = T.border} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Website *</label>
                      <input type="text" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                        disabled={!isEditing} placeholder="https://yourwebsite.com" style={inp()}
                        onFocus={e => { if (isEditing) e.target.style.borderColor = T.primary; }}
                        onBlur={e => e.target.style.borderColor = T.border} />
                    </div>
                  </div>
                </div>

                {/* PAN Card Upload */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '32px', marginBottom: '32px' }}>
                  <SectionHeader icon={<MdCreditCard size={18} />} title="PAN Card Copy" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {[
                      { label: 'Front Side', img: panFront, onChange: e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setPanFront(r.result); r.readAsDataURL(f); } }, onRemove: () => setPanFront(null) },
                      { label: 'Back Side', img: panBack, onChange: e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setPanBack(r.result); r.readAsDataURL(f); } }, onRemove: () => setPanBack(null) },
                    ].map(({ label, img, onChange, onRemove }) => (
                      <div key={label}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: T.textMid, marginBottom: '8px', textTransform: 'uppercase' }}>{label}</p>
                        {img ? (
                          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                            <img src={img} alt={label} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            {isEditing && (
                              <button onClick={onRemove} style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdClose size={16} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', border: `2px dashed ${T.border}`, borderRadius: '12px', cursor: isEditing ? 'pointer' : 'not-allowed', background: isEditing ? 'white' : T.bg }}
                            onMouseEnter={e => { if (isEditing) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = `${T.primary}05`; } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = isEditing ? 'white' : T.bg; }}>
                            <MdUploadFile size={36} color={T.textLight} />
                            <p style={{ marginTop: '10px', fontSize: '13px', color: T.textLight, fontWeight: '600' }}>{isEditing ? 'Click to upload' : 'No image'}</p>
                            <input type="file" accept="image/*" onChange={onChange} disabled={!isEditing} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Account Details — REQUIRED */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '32px' }}>
                  <SectionHeader icon={<MdAccountBalance size={18} />} title="Bank Account Details" required />

                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdInfo size={18} color="#d97706" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', color: '#92400e', margin: 0, fontWeight: '600' }}>
                      Bank details are required for verification.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {[
                      { key: 'bankName', label: 'Bank Name *', ph: 'State Bank of India' },
                      { key: 'accountHolder', label: 'Account Holder Name *', ph: 'Name as per bank' },
                      { key: 'accountNumber', label: 'Account Number *', ph: 'XXXXXXXXXXXX' },
                      { key: 'ifscCode', label: 'IFSC Code *', ph: 'SBIN0001234', upper: true },
                      { key: 'bankPhone', label: 'Bank Linked Phone *', ph: '9876543210', numeric: true },
                    ].map(({ key, label, ph, upper, numeric }) => (
                      <div key={key}>
                        <label style={lbl}>{label}</label>
                        <input
                          type={numeric ? 'tel' : 'text'}
                          value={form[key]}
                          disabled={!isEditing}
                          placeholder={ph}
                          onChange={e => {
                            if (numeric) { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setForm({ ...form, [key]: v }); }
                            else if (upper) setForm({ ...form, [key]: e.target.value.toUpperCase() });
                            else setForm({ ...form, [key]: e.target.value });
                          }}
                          style={{ ...inp(), textTransform: upper ? 'uppercase' : 'none' }}
                          onFocus={e => { if (isEditing) e.target.style.borderColor = T.primary; }}
                          onBlur={e => e.target.style.borderColor = T.border}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}