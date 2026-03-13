import interact from "interactjs";

const CARD_SELECTOR = "[data-card-id]";
const SLOT_SELECTOR = "[data-slot-index]";

export function setupGridSlots(gridEl, onDrop) {
  if (!gridEl) return () => {};

  const position = { x: 0, y: 0 };
  let logScheduled = false;

  const slots = gridEl.querySelectorAll(SLOT_SELECTOR);
  const dropzones = [];
  slots.forEach((slotEl) => {
    const dz = interact(slotEl).dropzone({
      accept: CARD_SELECTOR,
      overlap: 0.5,
      ondrop(event) {
        const cardEl = event.relatedTarget;
        const cardId = Number(cardEl.dataset.cardId);
        const fromSlotEl = cardEl.closest(SLOT_SELECTOR);
        const fromSlot = fromSlotEl ? Number(fromSlotEl.dataset.slotIndex) : -1;
        const toSlot = Number(event.target.dataset.slotIndex);
        if (
          Number.isFinite(cardId) &&
          Number.isFinite(toSlot) &&
          fromSlot !== toSlot
        ) {
          onDrop(cardId, fromSlot, toSlot);
        }
        cardEl.style.transform = "";
        position.x = 0;
        position.y = 0;
      },
    });
    dropzones.push(dz);
  });

  const cards = gridEl.querySelectorAll(CARD_SELECTOR);
  const draggables = [];
  cards.forEach((el) => {
    const d = interact(el).draggable({
      listeners: {
        start() {
          position.x = 0;
          position.y = 0;
          el.classList.add("sortable-drag");
        },
        move(event) {
          position.x += event.dx;
          position.y += event.dy;
          el.style.transform = `translate(${position.x}px, ${position.y}px)`;
          if (!logScheduled) {
            logScheduled = true;
            requestAnimationFrame(() => {
              logScheduled = false;
              const r = el.getBoundingClientRect();
              const centerX = r.left + r.width / 2;
              const centerY = r.top + r.height / 2;
              console.log("card center (px):", { centerX: Math.round(centerX), centerY: Math.round(centerY) });
            });
          }
        },
        end(event) {
          el.classList.remove("sortable-drag");
          el.style.transform = "";
          position.x = 0;
          position.y = 0;
        },
      },
      ignoreFrom: "button, input, a",
    });
    draggables.push(d);
  });

  return () => {
    dropzones.forEach((dz) => dz.unset());
    draggables.forEach((d) => d.unset());
  };
}
