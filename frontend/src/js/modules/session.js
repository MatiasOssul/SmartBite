// Session state management
// Replaces the per-page localStorage routing blocks across all HTML files.

const SESSION_KEY = 'smartbite_session_state';
const TOKEN_KEY   = 'smartbite_token';

export function getSessionState() {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionState(state) {
  localStorage.setItem(SESSION_KEY, state);
}

export function isNewUser() {
  return getSessionState() === 'empty';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

