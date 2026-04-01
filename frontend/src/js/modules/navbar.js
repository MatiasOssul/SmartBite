// Navbar injection and toggle logic
// Replaces ~150 lines of duplicated navbar HTML + toggle functions across 8 pages.

import navbarHtml from '/templates/navbar.html?raw';
import { clearSession } from './session.js';
import { getCart } from './store.js';

/**
 * Injects the shared navbar into #navbar-mount, sets the active link,
 * and wires up all toggle event listeners.
 * @param {'main'|'history'|'profile'|'biteplus'|'support'} activePage
 */
export function initNavbar(activePage) {
  const mount = document.getElementById('navbar-mount');
  if (!mount) return;

  mount.innerHTML = navbarHtml;

  // Highlight active nav link (desktop)
  document.querySelectorAll('.nav-link[data-page]').forEach(el => {
    if (el.dataset.page === activePage) {
      el.classList.remove('text-slate-500', 'dark:text-slate-400');
      el.classList.add('text-brand-600');
    }
  });

  // Highlight active mobile nav link
  document.querySelectorAll('.mobile-nav-link[data-page]').forEach(el => {
    if (el.dataset.page === activePage) {
      el.classList.remove('text-slate-600', 'dark:text-slate-300');
      el.classList.add('text-brand-700', 'bg-brand-50', 'dark:bg-brand-900/30');
    }
  });

  // Wire toggle buttons
  document.getElementById('mobile-menu-btn')
    ?.addEventListener('click', toggleMobileMenu);

  document.getElementById('profile-menu-btn')
    ?.addEventListener('click', toggleProfileMenu);

  document.getElementById('notifications-btn')
    ?.addEventListener('click', e => toggleNotifications(e.currentTarget));

  // Close profile dropdown when clicking outside
  document.addEventListener('click', e => {
    const btn = document.getElementById('profile-menu-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
    }
  });

  // Logout clears session
  document.getElementById('logout-link')?.addEventListener('click', () => {
    clearSession();
  });

  // Cart badge — set on mount and keep reactive within the page
  _updateCartBadge();
  window.addEventListener('cartUpdated', _updateCartBadge);
}

function _updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCart().length;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('hidden');
}

function toggleProfileMenu() {
  const dropdown = document.getElementById('profile-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('opacity-0');
  dropdown.classList.toggle('pointer-events-none');
  dropdown.classList.toggle('-translate-y-2');
}

function toggleNotifications(btnElement) {
  const container  = btnElement.parentElement;
  const icon       = container.querySelector('.bell-icon');
  const popup      = container.querySelector('.notif-popup');
  const text       = container.querySelector('.notif-text');
  const statusIcon = popup?.querySelector('i');

  if (!icon || !popup) return;

  if (icon.classList.contains('fa-bell')) {
    icon.className = 'fa-solid fa-bell-slash text-xl text-slate-400 hover:text-slate-600 transition-all bell-icon';
    if (text) text.innerText = 'Notificaciones Desactivadas';
    if (statusIcon) statusIcon.className = 'fa-solid fa-bell-slash text-slate-400';
  } else {
    icon.className = 'fa-regular fa-bell text-xl text-brand-600 hover:text-brand-700 transition-all bell-icon';
    if (text) text.innerText = 'Notificaciones Activadas';
    if (statusIcon) statusIcon.className = 'fa-solid fa-bell text-brand-400';
  }

  popup.classList.remove('opacity-0');
  if (container.notifTimeout) clearTimeout(container.notifTimeout);
  container.notifTimeout = setTimeout(() => popup.classList.add('opacity-0'), 2500);
}
