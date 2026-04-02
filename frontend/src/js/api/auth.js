// Authentication API
//
// Endpoints:
//   POST /api/auth/login     → { token: string, user: User }
//   POST /api/auth/register  → { token: string, user: User }
//   POST /api/auth/logout    → 204
//   POST /api/auth/reset     → 200

import { apiPost, apiPut } from './client.js';
import { setSessionState, setToken, clearSession } from '../modules/session.js';

/**
 * @typedef {object} User
 * @property {string}            id         - UUID v4
 * @property {string}            email
 * @property {string}            name
 * @property {'free'|'premium'}  plan
 * @property {string}            created_at - ISO 8601
 */

/**
 * @typedef {object} AuthResponse
 * @property {string} token - JWT Bearer token
 * @property {User}   user
 */

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: AuthResponse|null, error: object|null}>}
 */
export async function login(email, password) {
  const { data, error } = await apiPost('/auth/login', { email, password });
  if (data) {
    setToken(data.token);
    setSessionState('populated');
  }
  return { data, error };
}

/**
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: AuthResponse|null, error: object|null}>}
 */
export async function register(name, email, password) {
  const { data, error } = await apiPost('/auth/register', { name, email, password });
  if (data) {
    setToken(data.token);
    setSessionState('empty');
  }
  return { data, error };
}

/** @returns {Promise<void>} */
export async function logout() {
  await apiPost('/auth/logout', {});
  clearSession();
  window.location.replace('/index.html');
}

/**
 * @param {string} email
 * @returns {Promise<{data: null, error: object|null}>}
 */
export async function requestPasswordReset(email) {
  return apiPost('/auth/reset', { email });
}

/**
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{data: {message: string}|null, error: object|null}>}
 */
export async function changePassword(currentPassword, newPassword) {
  return apiPut('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
