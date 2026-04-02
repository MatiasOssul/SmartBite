// Session state management
//
// NOTA DE SEGURIDAD: El token JWT se almacena en localStorage por simplicidad
// en esta versión. Para producción de alta seguridad se recomienda migrar a
// httpOnly + Secure cookies (inmune a XSS) con refresh-token flow.
// El riesgo actual es aceptable mientras el frontend no tenga XSS — la CSP
// y la ausencia de innerHTML con datos del usuario lo mitigan en gran parte.

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
  // Limpiar todas las claves conocidas del dominio
  [TOKEN_KEY, SESSION_KEY].forEach(k => localStorage.removeItem(k));
}
