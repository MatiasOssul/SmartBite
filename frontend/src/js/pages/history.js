// History page entry

import { guardPrivate } from '@js/modules/guard.js';
import { isNewUser } from '@js/modules/session.js';
import { initNavbar } from '@js/modules/navbar.js';
import { getHistory, saveRecipe, removeRecipe } from '@js/api/recipes.js';
import { showToast } from '@js/modules/toast.js';

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
      <button
        class="delete-btn absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all text-slate-300 hover:text-red-500 hover:scale-110 dark:shadow-none dark:bg-slate-800/90 dark:text-slate-400 dark:hover:text-red-400"
        data-recipe-id="${recipe.id}"
        title="Eliminar receta"
      >
        <i class="fa-solid fa-trash-can"></i>
      </button>
      <button
        class="fav-btn absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all dark:shadow-none dark:bg-slate-800/90 ${recipe.is_favorite ? 'text-red-500 hover:scale-110 dark:text-red-400' : 'text-slate-300 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400'}"
        data-recipe-id="${recipe.id}"
        data-is-fav="${recipe.is_favorite}"
        title="${recipe.is_favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
      >
        <i class="fa-${recipe.is_favorite ? 'solid' : 'regular'} fa-heart"></i>
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

  // Wire favorite buttons with API sync
  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const recipeId = btn.dataset.recipeId;
      const wasFav = btn.dataset.isFav === 'true';
      const nowFav = !wasFav;

      // Optimistic UI update
      btn.dataset.isFav = String(nowFav);
      btn.title = nowFav ? 'Quitar de favoritos' : 'Guardar en favoritos';
      btn.className = `fav-btn absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all dark:shadow-none ${nowFav ? 'text-red-500 hover:scale-110' : 'text-slate-300 hover:text-red-500'}`;
      btn.innerHTML = `<i class="fa-${nowFav ? 'solid' : 'regular'} fa-heart"></i>`;

      // Actualizar el estado global para que no se pierda al Cargar Más
      const recipe = loadedRecipes.find(r => r.id === recipeId);
      if (recipe) recipe.is_favorite = nowFav;

      showToast(
        nowFav ? '¡Receta guardada en favoritos!' : 'Receta eliminada de favoritos',
        nowFav ? 'success' : 'error',
      );

      // Sync con backend
      const { error } = await saveRecipe(recipeId);
      if (error) {
        // Revertir si falla la API
        if (recipe) recipe.is_favorite = wasFav;
        btn.dataset.isFav = String(wasFav);
        btn.innerHTML = `<i class="fa-${wasFav ? 'solid' : 'regular'} fa-heart"></i>`;
        showToast('Error al sincronizar favorito', 'error');
      }
    });
  });

  // Wire delete buttons
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('¿Estás seguro de que quieres eliminar esta receta del historial? Esta acción no se puede deshacer.')) return;
      
      const recipeId = btn.dataset.recipeId;
      const card = btn.closest('.bg-white');
      
      // Optimistic delete
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => card.remove(), 250);

      loadedRecipes = loadedRecipes.filter(r => r.id !== recipeId);

      const { error } = await removeRecipe(recipeId);
      if (error) {
        showToast('Error al eliminar receta', 'error');
      } else {
        showToast('Receta eliminada del historial', 'success');
        // Si el estado queda vacío, lo forzamos recargando la página 1
        if (loadedRecipes.length === 0) {
          loadPage(1, false);
        }
      }
    });
  });
}

let currentPage = 1;
const LIMIT = 8;
let loadedRecipes = [];
let currentFilterFavorites = false;
let currentFilterMonth = false;
let currentIngredientSearch = '';

async function loadPage(page, append = false) {
  const skeletonHistory = document.getElementById('skeleton-history');
  const realHistory     = document.getElementById('real-history');
  const emptyHistory    = document.getElementById('history-empty-state');
  const loadMoreWrapper = document.getElementById('load-more-wrapper');

  if (!append) {
    skeletonHistory?.classList.remove('hidden');
    realHistory?.classList.add('hidden');
    emptyHistory?.classList.add('hidden');
    loadMoreWrapper?.classList.add('hidden');
  }

  const { data, error } = await getHistory(page, LIMIT, currentFilterFavorites, currentIngredientSearch, currentFilterMonth);
  const isEmpty = isNewUser() || error || !data?.items?.length;

  if (!append) skeletonHistory?.classList.add('hidden');

  if (isEmpty && !append) {
    emptyHistory?.classList.remove('hidden');
    if (emptyHistory) {
      const h3 = emptyHistory.querySelector('h3');
      const p = emptyHistory.querySelector('p');
      if (currentIngredientSearch) {
        if (h3) h3.textContent = 'Sin resultados para ese ingrediente';
        if (p) p.textContent = `No encontramos recetas que incluyan "${currentIngredientSearch}". Intenta con otro ingrediente.`;
      } else if (currentFilterFavorites) {
        if (h3) h3.textContent = 'No tienes recetas favoritas';
        if (p) p.textContent = 'Marca algunas recetas con el corazón para verlas agrupadas aquí.';
      } else if (currentFilterMonth) {
        if (h3) h3.textContent = 'Sin recetas este mes';
        if (p) p.textContent = 'Todavía no has generado ninguna receta este mes. ¡Es un buen momento para planear algo rico!';
      } else {
        if (h3) h3.textContent = 'Aún no hay recetas aquí';
        if (p) p.textContent = 'Cuando generes tu primer menú y decidas cocinar algo, aparecerá mágicamente en este historial.';
      }
    }
  } else if (!error && data) {
    if (append) {
      loadedRecipes = [...loadedRecipes, ...data.items];
    } else {
      loadedRecipes = data.items;
      emptyHistory?.classList.add('hidden');
    }

    renderHistory(loadedRecipes);
    realHistory?.classList.remove('hidden');
    if (!append) {
      realHistory?.classList.remove('fade-in');
      void realHistory?.offsetWidth; // triger reflow
      realHistory?.classList.add('fade-in');
    }

    if (loadedRecipes.length < data.total) {
      loadMoreWrapper?.classList.remove('hidden');
    } else {
      loadMoreWrapper?.classList.add('hidden');
    }
  }
  
  return { data, error };
}

function setFilterActive(activeBtn, inactiveBtns) {
  const activeClasses = ['bg-slate-900', 'text-white', 'shadow-sm'];
  const inactiveClasses = ['bg-white', 'text-slate-600', 'border', 'border-slate-200', 'hover:bg-slate-50', 'dark:bg-slate-900', 'dark:border-slate-700', 'dark:text-slate-300', 'dark:hover:bg-slate-800'];

  activeBtn.classList.remove(...inactiveClasses);
  activeBtn.classList.add(...activeClasses);

  inactiveBtns.forEach(btn => {
    btn.classList.remove(...activeClasses);
    btn.classList.add(...inactiveClasses);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const loadMoreBtn = document.getElementById('load-more-btn');
  const filterAll = document.getElementById('filter-all');
  const filterFavs = document.getElementById('filter-favs');
  const filterMonth = document.getElementById('filter-month'); // Opcional, lo dejamos inactivo
  const searchInput = document.getElementById('search-ingredient');

  await loadPage(1, false);

  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(async () => {
      currentIngredientSearch = searchInput.value.trim();
      currentPage = 1;
      await loadPage(1, false);
    }, 400);
  });

  loadMoreBtn?.addEventListener('click', async () => {
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
    loadMoreBtn.disabled = true;

    currentPage++;
    const { error } = await loadPage(currentPage, true);
    
    loadMoreBtn.innerHTML = originalText;
    loadMoreBtn.disabled = false;

    if (error) {
      showToast('Error al cargar más recetas', 'error');
    }
  });

  filterAll?.addEventListener('click', async () => {
    if (!currentFilterFavorites && !currentFilterMonth) return;
    currentFilterFavorites = false;
    currentFilterMonth = false;
    currentPage = 1;
    setFilterActive(filterAll, [filterFavs, filterMonth]);
    await loadPage(1, false);
  });

  filterFavs?.addEventListener('click', async () => {
    if (currentFilterFavorites) return;
    currentFilterFavorites = true;
    currentFilterMonth = false;
    currentPage = 1;
    setFilterActive(filterFavs, [filterAll, filterMonth]);
    await loadPage(1, false);
  });

  filterMonth?.addEventListener('click', async () => {
    if (currentFilterMonth) return;
    currentFilterMonth = true;
    currentFilterFavorites = false;
    currentPage = 1;
    setFilterActive(filterMonth, [filterAll, filterFavs]);
    await loadPage(1, false);
  });
});
