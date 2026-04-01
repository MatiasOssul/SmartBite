// Base HTTP client
// During mockup phase all API modules return mock data and don't call this.
// When FastAPI is ready, replace mock returns in api/ files with apiGet/apiPost/apiPut calls.

import { getToken, clearSession } from '../modules/session.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    clearSession();
    window.location.replace('/index.html');
    return { data: null, error: { status: 401, message: 'Sesión expirada' } };
  }
  if (!res.ok) {
    let message = res.statusText;
    try { message = (await res.json()).detail ?? message; } catch (_) {}
    return { data: null, error: { status: res.status, message } };
  }
  const data = res.status === 204 ? null : await res.json();
  return { data, error: null };
}

async function executeFetch(fetchPromise) {
  try {
    const res = await fetchPromise;
    return await handleResponse(res);
  } catch (err) {
    console.error('Network Error:', err);
    return {
      data: null,
      error: { status: 0, message: 'Falla de red. El servidor parece estar inalcanzable.' }
    };
  }
}

export function apiGet(path) {
  return executeFetch(fetch(BASE_URL + path, { headers: authHeaders() }));
}

export function apiPost(path, body) {
  return executeFetch(fetch(BASE_URL + path, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }));
}

export function apiPut(path, body) {
  return executeFetch(fetch(BASE_URL + path, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }));
}

export function apiDelete(path) {
  return executeFetch(fetch(BASE_URL + path, {
    method: 'DELETE',
    headers: authHeaders(),
  }));
}
