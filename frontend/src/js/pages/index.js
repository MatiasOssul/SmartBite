// Login / Register page entry

import '@fortawesome/fontawesome-free/css/all.min.css';
import { guardPublic } from '@js/modules/guard.js';
import { initModal } from '@js/modules/modals.js';
import { login, register } from '@js/api/auth.js';
import { showToast, setButtonLoading } from '@js/modules/toast.js';

guardPublic();

// --- Tab switching ---

function switchTab(tab) {
  const loginForm = document.getElementById('form-login');
  const regForm   = document.getElementById('form-register');
  const loginTab  = document.getElementById('tab-login');
  const regTab    = document.getElementById('tab-register');

  const isLoginCurrently = !loginForm.classList.contains('hidden');
  if ((tab === 'login' && isLoginCurrently) || (tab === 'register' && !isLoginCurrently)) return;

  loginTab.className = 'pb-3 text-lg font-bold border-b-2 px-1 transition-colors outline-none ' +
    (tab === 'login' ? 'text-brand-600 border-brand-600' : 'text-slate-400 border-transparent hover:text-slate-600');
  regTab.className = 'pb-3 text-lg font-bold border-b-2 px-1 transition-colors outline-none ' +
    (tab === 'register' ? 'text-brand-600 border-brand-600' : 'text-slate-400 border-transparent hover:text-slate-600');

  const hideForm = tab === 'login' ? regForm : loginForm;
  const showForm = tab === 'login' ? loginForm : regForm;

  const dirOut = tab === 'login' ? 'translate-x-4' : '-translate-x-4';
  const dirIn  = tab === 'login' ? '-translate-x-2' : 'translate-x-2';

  hideForm.classList.remove('translate-x-0', 'opacity-100');
  hideForm.classList.add('opacity-0', dirOut);

  setTimeout(() => {
    hideForm.classList.add('hidden');
    showForm.classList.remove('hidden');
    showForm.classList.remove('translate-x-0', 'opacity-100');
    showForm.classList.add('opacity-0', dirIn);
    void showForm.offsetWidth;
    showForm.classList.remove('opacity-0', dirIn);
    showForm.classList.add('opacity-100', 'translate-x-0');
  }, 500);
}

// --- Auth form submission ---

async function handleAuth(event) {
  event.preventDefault();
  const isLogin = !document.getElementById('form-login').classList.contains('hidden');

  let email, password, name, errorEl;
  let isValid = true;

  if (isLogin) {
    email    = document.getElementById('login-email').value;
    password = document.getElementById('login-password').value;
    errorEl  = document.getElementById('login-error');
    if (!email || !password) {
      errorEl.classList.remove('hidden');
      isValid = false;
    } else {
      errorEl.classList.add('hidden');
    }
  } else {
    name     = document.getElementById('reg-name').value;
    email    = document.getElementById('reg-email').value;
    password = document.getElementById('reg-password').value;
    errorEl  = document.getElementById('register-error');
    if (!name || !email || !password) {
      errorEl.classList.remove('hidden');
      isValid = false;
    } else {
      errorEl.classList.add('hidden');
    }
  }

  if (!isValid) return;

  const form = isLogin
    ? document.getElementById('form-login')
    : document.getElementById('form-register');
  const btn = form.querySelector('[type="submit"]');

  setButtonLoading(btn, true, isLogin ? 'Entrando...' : 'Registrando...');
  const result = isLogin
    ? await login(email, password)
    : await register(name, email, password);
  setButtonLoading(btn, false);

  if (result.error) {
    showToast(result.error.message ?? 'Error de conexión', 'error');
    if (errorEl) {
      const msg = result.error.message ?? 'Error al iniciar sesión.';
      errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
      errorEl.classList.remove('hidden');
    }
    return;
  }

  // Navigate after successful auth
  window.location.replace('/main.html');
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  // Tab buttons
  document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));

  // Forms
  document.getElementById('form-login')?.addEventListener('submit', handleAuth);
  document.getElementById('form-register')?.addEventListener('submit', handleAuth);

  // Forgot password modal
  initModal({
    modalId:     'forgot-modal',
    contentId:   'forgot-content',
    openBtnIds:  ['forgot-btn'],
    closeBtnIds: ['close-forgot-btn', 'cancel-forgot-btn'],
    backdropId:  'forgot-backdrop',
  });
});
