// Global state store
// Persisted in localStorage, reactive via CustomEvents on window.
// Dispatch pattern: window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }))

const FAVORITES_KEY = 'smartbite_favorites'; // string[]     — array de recipe IDs
const CART_KEY      = 'smartbite_cart';       // Ingredient[] — objetos completos

// ── Favoritos ────────────────────────────────────────────────────────────────

/** @returns {string[]} */
export function getFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
}

/** @param {string} recipeId */
export function isFavorite(recipeId) {
  return getFavorites().includes(recipeId);
}

/**
 * Alterna el estado favorito de una receta.
 * @param {string} recipeId
 * @returns {boolean} true si la receta quedó como favorita, false si fue removida
 */
export function toggleFavorite(recipeId) {
  const favs = getFavorites();
  const idx  = favs.indexOf(recipeId);
  if (idx === -1) favs.push(recipeId);
  else favs.splice(idx, 1);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { favorites: favs } }));
  return idx === -1; // true = se acaba de añadir
}

// ── Carrito (lista de ingredientes) ──────────────────────────────────────────

/** @returns {import('./store.js').Ingredient[]} */
export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
}

/**
 * Añade un ingrediente al carrito. No añade duplicados (por id).
 * @param {{ id: string, name: string, amount: number, unit: string }} item
 */
export function addToCart(item) {
  const cart = getCart();
  if (!cart.find(i => i.id === item.id)) cart.push(item);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

/**
 * Elimina un ingrediente del carrito por id.
 * @param {string} itemId
 */
export function removeFromCart(itemId) {
  const cart = getCart().filter(i => i.id !== itemId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

/** Vacía el carrito completamente. */
export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
}
