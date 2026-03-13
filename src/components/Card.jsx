export default function Card({ cardId, text }) {
  return (
    <div
      className="liquid-glass cursor-grab flex justify-center items-center p-8 w-48 min-h-[120px] touch-none select-none"
      data-card-id={cardId}
    >
      <h1>{text}</h1>
    </div>
  );
}
