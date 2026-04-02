// Profile API
//
// Endpoints:
//   GET    /api/profile                → { user: UserProfile, preferences: Preferences, payment_methods: PaymentMethod[] }
//   PUT    /api/profile                → { user: UserProfile }
//   PUT    /api/profile/preferences    → { preferences: Preferences }
//   POST   /api/profile/cards          → { card: PaymentMethod }
//   DELETE /api/profile/cards/:id      → 204

import { apiGet, apiPost, apiPut, apiDelete } from './client.js';
import { getToken } from '@js/modules/session.js';

/**
 * @typedef {object} UserProfile
 * @property {string}            id
 * @property {string}            email
 * @property {string}            name
 * @property {string}            avatar_url
 * @property {'free'|'premium'}  plan
 * @property {string}            created_at  - ISO 8601
 */

/**
 * @typedef {object} Preferences
 * @property {string[]}                                dietary_restrictions  - e.g. ['vegan', 'gluten_free']
 * @property {string[]}                                allergen_exclusions   - e.g. ['nuts', 'shellfish']
 * @property {'beginner'|'intermediate'|'advanced'}    cooking_skill
 * @property {number}                                  max_budget_clp
 */

/**
 * @typedef {object} PaymentMethod
 * @property {string}  id
 * @property {string}  last_four
 * @property {string}  brand       - 'visa' | 'mastercard' | 'amex'
 * @property {number}  exp_month
 * @property {number}  exp_year
 * @property {boolean} is_default
 */

/**
 * @typedef {object} ProfileResponse
 * @property {UserProfile}     user
 * @property {Preferences}     preferences
 * @property {PaymentMethod[]} payment_methods
 */

/** @returns {Promise<{data: ProfileResponse|null, error: object|null}>} */
export async function getProfile() {
  return apiGet('/profile');
}

/**
 * @param {Partial<UserProfile>} data
 * @returns {Promise<{data: {user: UserProfile}|null, error: object|null}>}
 */
export async function updateProfile(data) {
  return apiPut('/profile', data);
}

/**
 * @param {Partial<Preferences>} data
 * @returns {Promise<{data: {preferences: Preferences}|null, error: object|null}>}
 */
export async function updatePreferences(data) {
  return apiPut('/profile/preferences', data);
}

/**
 * @param {object} cardData
 * @returns {Promise<{data: {card: PaymentMethod}|null, error: object|null}>}
 */
export async function addPaymentCard(cardData) {
  return apiPost('/profile/cards', cardData);
}

/**
 * @param {string} cardId
 * @returns {Promise<{data: null, error: object|null}>}
 */
export async function deletePaymentCard(cardId) {
  return apiDelete(`/profile/cards/${cardId}`);
}

/**
 * @param {File} file
 * @returns {Promise<{data: {avatar_url: string}|null, error: object|null}>}
 */
export async function uploadAvatar(file) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
  const token = getToken();
  const form = new FormData();
  form.append('file', file);

  try {
    const res = await fetch(BASE_URL + '/profile/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      let message = res.statusText;
      try { message = (await res.json()).detail ?? message; } catch (_) {}
      return { data: null, error: { status: res.status, detail: message } };
    }
    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: { status: 0, detail: 'Falla de red.' } };
  }
}
