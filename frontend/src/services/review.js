import { API_URL } from './api';

async function handleFetch(url, options = {}) {
  try {
    console.log('Fetching:', url, options);
    const res = await fetch(url, options);
    const json = await res.json();
    console.log('Response:', { status: res.status, ok: res.ok, json });
    if (!res.ok) return { data: null, error: json?.error || json?.message || 'Request failed' };
    return { data: json.data ?? json, error: null };
  } catch (err) {
    console.error('Fetch error:', err);
    return { data: null, error: err.message || 'Network error' };
  }
}

export const reviewService = {
  createReview: async (mouseId, reviewData, token) => {
    const url = `${API_URL}/api/reviews/${mouseId}`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(reviewData),
    };
    return handleFetch(url, options);
  },

  getMouseReviews: async (mouseId) => {
    const url = `${API_URL}/api/reviews/mouse/${mouseId}`;
    return handleFetch(url);
  },

  getUserReviews: async (userId, token) => {
    const url = `${API_URL}/api/reviews/user/${userId}`;
    const options = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
    return handleFetch(url, options);
  },

  updateReview: async (reviewId, reviewData, token) => {
    const url = `${API_URL}/api/reviews/${reviewId}`;
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(reviewData),
    };
    return handleFetch(url, options);
  },

  deleteReview: async (reviewId, token) => {
    const url = `${API_URL}/api/reviews/${reviewId}`;
    const options = { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
    return handleFetch(url, options);
  }
  ,

  // Check if current user can review this mouse (must have purchased and delivered)
  canReview: async (mouseId, token) => {
    const url = `${API_URL}/api/reviews/${mouseId}/can-review`;
    const options = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
    return handleFetch(url, options);
  },

  // Admin: get all reviews (management)
  getAllReviews: async (token) => {
    const url = `${API_URL}/api/reviews/all`;
    const options = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
    return handleFetch(url, options);
  },

  // Admin: moderate a review (approve/hide)
  moderateReview: async (reviewId, status, reason, token) => {
    const url = `${API_URL}/api/reviews/${reviewId}/moderate`;
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status, reason }),
    };
    return handleFetch(url, options);
  }
};