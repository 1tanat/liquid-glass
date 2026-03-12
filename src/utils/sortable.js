import Sortable from "sortablejs";

/**
 * @param {HTMLElement | string} container - ref или CSS-селектор контейнера
 * @returns {Sortable} instance для destroy()
 */
export function createSortable(container, options = {}) {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!el) return null;

  return new Sortable(el, {
    animation: 150,
    group: "cards",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    forceFallback: true,
    ...options,
  });
}
