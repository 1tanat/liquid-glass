import { useCallback, useEffect, useRef, useState } from "react";
import Card from "./Card";
import GlassCanvas from "./GlassCanvas";
import { setupGridSlots } from "../utils/interactDropzone";

const TOTAL_CARDS = 3;

const CARD_LABELS = {
  0: "try",
  1: "moving",
  2: "cards",
};

function initialCards() {
  return [...Array(TOTAL_CARDS).keys()];
}

export default function GlassDemo() {
  const [cards, setCards] = useState(initialCards);
  const containerRef = useRef(null);
  const gridRef = useRef(null);

  const onDrop = useCallback((cardId, fromSlot, toSlot) => {
    setCards((prev) => {
      const next = [...prev];
      next[fromSlot] = prev[toSlot];
      next[toSlot] = cardId;
      return next;
    });
  }, []);

  useEffect(() => {
    const cleanup = setupGridSlots(gridRef.current, onDrop);
    return cleanup;
  }, [onDrop, cards.join(",")]);

  return (
    <div
      ref={containerRef}
      className="glass-demo relative flex justify-center items-center min-h-screen p-4 glass-layer"
    >
      <GlassCanvas containerRef={containerRef} />
      <div ref={gridRef} className="relative z-10 flex flex-row gap-4">
        {cards.map((cardId, index) => (
          <div
            key={index}
            data-slot-index={index}
            className="flex justify-center"
          >
            <Card cardId={cardId} text={CARD_LABELS[cardId]} />
          </div>
        ))}
      </div>
    </div>
  );
}
