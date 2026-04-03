// Toast notification system + button loading state utility
// Extracted from profile.html — used across authenticated pages.

let toastTimeout;

/**
 * Deshabilita/rehabilita un botón con estado de carga.
 * Guarda el HTML original en dataset para restaurarlo.
 * @param {HTMLButtonElement|null} btn
 * @param {boolean} isLoading
 * @param {string} [loadingText='Cargando...']
 */
export function setButtonLoading(btn, isLoading, loadingText = 'Cargando...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-2"></i>${loadingText}`;
    btn.disabled = true;
    btn.classList.add('opacity-80', 'cursor-not-allowed');
  } else {
    btn.innerHTML = btn.dataset.originalHtml ?? btn.innerHTML;
    btn.disabled = false;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');
  }
}

/**
 * Shows a temporary toast notification at the bottom-right.
 * Requires a #toast-notification and #toast-message element in the page.
 * @param {string} message
 * @param {'success'|'error'} type
 */
export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastMessage) return;

  const icon = toast.querySelector('i');
  if (icon) {
    icon.className = type === 'error'
      ? 'fa-solid fa-circle-exclamation text-red-400 text-xl'
      : 'fa-solid fa-circle-check text-brand-400 text-xl';
  }

  toastMessage.innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

/**
 * Wires a button to show a loading spinner, then a success toast.
 * @param {string} buttonId
 * @param {string} successMessage
 */
export function createSaveHandler(buttonId, successMessage) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', () => {
    setButtonLoading(btn, true, 'Guardando...');
    setTimeout(() => {
      setButtonLoading(btn, false);
      showToast(successMessage);
    }, 800);
  });
}
