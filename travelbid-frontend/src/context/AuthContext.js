/**
 * src/context/AuthContext.js
 * Auth context that wraps the entire app.
 * Handles login, signup, logout, token refresh, and persisting user state.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authAPI, agenciesAPI, usersAPI,
  setTokens, clearTokens, getAccessToken,
  getErrorMessage,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // true while checking persisted session

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await authAPI.me();
        // Fetch full profile to get all fields (phone, bank, etc.)
        const profile = await fetchFullProfile(data.user_type, data.id);
        setUser({ ...data, ...profile });
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── Fetch full profile (traveler or agency) ───────────────────────────────
  const fetchFullProfile = async (userType, _id) => {
    try {
      const { data } = userType === 'agency'
        ? await agenciesAPI.me()
        : await usersAPI.me();
      return data;
    } catch {
      return {};
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, userType = null) => {
    const { data: tokens } = userType === 'agency'
      ? await authAPI.agencyLogin(email, password)
      : await authAPI.login(email, password);
    setTokens(tokens);
    // Fetch full profile
    const { data: me }      = await authAPI.me();
    const profile           = await fetchFullProfile(me.user_type, me.id);
    const fullUser          = {
      ...me,
      ...profile,
      // normalize display name
      display_name: me.user_type === 'agency' ? (profile.agency_name || me.display_name) : (profile.full_name || me.display_name),
    };
    setUser(fullUser);
    return fullUser;
  }, []);

  // ── Signup — Traveler ─────────────────────────────────────────────────────
  const signupTraveler = useCallback(async (payload) => {
    const { data: tokens } = await authAPI.signupTraveler(payload);
    setTokens(tokens);
    const { data: me }  = await authAPI.me();
    const profile       = await fetchFullProfile(me.user_type, me.id);
    const fullUser      = { ...me, ...profile, display_name: profile.full_name || payload.full_name };
    setUser(fullUser);
    return fullUser;
  }, []);

  // ── Signup — Agency ───────────────────────────────────────────────────────
  const signupAgency = useCallback(async (payload) => {
    const { data: tokens } = await authAPI.signupAgency(payload);
    setTokens(tokens);
    const { data: me }  = await authAPI.me();
    const profile       = await fetchFullProfile(me.user_type, me.id);
    const fullUser      = { ...me, ...profile, display_name: profile.agency_name || payload.agency_name };
    setUser(fullUser);
    return fullUser;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  // ── Refresh user from backend ─────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data: me } = await authAPI.me();
      const profile      = await fetchFullProfile(me.user_type, me.id);
      setUser(prev => ({ ...prev, ...me, ...profile }));
    } catch { /* ignore */ }
  }, []);

  const value = {
    user,
    setUser,        // allows Profile.js etc. to update local user after save
    loading,
    login,
    signupTraveler,
    signupAgency,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAgency:   user?.user_type === 'agency',
    isTraveler: user?.user_type === 'traveler',
  };

  // Show nothing until session is restored
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#faf9f7' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e85d26" strokeWidth="2"
            style={{ animation: 'spin 0.8s linear infinite', display: 'block', margin: '0 auto 16px' }}>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <p style={{ color: '#4a4a6a', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};