import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth middleware
// FROM

// TO
import { ProtectedRoute, GuestRoute } from './pages/Protectedroute';

// Public pages
import Home from './pages/home';

// Guest-only pages (redirect to /dashboard if already logged in)
import TravelerLogin from './pages/TravelerLogin';
import AgencyLogin from './pages/AgencyLogin';
import Signup from './pages/signup';
import AgencyRegister from './pages/AgencyRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Protected pages (require login)
import Dashboard from './pages/dashboard';
import Profile from './pages/Profile';
import Membership from './pages/Membership';
import BidInsights from './pages/BidInsights';
import Requests from './pages/Requests';
import TripDetails from './pages/TripDetails';
import Messages from './pages/Messages';
import Invoice from './pages/Invoice';
import Support from './pages/Support';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ── Public ─────────────────────────────────────────────────────── */}
          <Route path="/" element={<Home />} />

          {/* ── Guest-only (logged-in users bounce to /dashboard) ───────────── */}
          <Route path="/login"           element={<GuestRoute><TravelerLogin /></GuestRoute>} />
          <Route path="/agency-login"    element={<GuestRoute><AgencyLogin /></GuestRoute>} />
          <Route path="/signup"          element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/agency-signup"   element={<GuestRoute><AgencyRegister /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password"  element={<GuestRoute><ResetPassword /></GuestRoute>} />

          {/* ── Protected (any logged-in user) ─────────────────────────────── */}
          <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/membership-plan" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
          <Route path="/messages"        element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/invoice"         element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route path="/support"         element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/trip/:id"        element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />

          {/* ── Traveler-only ───────────────────────────────────────────────── */}
          <Route path="/my-requests"
            element={
              <ProtectedRoute userType="traveler">
                <Requests />
              </ProtectedRoute>
            }
          />

          {/* ── Agency-only ────────────────────────────────────────────────── */}
          <Route path="/bid-insights"
            element={
              <ProtectedRoute userType="agency">
                <BidInsights />
              </ProtectedRoute>
            }
          />
          <Route path="/my-lead-details"
            element={
              <ProtectedRoute userType="agency">
                <Requests />
              </ProtectedRoute>
            }
          />

          {/* ── 404 fallback ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;