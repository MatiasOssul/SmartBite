// History page entry
import '@styles/main.css';
import { guardPrivate } from '@js/modules/guard.js';
import { isNewUser } from '@js/modules/session.js';
import { initNavbar } from '@js/modules/navbar.js';
import { getHistory } from '@js/api/recipes.js';

guardPrivate();
initNavbar('history');

const DIFFICULTY = { easy: 'Fácil', medium: 'Media', hard: 'Avanzado' };

function formatDate(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
}

function renderHistory(items) {
  const grid = document.getElementById('real-history');
  if (!grid) return;

  grid.innerHTML = items.map(recipe => `
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-soft transition-all h-full flex flex-col relative dark:bg-slate-900 dark:border-slate-800">
      <button class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm ${recipe.is_favorite ? 'text-red-500 hover:scale-110' : 'text-slate-300 hover:text-red-500'} transition-colors dark:shadow-none">
        <i class="fa-solid fa-heart"></i>
      </button>
      <div class="h-44 w-full overflow-hidden shrink-0">
        <img src="${recipe.image_url}" alt="${recipe.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
      </div>
      <div class="p-5 flex-grow flex flex-col">
        <span class="text-xs text-brand-600 font-bold mb-2 block uppercase tracking-wide">${formatDate(recipe.created_at)}</span>
        <h3 class="font-bold text-slate-800 text-lg mb-2 leading-tight dark:text-slate-100">${recipe.title}</h3>
        <div class="flex items-center gap-4 mt-auto pt-4 text-sm text-slate-500 border-t border-slate-50 dark:text-slate-400 dark:border-slate-800">
          <span title="Dificultad"><i class="fa-solid fa-fire-burner"></i> ${DIFFICULTY[recipe.difficulty] ?? recipe.difficulty}</span>
          <span title="Tiempo de preparación"><i class="fa-solid fa-clock"></i> ${recipe.prep_time_minutes}m</span>
          <span title="Costo"><i class="fa-solid fa-basket-shopping"></i> $${Math.round(recipe.cost_clp / 1000)}k</span>
        </div>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const skeletonHistory = document.getElementById('skeleton-history');
  const realHistory     = document.getElementById('real-history');
  const emptyHistory    = document.getElementById('history-empty-state');

  skeletonHistory?.classList.remove('hidden');
  realHistory?.classList.add('hidden');
  emptyHistory?.classList.add('hidden');

  const { data, error } = await getHistory();
  const isEmpty = isNewUser() || error || !data?.items?.length;

  skeletonHistory?.classList.add('hidden');

  if (isEmpty) {
    emptyHistory?.classList.remove('hidden');
  } else {
    renderHistory(data.items);
    realHistory?.classList.remove('hidden');
    realHistory?.classList.add('fade-in');
  }
});
