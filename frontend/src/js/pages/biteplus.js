// Bite+ Premium page entry

import { guardPrivate } from '@js/modules/guard.js';
import { initNavbar } from '@js/modules/navbar.js';
import { showToast, setButtonLoading } from '@js/modules/toast.js';
import { getProfile, updateProfile } from '@js/api/profile.js';

guardPrivate();
initNavbar('biteplus');

document.addEventListener('DOMContentLoaded', async () => {
  const { data } = await getProfile();
  const plan = data?.user?.plan ?? 'free';
  applyPlanState(plan);
});

function applyPlanState(plan) {
  const btnFree    = document.getElementById('btn-free-plan');
  const btnUpgrade = document.getElementById('btn-upgrade');
  if (!btnFree || !btnUpgrade) return;

  if (plan === 'premium') {
    // User is already premium
    btnUpgrade.textContent = 'Tu plan actual';
    btnUpgrade.disabled = true;
    btnUpgrade.classList.add('opacity-60', 'cursor-not-allowed');
    btnUpgrade.classList.remove('hover:from-amber-300', 'hover:to-amber-400');

    btnFree.textContent = 'Cambiar a Básico';
    btnFree.addEventListener('click', handleDowngrade);
  } else {
    // User is on free plan
    btnFree.disabled = true;
    btnFree.classList.add('opacity-60', 'cursor-not-allowed');
    btnUpgrade.addEventListener('click', handleUpgrade);
  }
}

async function handleUpgrade() {
  const btn = document.getElementById('btn-upgrade');
  setButtonLoading(btn, true, 'Procesando...');

  const { error } = await updateProfile({ plan: 'premium' });

  setButtonLoading(btn, false);

  if (error) {
    showToast('No se pudo completar el upgrade. Intenta de nuevo.', 'error');
    return;
  }

  showToast('¡Bienvenido a Bite+! Tu plan fue actualizado.');
  applyPlanState('premium');
}

async function handleDowngrade() {
  const btn = document.getElementById('btn-free-plan');
  setButtonLoading(btn, true, 'Procesando...');

  const { error } = await updateProfile({ plan: 'free' });

  setButtonLoading(btn, false);

  if (error) {
    showToast('No se pudo cambiar el plan. Intenta de nuevo.', 'error');
    return;
  }

  showToast('Tu plan ha sido cambiado a Básico.');
  applyPlanState('free');
}
