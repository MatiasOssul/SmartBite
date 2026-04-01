// Support / Help Center page entry
import '@styles/main.css';
import { guardPrivate } from '@js/modules/guard.js';
import { initNavbar } from '@js/modules/navbar.js';

guardPrivate();
initNavbar('support');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('support-form');
  if (!form) return;

  form.addEventListener('submit', handleSupportSubmit);
});

function handleSupportSubmit(event) {
  event.preventDefault();
  const btn     = document.getElementById('submit-btn');
  const success = document.getElementById('success-message');
  if (!btn) return;

  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
  btn.disabled = true;
  btn.classList.add('opacity-80', 'cursor-not-allowed');

  setTimeout(() => {
    success?.classList.remove('hidden');
    success?.classList.add('flex');
  }, 800);
}
