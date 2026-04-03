// Profile page entry

import { guardPrivate } from '@js/modules/guard.js';
import { initNavbar } from '@js/modules/navbar.js';
import { initDarkModeToggle } from '@js/modules/theme.js';
import { showToast, setButtonLoading } from '@js/modules/toast.js';
import { initModal } from '@js/modules/modals.js';

import { getProfile, updateProfile, updatePreferences, uploadAvatar, addPaymentCard, deletePaymentCard, setDefaultPaymentCard } from '@js/api/profile.js';
import { getHistory } from '@js/api/recipes.js';
import { changePassword } from '@js/api/auth.js';

guardPrivate();
initNavbar('profile');

document.addEventListener('DOMContentLoaded', async () => {
  // Dark mode toggle
  initDarkModeToggle('dark-mode-toggle');

  // Card actions (event delegation — attach once)
  setupCardActions();

  // Budget slider — live label update
  const slider  = document.getElementById('pref-budget-slider');
  const display = document.getElementById('pref-budget-display');
  if (slider && display) {
    slider.addEventListener('input', () => {
      display.textContent = '$' + Number(slider.value).toLocaleString('es-CL');
    });
  }

  // Add Card modal
  initModal({
    modalId:     'add-card-modal',
    contentId:   'modal-content',
    openBtnIds:  ['add-card-btn'],
    closeBtnIds: ['close-modal-btn', 'cancel-modal-btn'],
    backdropId:  'modal-backdrop',
  });

  // CVC: solo dígitos en tiempo real
  document.getElementById('card-cvc')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  // Change Password modal
  initModal({
    modalId:     'pwd-modal',
    contentId:   'pwd-content',
    openBtnIds:  ['change-pwd-btn'],
    closeBtnIds: ['close-pwd-btn', 'cancel-pwd-btn'],
    backdropId:  'pwd-backdrop',
  });

  // ── Fetch real data ──────────────────────────────────────────────────────────
  try {
    const { data: profile } = await getProfile();
    const { data: historyRes } = await getHistory();

    if (profile) {
      // Avatar
      const avatarImg = document.getElementById('avatar-img');
      if (avatarImg) {
        avatarImg.src = profile.user.avatar_url
          || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.user.name) + '&background=16a34a&color=fff&size=150';
      }

      // General info
      const nameInput = document.getElementById('profile-name-input');
      if (nameInput) nameInput.value = profile.user.name;

      const emailInput = document.getElementById('profile-email-input');
      if (emailInput) emailInput.value = profile.user.email;

      // Preferences
      const prefs = profile.preferences;
      if (prefs) {
        const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        setCheck('pref-gluten_free', prefs.dietary_restrictions.includes('gluten_free'));
        setCheck('pref-vegetarian',  prefs.dietary_restrictions.includes('vegetarian'));
        setCheck('pref-vegan',       prefs.dietary_restrictions.includes('vegan'));
        setCheck('pref-keto',        prefs.dietary_restrictions.includes('keto'));

        const alg = document.getElementById('pref-allergens');
        if (alg) alg.value = prefs.allergen_exclusions.join(', ');

        // Budget slider
        if (slider && display && prefs.max_budget_clp) {
          slider.value = prefs.max_budget_clp;
          display.textContent = '$' + Number(prefs.max_budget_clp).toLocaleString('es-CL');
        }
      }

      renderPaymentMethods(profile.payment_methods);

      // Plan section
      const isPro = profile.user.plan === 'premium';
      document.getElementById(isPro ? 'plan-pro' : 'plan-free')?.classList.remove('hidden');
    }

    // History section
    const historyEmpty     = document.getElementById('history-empty');
    const historyPopulated = document.getElementById('history-populated');

    if (!historyRes?.items?.length) {
      historyPopulated?.classList.add('hidden');
      historyEmpty?.classList.remove('hidden');
    } else {
      historyEmpty?.classList.add('hidden');
      historyPopulated?.classList.remove('hidden');
      renderHistoryShort(historyRes.items.slice(0, 2), historyPopulated);
    }
  } catch (err) {
    console.error('Error cargando perfil:', err);
  } finally {
    // ── Skeleton → real profile (always runs) ────────────────────────────────
    const realProfile     = document.getElementById('real-profile');
    const skeletonProfile = document.getElementById('skeleton-profile');
    if (realProfile && skeletonProfile) {
      skeletonProfile.classList.add('hidden');
      realProfile.classList.remove('hidden');
    }
  }

  // ── Cancel plan ──────────────────────────────────────────────────────────────
  document.getElementById('cancel-plan-btn')?.addEventListener('click', () => {
    const confirmed = confirm(
      '¿Estás seguro de que quieres cancelar tu suscripción Bite+ Pro?\n\nSeguirás teniendo acceso hasta el final del período ya pagado.'
    );
    if (!confirmed) return;
    showToast('Suscripción cancelada. Tu acceso Pro se mantendrá hasta el fin del período actual.', 'error');
    // Actualizar UI sin recargar
    document.getElementById('plan-pro')?.classList.add('hidden');
    document.getElementById('plan-free')?.classList.remove('hidden');
  });

  // ── Avatar upload ────────────────────────────────────────────────────────────
  const avatarBtn       = document.getElementById('avatar-btn');
  const avatarInput     = document.getElementById('avatar-input');
  const avatarImgEl     = document.getElementById('avatar-img');
  const avatarContainer = document.getElementById('avatar-container');

  avatarBtn?.addEventListener('click', () => avatarInput?.click());
  avatarContainer?.addEventListener('click', () => avatarInput?.click());

  avatarInput?.addEventListener('change', async () => {
    const file = avatarInput.files?.[0];
    if (!file) return;

    // Optimistic preview
    const previewUrl = URL.createObjectURL(file);
    const previous   = avatarImgEl?.src;
    if (avatarImgEl) avatarImgEl.src = previewUrl;

    setButtonLoading(avatarBtn, true, 'Subiendo...');
    const { data, error } = await uploadAvatar(file);
    setButtonLoading(avatarBtn, false);

    URL.revokeObjectURL(previewUrl);

    if (error) {
      showToast(error.detail ?? 'Error al subir la imagen', 'error');
      if (avatarImgEl) avatarImgEl.src = previous || '';
    } else {
      if (avatarImgEl) avatarImgEl.src = data.avatar_url;
      showToast('Avatar actualizado correctamente');
    }

    avatarInput.value = '';
  });

  // ── Save Profile button (real API call) ──────────────────────────────────────
  const saveProfileBtn = document.getElementById('save-profile-btn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      const name = document.getElementById('profile-name-input')?.value?.trim();
      if (!name) { showToast('El nombre no puede estar vacío', 'error'); return; }

      setButtonLoading(saveProfileBtn, true, 'Guardando...');
      const { error } = await updateProfile({ name });
      setButtonLoading(saveProfileBtn, false);

      showToast(error ? (error.message ?? 'Error al guardar') : '¡Tu perfil ha sido actualizado!',
                error ? 'error' : 'success');
    });
  }

  // ── Save Preferences button (real API call) ──────────────────────────────────
  const savePrefsBtn = document.getElementById('save-preferences-btn');
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', async () => {
      // Collect dietary restrictions
      const dietary_restrictions = [];
      if (document.getElementById('pref-gluten_free')?.checked) dietary_restrictions.push('gluten_free');
      if (document.getElementById('pref-vegetarian')?.checked)  dietary_restrictions.push('vegetarian');
      if (document.getElementById('pref-vegan')?.checked)       dietary_restrictions.push('vegan');
      if (document.getElementById('pref-keto')?.checked)        dietary_restrictions.push('keto');

      // Allergens: split by comma, trim, remove empty
      const rawAlg = document.getElementById('pref-allergens')?.value ?? '';
      const allergen_exclusions = rawAlg.split(',').map(s => s.trim()).filter(Boolean);

      // Budget from slider
      const max_budget_clp = slider ? Number(slider.value) : undefined;

      setButtonLoading(savePrefsBtn, true, 'Guardando...');
      const { error } = await updatePreferences({ dietary_restrictions, allergen_exclusions, max_budget_clp });
      setButtonLoading(savePrefsBtn, false);

      showToast(error ? (error.message ?? 'Error al guardar') : '¡Tus preferencias han sido guardadas!',
                error ? 'error' : 'success');
    });
  }

  // ── Change Password modal ──────────────────────────────────────────
  const submitPwdBtn = document.getElementById('submit-pwd-btn');
  if (submitPwdBtn) {
    submitPwdBtn.addEventListener('click', async () => {
      const currentPwd = document.getElementById('pwd-current')?.value ?? '';
      const newPwd     = document.getElementById('pwd-new')?.value ?? '';
      const confirmPwd = document.getElementById('pwd-confirm')?.value ?? '';
      const errorEl    = document.getElementById('pwd-error');

      const showError = (msg) => { if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } };
      const clearError = () => errorEl?.classList.add('hidden');
      clearError();

      if (!currentPwd || !newPwd || !confirmPwd) { showError('Completa todos los campos.'); return; }
      if (newPwd.length < 8) { showError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
      if (newPwd !== confirmPwd) { showError('Las contraseñas nuevas no coinciden.'); return; }

      setButtonLoading(submitPwdBtn, true, 'Actualizando...');
      const { error } = await changePassword(currentPwd, newPwd);
      setButtonLoading(submitPwdBtn, false);

      if (error) { showError(error.message ?? 'Error al cambiar la contraseña'); return; }

      // Éxito: limpiar campos + cerrar modal
      ['pwd-current', 'pwd-new', 'pwd-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      clearError();
      document.getElementById('close-pwd-btn')?.click();
      showToast('¡Contraseña actualizada correctamente!', 'success');
    });
  }

  // ── Add Payment Card modal ───────────────────────────────────────────
  const submitCardBtn = document.getElementById('submit-card-btn');
  if (submitCardBtn) {
    submitCardBtn.addEventListener('click', async () => {
      const nameEl   = document.getElementById('card-name');
      const numberEl = document.getElementById('card-number');
      const expEl    = document.getElementById('card-exp');
      const cvcEl    = document.getElementById('card-cvc');
      const defaultEl= document.getElementById('card-default');
      const errorEl  = document.getElementById('card-error');

      const showError = (msg) => { if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } };
      const clearError = () => errorEl?.classList.add('hidden');
      clearError();

      const numVal = (numberEl?.value || '').replace(/\s+/g, '');
      const expVal = (expEl?.value || '').trim();
      const cvcVal = (cvcEl?.value || '').trim();

      if (!nameEl?.value.trim() || !numVal || !expVal || !cvcVal) {
        return showError('Por favor, completa todos los campos.');
      }
      if (!/^\d{16}$/.test(numVal)) {
        return showError('El número de tarjeta debe tener exactamente 16 dígitos.');
      }
      if (!/^\d{3}$/.test(cvcVal)) {
        return showError('El CVC debe tener exactamente 3 dígitos numéricos.');
      }
      if (!/^\d{2}\/\d{2}$/.test(expVal)) {
        return showError('La fecha de vencimiento debe tener el formato MM/AA.');
      }
      const [mm, yy] = expVal.split('/');
      const month = parseInt(mm, 10);
      const year = parseInt('20' + yy, 10);
      if (month < 1 || month > 12) {
        return showError('Mes inválido.');
      }
      const now = new Date();
      const expDate = new Date(year, month, 1); // primer día del mes siguiente a la expiración
      if (expDate <= new Date(now.getFullYear(), now.getMonth(), 1)) {
        return showError('La tarjeta está vencida.');
      }

      // Infer brand from first digit
      let brand = 'visa';
      if (numVal.startsWith('5')) brand = 'mastercard';
      if (numVal.startsWith('3')) brand = 'amex';

      const payload = {
        last_four: numVal.slice(-4),
        brand,
        exp_month: month,
        exp_year: year,
        is_default: !!defaultEl?.checked
      };

      setButtonLoading(submitCardBtn, true, 'Añadiendo...');
      const { data, error } = await addPaymentCard(payload);
      setButtonLoading(submitCardBtn, false);

      if (error) {
        return showError(error.detail ?? error.message ?? 'Error al añadir tarjeta');
      }

      // Limpiar campos
      [nameEl, numberEl, expEl, cvcEl].forEach(el => el.value = '');
      if (defaultEl) defaultEl.checked = false;
      document.getElementById('close-modal-btn')?.click();
      showToast('¡Tarjeta añadida exitosamente!', 'success');

      // Refresh data
      getProfile().then(({ data }) => {
         if (data?.payment_methods) renderPaymentMethods(data.payment_methods);
      });
    });
  }
});

// ── Render helpers ────────────────────────────────────────────────────────────

let _paymentMethods = [];

function renderPaymentMethods(methods) {
  const grid = document.getElementById('payment-methods-grid');
  if (!grid) return;

  _paymentMethods = methods || [];

  if (_paymentMethods.length === 0) {
    grid.innerHTML = '<p class="text-sm text-slate-500 col-span-2">No tienes métodos de pago guardados.</p>';
    return;
  }

  const BRAND_ICONS = {
    visa:       '<i class="fa-brands fa-cc-visa text-2xl text-blue-800"></i>',
    mastercard: '<i class="fa-brands fa-cc-mastercard text-2xl text-orange-500"></i>',
    amex:       '<i class="fa-brands fa-cc-amex text-2xl text-cyan-600"></i>',
  };

  grid.innerHTML = _paymentMethods.map(pm => `
    <div class="border ${pm.is_default ? 'border-brand-200 bg-brand-50/50' : 'border-slate-200 bg-white hover:border-slate-300'} p-4 rounded-2xl flex flex-col gap-2 group transition-colors dark:border-slate-700 dark:bg-slate-900">
      <div class="flex items-center gap-4">
        <div class="w-12 h-8 flex-shrink-0 bg-white rounded border border-slate-200 flex items-center justify-center p-1 dark:bg-slate-900 dark:border-slate-700">
          ${BRAND_ICONS[pm.brand] || '<i class="fa-regular fa-credit-card text-2xl text-slate-500"></i>'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 dark:text-slate-100 capitalize">${pm.brand} terminada en ${pm.last_four}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Expira ${pm.exp_month}/${String(pm.exp_year).slice(-2)}</p>
        </div>
        <div class="flex-shrink-0 flex items-center gap-2">
          ${pm.is_default ? '<span class="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Predeterminada</span>' : ''}
          <button data-action="delete" data-card-id="${pm.id}" class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 dark:text-slate-500"><i class="fa-solid fa-trash pointer-events-none"></i></button>
        </div>
      </div>
      ${!pm.is_default ? `
      <div class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button data-action="set-default" data-card-id="${pm.id}" class="text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400">Hacer predeterminada</button>
      </div>` : ''}
    </div>
  `).join('');
}

function setupCardActions() {
  const grid = document.getElementById('payment-methods-grid');
  if (!grid) return;

  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const cardId = btn.dataset.cardId;
    const action = btn.dataset.action;

    if (action === 'delete') {
      btn.disabled = true;
      const { error } = await deletePaymentCard(cardId);
      if (error) {
        btn.disabled = false;
        showToast(error.detail ?? 'Error al eliminar la tarjeta', 'error');
        return;
      }
      renderPaymentMethods(_paymentMethods.filter(pm => pm.id !== cardId));
      showToast('Tarjeta eliminada correctamente', 'success');
    }

    if (action === 'set-default') {
      btn.disabled = true;
      const { data, error } = await setDefaultPaymentCard(cardId);
      if (error) {
        btn.disabled = false;
        showToast(error.detail ?? error.message ?? 'Error al actualizar tarjeta predeterminada', 'error');
        return;
      }
      renderPaymentMethods(data.payment_methods);
      showToast('Tarjeta predeterminada actualizada', 'success');
    }
  });
}

function renderHistoryShort(items, container) {
  if (!items) return;
  container.innerHTML = items.map(recipe => `
    <div class="border border-slate-100 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-md transition-shadow dark:border-slate-800" onclick="window.location.href='/history.html'">
      <div class="h-32 w-full overflow-hidden">
        <img src="${recipe.image_url}" alt="${recipe.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
      </div>
      <div class="p-4 bg-white dark:bg-slate-900">
        <span class="text-xs text-slate-400 font-semibold mb-1 block dark:text-slate-500">Completada</span>
        <h3 class="font-bold text-slate-800 line-clamp-1 dark:text-slate-100">${recipe.title}</h3>
        <div class="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span><i class="fa-solid fa-clock"></i> ${recipe.prep_time_minutes}m</span>
          <span><i class="fa-solid fa-basket-shopping text-brand-500"></i> $${Math.round(recipe.cost_clp / 1000)}k</span>
        </div>
      </div>
    </div>`).join('');
}
