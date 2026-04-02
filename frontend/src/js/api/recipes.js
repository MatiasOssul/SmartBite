// Recipes API
//
// Endpoints:
//   POST /api/recipes/generate    → { recipes: Recipe[] }
//   GET  /api/recipes/history     → { items: Recipe[], total: number, page: number }
//   GET  /api/recipes/:id         → { recipe: Recipe }
//   POST /api/recipes/:id/save    → 201

import { apiGet, apiPost, apiDelete } from './client.js';

/**
 * @typedef {object} Ingredient
 * @property {string} id
 * @property {string} name
 * @property {number} amount
 * @property {string} unit  - 'g' | 'ml' | 'units' | 'tbsp' | 'tsp' | 'cups'
 */

/**
 * @typedef {object} NutritionalInfo
 * @property {number} calories_kcal
 * @property {number} protein_g
 * @property {number} carbs_g
 * @property {number} fat_g
 * @property {number} fiber_g
 */

/**
 * @typedef {object} Recipe
 * @property {string}                 id                - UUID v4
 * @property {string}                 title
 * @property {string}                 description
 * @property {string}                 image_url
 * @property {number}                 prep_time_minutes
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {number}                 cost_clp          - precio estimado en pesos chilenos
 * @property {number}                 match_score       - 0–100, afinidad con las preferencias del usuario
 * @property {string[]}               tags
 * @property {Ingredient[]}           ingredients
 * @property {string[]}               instructions      - pasos ordenados en español
 * @property {NutritionalInfo}        nutritional_info
 * @property {boolean}                is_favorite
 * @property {string}                 created_at        - ISO 8601
 */

/**
 * @param {string} [prompt]
 * @param {string[]} [filters]
 * @returns {Promise<{data: {recipes: Recipe[]}|null, error: object|null}>}
 */
export async function validatePrompt(prompt) {
  return apiPost('/recipes/validate', { prompt });
}

export async function generateRecipe(prompt, filters = []) {
  return apiPost('/recipes/generate', { prompt, filters });
}

/**
 * @param {number} [page]
 * @param {number} [limit]
 * @param {boolean} [favoritesOnly]
 * @param {string} [ingredient]
 * @param {boolean} [monthOnly]
 * @returns {Promise<{data: {items: Recipe[], total: number, page: number}|null, error: object|null}>}
 */
export async function getHistory(page = 1, limit = 12, favoritesOnly = false, ingredient = '', monthOnly = false) {
  const params = new URLSearchParams({ page, limit, favorites_only: favoritesOnly, month_only: monthOnly });
  if (ingredient) params.set('ingredient', ingredient);
  return apiGet(`/recipes/history?${params}`);
}

/**
 * @param {string} id
 * @returns {Promise<{data: {recipe: Recipe}|null, error: object|null}>}
 */
export async function getRecipe(id) {
  return apiGet(`/recipes/${id}`);
}

/**
 * @param {string} id
 * @returns {Promise<{data: null, error: object|null}>}
 */
export async function saveRecipe(id) {
  return apiPost(`/recipes/${id}/save`, {});
}

/**
 * @param {string} id
 * @returns {Promise<{data: null, error: object|null}>}
 */
export async function removeRecipe(id) {
  return apiDelete(`/recipes/${id}`);
}
