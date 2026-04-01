// Generic modal engine
// Replaces the per-modal openXxx/closeXxx functions in profile.html.

/**
 * Opens a modal by removing opacity/pointer-events classes.
 * @param {string} modalId      - The outer wrapper element id
 * @param {string} contentId    - The inner scaled content element id
 */
export function openModal(modalId, contentId) {
  const modal   = document.getElementById(modalId);
  const content = document.getElementById(contentId);
  if (!modal || !content) return;
  modal.classList.remove('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-95');
  content.classList.add('scale-100');
}

/**
 * Closes a modal.
 * @param {string} modalId
 * @param {string} contentId
 */
export function closeModal(modalId, contentId) {
  const modal   = document.getElementById(modalId);
  const content = document.getElementById(contentId);
  if (!modal || !content) return;
  modal.classList.add('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
}

/**
 * Wires up all event listeners for a modal.
 * @param {{ modalId: string, contentId: string, openBtnIds: string[], closeBtnIds: string[], backdropId: string }} config
 */
export function initModal({ modalId, contentId, openBtnIds = [], closeBtnIds = [], backdropId }) {
  const open  = () => openModal(modalId, contentId);
  const close = () => closeModal(modalId, contentId);

  openBtnIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', open);
  });

  closeBtnIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', close);
  });

  if (backdropId) {
    const backdrop = document.getElementById(backdropId);
    if (backdrop) backdrop.addEventListener('click', close);
  }
}
