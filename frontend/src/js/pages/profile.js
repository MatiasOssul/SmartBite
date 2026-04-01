// Profile page entry
import '@styles/main.css';
import { guardPrivate } from '@js/modules/guard.js';
import { isNewUser } from '@js/modules/session.js';
import { initNavbar } from '@js/modules/navbar.js';
import { initDarkModeToggle } from '@js/modules/theme.js';
import { createSaveHandler } from '@js/modules/toast.js';
import { initModal } from '@js/modules/modals.js';

import { getProfile } from '@js/api/profile.js';
import { getHistory } from '@js/api/recipes.js';

guardPrivate();
initNavbar('profile');

document.addEventListener('DOMContentLoaded', async () => {
  // Dark mode toggle
  initDarkModeToggle('dark-mode-toggle');

  // Save buttons
  createSaveHandler('save-profile-btn',      '¡Tu perfil ha sido actualizado!');
  createSaveHandler('save-preferences-btn',  '¡Tus preferencias han sido guardadas!');

  // Add Card modal
  initModal({
    modalId:     'add-card-modal',
    contentId:   'modal-content',
    openBtnIds:  ['add-card-btn'],
    closeBtnIds: ['close-modal-btn', 'cancel-modal-btn'],
    backdropId:  'modal-backdrop',
  });

  // Change Password modal
  initModal({
    modalId:     'pwd-modal',
    contentId:   'pwd-content',
    openBtnIds:  ['change-pwd-btn'],
    closeBtnIds: ['close-pwd-btn', 'cancel-pwd-btn'],
    backdropId:  'pwd-backdrop',
  });

  // Fetch real data
  const { data: profile } = await getProfile();
  const { data: historyRes } = await getHistory();

  if (profile) {
      const nameInput = document.getElementById('profile-name-input');
      if (nameInput) nameInput.value = profile.user.name;

      const emailInput = document.getElementById('profile-email-input');
      if (emailInput) emailInput.value = profile.user.email;

      const prefs = profile.preferences;
      if (prefs) {
          const setCheck = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
          setCheck('pref-gluten_free', prefs.dietary_restrictions.includes('gluten_free'));
          setCheck('pref-vegetarian', prefs.dietary_restrictions.includes('vegetarian'));
          setCheck('pref-vegan', prefs.dietary_restrictions.includes('vegan'));
          setCheck('pref-keto', prefs.dietary_restrictions.includes('keto'));
          
          const alg = document.getElementById('pref-allergens');
          if (alg) alg.value = prefs.allergen_exclusions.join(', ');
      }

      renderPaymentMethods(profile.payment_methods);
  }

  // History section logic
  const historyEmpty     = document.getElementById('history-empty');
  const historyPopulated = document.getElementById('history-populated');
  
  if (!historyRes || !historyRes.items || historyRes.items.length === 0) {
      historyPopulated?.classList.add('hidden');
      historyEmpty?.classList.remove('hidden');
  } else {
      historyEmpty?.classList.add('hidden');
      historyPopulated?.classList.remove('hidden');
      renderHistoryShort(historyRes.items.slice(0, 2), historyPopulated);
  }

  // Skeleton → real profile transition
  const realProfile     = document.getElementById('real-profile');
  const skeletonProfile = document.getElementById('skeleton-profile');
  if (realProfile && skeletonProfile) {
    skeletonProfile.classList.add('hidden');
    realProfile.classList.remove('hidden');
  }
});

function renderPaymentMethods(methods) {
   const grid = document.getElementById('payment-methods-grid');
   if(!grid) return;
   if(!methods || methods.length === 0) {
      grid.innerHTML = '<p class="text-sm text-slate-500 col-span-2">No tienes métodos de pago guardados.</p>';
      return;
   }

   const BRAND_ICONS = {
      visa: '<i class="fa-brands fa-cc-visa text-2xl text-blue-800"></i>',
      mastercard: '<i class="fa-brands fa-cc-mastercard text-2xl text-orange-500"></i>',
      amex: '<i class="fa-brands fa-cc-amex text-2xl text-cyan-600"></i>'
   };

   grid.innerHTML = methods.map(pm => `
      <div class="border ${pm.is_default ? 'border-brand-200 bg-brand-50/50' : 'border-slate-200 bg-white hover:border-slate-300'} p-4 rounded-2xl flex items-start justify-between relative overflow-hidden group transition-colors dark:border-slate-700 dark:bg-slate-900">
         <div class="flex items-center gap-4">
               <div class="w-12 h-8 bg-white rounded border border-slate-200 flex items-center justify-center p-1 dark:bg-slate-900 dark:border-slate-700">
                  ${BRAND_ICONS[pm.brand] || '<i class="fa-regular fa-credit-card text-2xl text-slate-500"></i>'}
               </div>
               <div>
                  <p class="font-semibold text-slate-800 dark:text-slate-100 capitalize">${pm.brand} terminada en ${pm.last_four}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Expira ${pm.exp_month}/${pm.exp_year.toString().slice(-2)}</p>
               </div>
         </div>
         ${pm.is_default ? '<span class="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Predeterminada</span>' : ''}
         
         <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
               ${!pm.is_default ? '<button class="text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-300">Hacer predeterminada</button>' : ''}
               <button class="text-slate-400 hover:text-red-500 transition-colors dark:text-slate-500"><i class="fa-solid fa-trash"></i></button>
         </div>
      </div>
   `).join('');
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
                  <span><i class="fa-solid fa-basket-shopping text-brand-500"></i> $${Math.round(recipe.cost_clp/1000)}k</span>
              </div>
          </div>
      </div>`).join('');
}
