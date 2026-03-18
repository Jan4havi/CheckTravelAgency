import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserProfile(session.user);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({ id: authUser.id, email: authUser.email, ...profile, user_type: 'traveler' });
        setLoading(false);
        return;
      }

      const { data: agencyProfile } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (agencyProfile) {
        setUser({ id: authUser.id, email: authUser.email, ...agencyProfile, user_type: 'agency' });
        setLoading(false);
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({ id: authUser.id, email: authUser.email });
      setLoading(false);
    }
  };

  // ── FRIENDLY ERROR MESSAGES ──
  const getFriendlyError = (errorMessage) => {
    const msg = errorMessage?.toLowerCase() || '';
    if (msg.includes('user already registered') || msg.includes('already been registered') || msg.includes('duplicate') || msg.includes('already exists')) {
      return 'ALREADY_REGISTERED';
    }
    if (msg.includes('email rate limit') || msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
      return 'INVALID_CREDENTIALS';
    }
    if (msg.includes('email not confirmed')) {
      return 'EMAIL_NOT_CONFIRMED';
    }
    return errorMessage;
  };

  // ── TRAVELER SIGNUP ──
  const signup = async (userData) => {
    const { full_name, email, phone, password } = userData;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('Signup error:', error.message);
      throw new Error(getFriendlyError(error.message));
    }

    // Supabase returns user even if already registered (with identities=[])
    // This detects the "silent duplicate" case
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('ALREADY_REGISTERED');
    }

    if (!data.user) throw new Error('Signup failed — please try again');

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        full_name: full_name,
        phone: phone,
        email: email,
        user_type: 'traveler',
        membership_plan: 'Free'
      });

    if (profileError) {
      console.error('Profile insert error:', profileError.message);
      // If profile already exists, still let them in
      if (!profileError.message.includes('duplicate')) {
        throw new Error(profileError.message);
      }
    }

    setUser({
      id: data.user.id,
      email,
      full_name,
      phone,
      user_type: 'traveler',
      membership_plan: 'Free'
    });

    return data.user;
  };

  // ── AGENCY SIGNUP ──
  const agencySignup = async (userData) => {
    const { agency_name, email, phone, password, gst_number, pan_number, address, website } = userData;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('Agency signup error:', error.message);
      throw new Error(getFriendlyError(error.message));
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('ALREADY_REGISTERED');
    }

    if (!data.user) throw new Error('Signup failed — please try again');

    const { error: profileError } = await supabase
      .from('agency_profiles')
      .insert({
        id: data.user.id,
        agency_name,
        phone,
        email,
        gst_number: gst_number || null,
        pan_number: pan_number || null,
        address: address || null,
        website: website || null,
        user_type: 'agency'
      });

    if (profileError) {
      console.error('Agency profile insert error:', profileError.message);
      if (!profileError.message.includes('duplicate')) {
        throw new Error(profileError.message);
      }
    }

    setUser({
      id: data.user.id,
      email,
      agency_name,
      phone,
      user_type: 'agency',
      membership_plan: 'Free'
    });

    return data.user;
  };

  // ── LOGIN ──
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      throw new Error(getFriendlyError(error.message));
    }
    await loadUserProfile(data.user);
    return data.user;
  };

  // ── FORGOT PASSWORD — Send OTP to email ──
  const sendPasswordResetOTP = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw new Error(getFriendlyError(error.message));
  };

  // ── RESET PASSWORD with new password (after OTP verified) ──
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  // ── LOGOUT ──
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    signup,
    agencySignup,
    logout,
    sendPasswordResetOTP,
    updatePassword,
    isAuthenticated: !!user,
    isTraveler: user?.user_type === 'traveler',
    isAgency: user?.user_type === 'agency'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};