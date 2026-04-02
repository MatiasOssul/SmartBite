// Support / Help Center page entry

import { guardPrivate } from '@js/modules/guard.js';
import { initNavbar } from '@js/modules/navbar.js';
import { submitTicket } from '@js/api/support.js';

guardPrivate();
initNavbar('support');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('support-form');
  if (!form) return;

  form.addEventListener('submit', handleSupportSubmit);
});

async function handleSupportSubmit(event) {
  event.preventDefault();

  const form    = event.currentTarget;
  const btn     = document.getElementById('submit-btn');
  const success = document.getElementById('success-message');
  if (!btn) return;

  const data = new FormData(form);
  const ticket = {
    category: data.get('category'),
    platform: data.get('platform'),
    subject:  data.get('subject'),
    details:  data.get('details'),
  };

  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
  btn.disabled = true;
  btn.classList.add('opacity-80', 'cursor-not-allowed');

  const { error } = await submitTicket(ticket);

  if (error) {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');

    const errEl = document.getElementById('support-error');
    if (errEl) {
      errEl.textContent = 'No se pudo enviar el mensaje. Intenta de nuevo.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  success?.classList.remove('hidden');
  success?.classList.add('flex');
}
