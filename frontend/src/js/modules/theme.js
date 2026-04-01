// Dark mode management
// applyThemeFromStorage() must be called (or inlined) before DOM paint to prevent FOUC.
// The inline <script> in each HTML <head> is the correct place for FOUC prevention;
// this module handles the runtime toggle on the profile page.

const THEME_KEY = 'smartbite_theme';

export function applyThemeFromStorage() {
  if (localStorage.getItem(THEME_KEY) === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Binds a checkbox element to the dark mode toggle.
 * @param {string} toggleId - The id of the <input type="checkbox"> element.
 */
export function initDarkModeToggle(toggleId) {
  const toggle = document.getElementById(toggleId);
  if (!toggle) return;

  // Sync initial state
  toggle.checked = document.documentElement.classList.contains('dark');

  toggle.addEventListener('change', function () {
    if (this.checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  });
}
