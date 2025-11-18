import { API_URL } from './api';

async function handleFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) return { data: null, error: json?.message || json?.error || 'Request failed' };
    return { data: json.data ?? json, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Network error' };
  }
}

export const brandService = {
  getAll: async () => {
    const url = `${API_URL}/api/brands`;
    return handleFetch(url);
  },
  create: async (payload, token) => {
    const url = `${API_URL}/api/brands`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    };
    return handleFetch(url, options);
  },
  update: async (id, payload, token) => {
    const url = `${API_URL}/api/brands/${id}`;
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    };
    return handleFetch(url, options);
  },
  delete: async (id, token) => {
    const url = `${API_URL}/api/brands/${id}`;
    const options = { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
    return handleFetch(url, options);
  }
};
