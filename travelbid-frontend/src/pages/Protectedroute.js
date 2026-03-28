import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * --------------
 * Wraps any route that requires authentication.
 *
 * Behaviour:
 *  1. While AuthContext is still loading (e.g. page reload / token validation) → show
 *     a full-screen spinner so the user never sees a flash of the protected page.
 *  2. If no user is authenticated → redirect to the correct login page based on
 *     the `userType` prop ('agency' → /agency-login, default → /login).
 *     The current path is saved in `state.from` so we can redirect back after login.
 *  3. If a user IS authenticated but their user_type doesn't match the required
 *     `userType` prop → redirect to the appropriate login page.
 *  4. Otherwise → render children normally.
 *
 * Usage in App.js:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *   <Route path="/agency-login" element={<GuestRoute><AgencyLogin /></GuestRoute>} />
 */

const T = { primary: '#e85d26', accent: '#f5a623' };

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#faf9f7', fontFamily: "'DM Sans', system-ui, sans-serif",
      gap: '16px',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
      {/* Logo mark */}
      <div style={{
        width: '48px', height: '48px',
        background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
        borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 16px rgba(232,93,38,0.3)`,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
        </svg>
      </div>
      {/* Spinner ring */}
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ animation: 'spin 0.75s linear infinite' }}>
        <circle cx="18" cy="18" r="15" fill="none" stroke="#ede9e3" strokeWidth="3" />
        <path d="M18 3 a15 15 0 0 1 15 15" fill="none" stroke={T.primary} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: '14px', color: '#8888aa', fontWeight: '500', animation: 'pulse 1.5s ease-in-out infinite' }}>
        Loading your account…
      </p>
    </div>
  );
}

/**
 * ProtectedRoute — for pages that need a logged-in user.
 * @param {string}  [userType]  Optional: 'agency' | 'traveler' — enforce a specific user type.
 * @param {node}    children    The page component to render.
 */
export function ProtectedRoute({ children, userType }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Still resolving session (e.g. page reload)
  if (loading) return <Spinner />;

  // 2. Not logged in at all
  if (!user) {
    const loginPath = userType === 'agency' ? '/agency-login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 3. Wrong user type (e.g. traveler trying to access an agency-only page)
  if (userType && user.user_type !== userType) {
    const loginPath = userType === 'agency' ? '/agency-login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  // 4. All good
  return children;
}

/**
 * GuestRoute — for pages that should ONLY be visible when NOT logged in
 * (login, signup, forgot-password, reset-password).
 * Logged-in users are sent straight to /dashboard.
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

export default ProtectedRoute;