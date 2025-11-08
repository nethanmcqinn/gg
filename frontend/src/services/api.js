export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function getMice(params) {
  const res = await fetch(`${API_URL}/api/mice${buildQuery(params)}`);
  if (!res.ok) throw new Error('Failed to fetch mice');
  return res.json();
}

export async function getMouse(slug) {
  const res = await fetch(`${API_URL}/api/mice/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch mouse');
  return res.json();
}


