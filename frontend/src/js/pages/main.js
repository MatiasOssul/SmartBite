// Dashboard page entry

import { guardPrivate } from '@js/modules/guard.js';
import { isNewUser, setSessionState } from '@js/modules/session.js';
import { initNavbar } from '@js/modules/navbar.js';
import { validatePrompt, generateRecipe, saveRecipe, getHistory, getQuota } from '@js/api/recipes.js';
import { setButtonLoading, showToast } from '@js/modules/toast.js';
import { toggleFavorite, isFavorite } from '@js/modules/store.js';

guardPrivate();
initNavbar('main');

const DIFFICULTY = { easy: 'Fácil', medium: 'Media', hard: 'Avanzado' };

function formatCLP(n) {
  return '$' + n.toLocaleString('es-CL');
}

document.addEventListener('DOMContentLoaded', () => {
  const emptyState      = document.getElementById('empty-state');
  const skeletonView    = document.getElementById('recipe-skeleton');
  const suggestionsView = document.getElementById('recipe-suggestions');
  const detailsView     = document.getElementById('recipe-details');
  const generateBtn     = document.getElementById('generate-recipe-btn');
  const bottomHistoryView = document.getElementById('bottom-history-view');

  // Set initial view based on session state
  if (isNewUser()) {
    emptyState?.classList.remove('hidden');
    bottomHistoryView?.classList.add('hidden');
  } else {
    emptyState?.classList.add('hidden');
    bottomHistoryView?.classList.remove('hidden');
    loadBottomHistory();
  }

  async function loadBottomHistory() {
    const { data } = await getHistory(1, 3);
    if (!data) return;

    const grid = document.getElementById('recent-history-grid');
    if (grid && data.items && data.items.length > 0) {
      grid.innerHTML = data.items.map(recipe => `
        <a href="/history.html" class="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-soft border border-slate-200 hover:border-brand-300 transition-all group flex flex-col h-28 block dark:bg-slate-900 dark:border-slate-700 dark:shadow-none">
            <div class="h-full w-full overflow-hidden shrink-0 relative">
                <img src="${recipe.image_url}" alt="${recipe.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <h4 class="text-white font-bold leading-tight line-clamp-2 drop-shadow-md text-sm">${recipe.title}</h4>
                </div>
            </div>
        </a>
      `).join('');
    } else if (grid) {
      grid.innerHTML = `<p class="text-sm text-slate-500 col-span-full">Aún no hay recetas en tu historial.</p>`;
    }
  }

  // Prompt error helpers
  const promptErrorEl = document.getElementById('prompt-error');
  const showPromptError = (msg) => {
    promptErrorEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${msg}`;
    promptErrorEl.classList.remove('hidden');
  };
  const clearPromptError = () => {
    promptErrorEl.classList.add('hidden');
    promptErrorEl.innerHTML = '';
  };
  document.getElementById('prompt-input')?.addEventListener('input', clearPromptError);

  // Filter pill toggle
  document.querySelectorAll('[data-filter-btn]').forEach(btn => {
    btn.addEventListener('click', () => toggleFilter(btn));
  });

  // Generate recipe
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }

  document.getElementById('back-to-suggestions')
    ?.addEventListener('click', hideRecipeDetails);

  async function handleGenerate() {
    clearPromptError();
    setButtonLoading(generateBtn, true, 'Verificando...');

    // Fase 0 — Verificar cuota (sin llamar a la IA)
    const { data: quota, error: quotaError } = await getQuota();
    if (!quotaError && quota && quota.used >= quota.limit) {
      setButtonLoading(generateBtn, false);
      const upsell = quota.limit < 3 ? ' Actualiza a Plan Pro para obtener más.' : '';
      showPromptError(`Has alcanzado tu límite de ${quota.limit} generaciones por hoy.${upsell}`);
      return;
    }

    // Fase 1 — Validación

    const prompt = document.getElementById('prompt-input')?.value?.trim() ?? '';
    const activeFilters = [...document.querySelectorAll('[data-filter-btn].bg-brand-50')]
      .map(btn => btn.dataset.filter ?? btn.textContent.trim());

    const { data: vData, error: vError } = await validatePrompt(prompt);

    if (!vError && vData && !vData.is_valid) {
      setButtonLoading(generateBtn, false);
      showPromptError(vData.reason ?? 'Tu prompt no es válido para una app de recetas. Describe ingredientes, platos o tus ganas de cocinar.');
      return;
    }

    // Fase 2 — Generación
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generando...';
    emptyState?.classList.add('hidden');
    detailsView?.classList.add('hidden');
    suggestionsView?.classList.add('hidden');
    skeletonView?.classList.remove('hidden');

    const { data, error } = await generateRecipe(prompt || null, activeFilters);

    skeletonView?.classList.add('hidden');
    setButtonLoading(generateBtn, false);

    if (error) {
      showToast(error.message ?? 'Error al generar receta', 'error');
      emptyState?.classList.remove('hidden');
      return;
    }

    renderSuggestions(data.recipes);
    suggestionsView?.classList.remove('hidden');
    setSessionState('populated');
  }

  function showRecipeDetails() {
    suggestionsView?.classList.add('hidden');
    detailsView?.classList.remove('hidden');
    window.scrollTo({ top: (detailsView?.offsetTop ?? 0) - 100, behavior: 'smooth' });
  }

  function hideRecipeDetails() {
    detailsView?.classList.add('hidden');
    suggestionsView?.classList.remove('hidden');
    window.scrollTo({ top: (suggestionsView?.offsetTop ?? 0) - 100, behavior: 'smooth' });
  }

  function renderSuggestions(recipes) {
    const grid = document.getElementById('suggestions-grid');
    if (!grid) return;

    grid.innerHTML = recipes.map((recipe, i) => {
      const isTop = recipe.match_score === 100;
      return `
        <div class="bg-white rounded-3xl ${isTop ? 'shadow-soft border-2 border-brand-500' : 'shadow-sm hover:shadow-soft border border-slate-200 hover:border-brand-300'} cursor-pointer overflow-hidden transition-all group hover:-translate-y-1 relative dark:bg-slate-900 dark:shadow-none ${isTop ? '' : 'dark:border-slate-700'}"
             data-recipe-index="${i}">
          <div class="absolute top-4 right-4 ${isTop ? 'bg-brand-500' : 'bg-slate-800'} text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm flex items-center gap-1 dark:shadow-none">
            <i class="fa-solid ${isTop ? 'fa-medal' : 'fa-star'}"></i> Match ${recipe.match_score}%
          </div>
          <div class="h-48 w-full overflow-hidden shrink-0">
            <img src="${recipe.image_url}" alt="${recipe.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-xl text-slate-900 dark:text-white">${recipe.title}</h3>
              <span class="${isTop ? 'text-brand-600 border-brand-200 bg-brand-50 dark:bg-brand-900/30' : 'text-slate-800 border-slate-200 bg-slate-50 dark:text-slate-100 dark:border-slate-700 dark:bg-slate-800'} font-bold text-lg border px-2 py-0.5 rounded-lg">${formatCLP(recipe.cost_clp)}</span>
            </div>
            <p class="text-sm text-slate-500 line-clamp-2 mb-6 dark:text-slate-400">${recipe.description}</p>
            <div class="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span class="flex items-center gap-1.5"><i class="fa-solid fa-fire-burner text-slate-400 dark:text-slate-500"></i> ${DIFFICULTY[recipe.difficulty] ?? recipe.difficulty}</span>
              <span class="flex items-center gap-1.5"><i class="fa-solid fa-clock text-slate-400 dark:text-slate-500"></i> ${recipe.prep_time_minutes}m</span>
              <div class="ml-auto flex items-center gap-1 text-brand-600 group-hover:translate-x-1 transition-transform">
                Ver Detalles <i class="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-recipe-index]').forEach(card => {
      card.addEventListener('click', () => {
        renderDetail(recipes[+card.dataset.recipeIndex]);
        showRecipeDetails();
      });
    });
  }

  function renderDetail(recipe) {
    const img = document.getElementById('detail-img');
    if (img) { img.src = recipe.image_url; img.alt = recipe.title; }

    const badge = document.getElementById('detail-match-badge');
    if (badge) badge.innerHTML = `<i class="fa-solid fa-medal text-brand-500"></i> Match Perfecto (${recipe.match_score}%)`;

    const meta = document.getElementById('detail-meta');
    if (meta) meta.innerHTML = `
      <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> ${recipe.prep_time_minutes} Minutos</span>
      <span class="flex items-center gap-1.5"><i class="fa-solid fa-fire-burner"></i> ${DIFFICULTY[recipe.difficulty] ?? recipe.difficulty}</span>
      ${recipe.tags.map(t => `<span class="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-200"><i class="fa-solid fa-tag"></i> ${t}</span>`).join('')}
    `;

    const title = document.getElementById('detail-title');
    if (title) title.textContent = recipe.title;

    const desc = document.getElementById('detail-description');
    if (desc) desc.textContent = recipe.description;

    const steps = document.getElementById('detail-steps');
    if (steps) steps.innerHTML = recipe.instructions.map((step, i) => `
      <div class="flex gap-4">
        <div class="flex-shrink-0 w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold font-mono">${i + 1}</div>
        <p class="text-slate-600 text-sm leading-relaxed dark:text-slate-300 pt-1">${step}</p>
      </div>`).join('');

    const ingredients = document.getElementById('detail-ingredients');
    if (ingredients) ingredients.innerHTML = recipe.ingredients.map(ing => `
      <div class="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-brand-300 transition-colors dark:border-slate-800 dark:bg-slate-800">
        <div class="flex-grow">
          <h4 class="text-sm font-semibold text-slate-800 leading-tight dark:text-slate-100">${ing.name}</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">${ing.amount} ${ing.unit}</p>
        </div>
      </div>`).join('');

    const cost = document.getElementById('detail-cost');
    if (cost) cost.textContent = formatCLP(recipe.cost_clp);

    // Sync save button — usa is_favorite del backend como fuente de verdad
    const saveBtn = document.getElementById('detail-save-btn');
    if (saveBtn) {
      // Sincronizar localStorage con el estado real del backend
      if (recipe.is_favorite && !isFavorite(recipe.id)) toggleFavorite(recipe.id);
      if (!recipe.is_favorite && isFavorite(recipe.id)) toggleFavorite(recipe.id);

      _syncFavoriteBtn(saveBtn, recipe.is_favorite);
      let currentFav = recipe.is_favorite;

      saveBtn.onclick = async () => {
        currentFav = !currentFav;
        // Optimistic UI update
        _syncFavoriteBtn(saveBtn, currentFav);
        toggleFavorite(recipe.id);
        showToast(
          currentFav ? '¡Receta guardada en favoritos!' : 'Receta eliminada de favoritos',
          currentFav ? 'success' : 'error',
        );
        // Sync con backend (silent — no bloquea la UI)
        await saveRecipe(recipe.id);
      };
    }
  }
});

function _syncFavoriteBtn(btn, isFav) {
  const icon = btn.querySelector('i');
  if (!icon) return;
  icon.className = isFav
    ? 'fa-solid fa-heart text-red-500'
    : 'fa-regular fa-heart text-slate-400 hover:text-red-400';
}

function toggleFilter(btn) {
  if (btn.classList.contains('bg-brand-50')) {
    // Deactivate
    btn.classList.remove('bg-brand-50', 'text-brand-700', 'border-brand-200', 'shadow-sm', 'hover:bg-brand-100');
    btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200', 'hover:bg-slate-50',
      'dark:bg-slate-900', 'dark:text-slate-300', 'dark:border-slate-700', 'dark:hover:bg-slate-800');
  } else {
    // Activate — remove dark: overrides so brand colors show
    btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200', 'hover:bg-slate-50',
      'dark:bg-slate-900', 'dark:text-slate-300', 'dark:border-slate-700', 'dark:hover:bg-slate-800');
    btn.classList.add('bg-brand-50', 'text-brand-700', 'border-brand-200', 'shadow-sm', 'hover:bg-brand-100');
  }
}
