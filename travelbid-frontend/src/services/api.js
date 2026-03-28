/**
 * src/services/api.js
 * Complete API client for CheckTravelPrice FastAPI backend.
 * Base URL: /api/v1
 *
 * All functions return { data, status } from axios-style responses.
 * Tokens are stored in localStorage and injected automatically.
 */

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getAccessToken  = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setTokens = ({ access_token, refresh_token }) => {
  localStorage.setItem('access_token',  access_token);
  localStorage.setItem('refresh_token', refresh_token);
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('ctp_user');
};

// ─── Error helper ─────────────────────────────────────────────────────────────

export const getErrorMessage = (err) => {
  if (!err) return 'An error occurred';
  // FastAPI validation errors come as { detail: [...] }
  const detail = err?.response?.data?.detail || err?.detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
  if (typeof detail === 'string') return detail;
  return err?.message || 'An error occurred';
};

// ─── Core fetch with auto token refresh ──────────────────────────────────────

let isRefreshing = false;
let refreshQueue = []; // queued requests while refreshing

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  refreshQueue = [];
};

async function request(path, options = {}, retry = true) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) { clearTokens(); throw new Error('Session expired. Please login again.'); }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(newToken => request(path, { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } }, false));
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!refreshRes.ok) { clearTokens(); throw new Error('Session expired. Please login again.'); }
      const newTokens = await refreshRes.json();
      setTokens(newTokens);
      processQueue(null, newTokens.access_token);
      return request(path, options, false);
    } catch (e) {
      processQueue(e, null);
      clearTokens();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(getErrorMessage({ response: { data: body } }));
    err.response = { status: res.status, data: body };
    throw err;
  }

  const data = res.status === 204 ? null : await res.json();
  return { data, status: res.status };
}

const get    = (path, params) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request(`${path}${qs}`, { method: 'GET' });
};
const post   = (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) });
const patch  = (path, body) => request(path, { method: 'PATCH',  body: JSON.stringify(body) });
const del    = (path)       => request(path, { method: 'DELETE' });


// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

export const authAPI = {
  signupTraveler: (payload) => post('/auth/signup/traveler', payload),
  signupAgency:   (payload) => post('/auth/signup/agency',   payload),
  login:          (email, password) => post('/auth/login', { email, password }),
  agencyLogin:    (email, password) => post('/auth/agency/login', { email, password }),
  refresh:        (refresh_token)   => post('/auth/refresh', { refresh_token }),
  logout:         ()                => post('/auth/logout', {}),
  me:             ()                => get('/auth/me'),
  forgotPassword: (email)           => post('/auth/forgot-password', { email }),
  resetPassword:  (token, new_password) => post('/auth/reset-password', { token, new_password }),
};


// ═══════════════════════════════════════════════════════════════════════════════
// TRIPS
// ═══════════════════════════════════════════════════════════════════════════════

export const tripsAPI = {
  // Public browse with all filters
  list: (params = {}) => get('/trips', params),

  // Traveler's own trips
  myTrips: (status) => get('/trips/my', status ? { status } : {}),

  // Single trip
  get: (id) => get(`/trips/${id}`),

  // Create (traveler)
  create: (payload) => post('/trips', payload),

  // Edit (traveler — destination locked in backend)
  update: (id, payload) => patch(`/trips/${id}`, payload),

  // Close a trip (traveler selected an agency)
  close: (id) => patch(`/trips/${id}/close`, {}),

  // Delete
  delete: (id) => del(`/trips/${id}`),
};


// ═══════════════════════════════════════════════════════════════════════════════
// BIDS
// ═══════════════════════════════════════════════════════════════════════════════

export const bidsAPI = {
  // Public — bid stats for a trip (avg / min / max)
  stats: (tripId) => get(`/bids/stats/${tripId}`),

  // Agency — place a bid
  create: (payload) => post('/bids', payload),

  // Agency — edit own bid
  update: (bidId, payload) => patch(`/bids/${bidId}`, payload),

  // Agency — withdraw bid
  delete: (bidId) => del(`/bids/${bidId}`),

  // Agency — all my bids with filters
  myBids: (params = {}) => get('/bids/my', params),

  // Agency — my bid on a specific trip
  myBidForTrip: (tripId) => get(`/bids/my/trip/${tripId}`),

  // Traveler — all bids on their trip
  forTrip: (tripId) => get(`/bids/trip/${tripId}`),

  // Traveler — mark bid as viewed
  markViewed: (bidId) => patch(`/bids/${bidId}/viewed`, {}),

  // Traveler — unlock bid after payment
  unlock: (bidId) => patch(`/bids/${bidId}/unlock`, {}),

  // Admin — full list
  list: (params = {}) => get('/bids', params),
};


// ═══════════════════════════════════════════════════════════════════════════════
// USERS (travelers)
// ═══════════════════════════════════════════════════════════════════════════════

export const usersAPI = {
  me:     ()           => get('/users/me'),
  update: (payload)    => patch('/users/me', payload),
  get:    (id)         => get(`/users/${id}`),
  list:   (params = {}) => get('/users', params),
};


// ═══════════════════════════════════════════════════════════════════════════════
// AGENCIES
// ═══════════════════════════════════════════════════════════════════════════════

export const agenciesAPI = {
  me:     ()           => get('/agencies/me'),
  update: (payload)    => patch('/agencies/me', payload),
  get:    (id)         => get(`/agencies/${id}`),
  list:   (params = {}) => get('/agencies', params),
};


// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const conversationsAPI = {
  create: (payload)    => post('/conversations', payload),
  my:     (params = {}) => get('/conversations/my', params),
  get:    (id)          => get(`/conversations/${id}`),
  list:   (params = {}) => get('/conversations', params),
  delete: (id)          => del(`/conversations/${id}`),
};


// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

export const messagesAPI = {
  send:      (payload)              => post('/messages', payload),
  forConversation: (convId, params = {}) => get(`/messages/conversation/${convId}`, params),
  markRead:  (convId)               => patch(`/messages/conversation/${convId}/read`, {}),
  delete:    (msgId)                => del(`/messages/${msgId}`),
};


// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════════════════════════════════════════

export const supportAPI = {
  create: (payload)    => post('/support', payload),
  my:     (params = {}) => get('/support/my', params),
  get:    (id)          => get(`/support/${id}`),
  update: (id, payload) => patch(`/support/${id}`, payload),
  list:   (params = {}) => get('/support', params),
  delete: (id)          => del(`/support/${id}`),
};


// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS — Razorpay lead unlock
// ═══════════════════════════════════════════════════════════════════════════════

export const paymentsAPI = {
  // Create Razorpay order to unlock a lead
  createOrder: (bidId) => post('/payments/create-order', { bid_id: bidId }),

  // Verify payment signature after checkout
  verify: (payload) => post('/payments/verify', payload),
};


// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC LEAD PRICING
// Based on bid amount — agencies pay to unlock the traveler's contact
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns the lead unlock price (in ₹) based on the bid amount.
 *
 * Quote Value      Lead Price
 * < ₹30,000        ₹100
 * ₹30k – ₹80k      ₹150
 * ₹80k – ₹2L       ₹250
 * ₹2L – ₹5L        ₹400
 * ₹5L – ₹10L       ₹600
 * ₹10L+            ₹800
 */
export const getLeadPrice = (bidAmountStr = '') => {
  // Extract numeric value from strings like "₹85,000" or "85000"
  const raw     = String(bidAmountStr).replace(/[^0-9.]/g, '');
  const amount  = parseFloat(raw) || 0;

  if (amount < 30_000)          return { price: 100,  label: '₹100',  tier: 'Starter'   };
  if (amount < 80_000)          return { price: 150,  label: '₹150',  tier: 'Standard'  };
  if (amount < 2_00_000)        return { price: 250,  label: '₹250',  tier: 'Premium'   };
  if (amount < 5_00_000)        return { price: 400,  label: '₹400',  tier: 'Elite'     };
  if (amount < 10_00_000)       return { price: 600,  label: '₹600',  tier: 'Luxury'    };
  return                               { price: 800,  label: '₹800',  tier: 'Ultra'     };
};

/**
 * Returns price in paise for Razorpay (multiply ₹ × 100).
 */
export const getLeadPriceInPaise = (bidAmountStr) =>
  getLeadPrice(bidAmountStr).price * 100;