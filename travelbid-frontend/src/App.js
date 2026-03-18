import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Profile from './pages/Profile';
import BidInsights from './pages/BidInsights';
import Home from './pages/home';
import Signup from './pages/signup';
import AgencyRegister from './pages/AgencyRegister';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Messages from './pages/Messages';
import Invoice from './pages/Invoice';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Support from './pages/Support';
import Membership from './pages/Membership';
import Requests from './pages/Requests';
import TripDetails from './pages/TripDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/agency-signup" element={<AgencyRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/membership-plan" element={<Membership />} />
          <Route path="/bid-insights" element={<BidInsights />} />
          <Route path="/my-requests" element={<Requests />} />
          <Route path="/my-lead-details" element={<Requests />} />
          <Route path="/trip/:id" element={<TripDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;