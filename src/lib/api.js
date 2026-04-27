// src/lib/api.js
const BASE = 'http://localhost:8000';

export const getToken = () => localStorage.getItem('stms_token');
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('stms_user')); } catch { return null; }
};

export async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  }
  return data.data;
}

export function openWS(onMessage, onClose) {
  const token = getToken();
  if (!token) return null;
  const ws = new WebSocket(`ws://localhost:8000/ws/traffic?token=${token}`);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
  ws.onclose = onClose || (() => {});
  ws.onerror = (e) => console.error('[WS]', e);
  return ws;
}
