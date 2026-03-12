import { useEffect, useRef } from "react";
import Card from "./Card";
import { createSortable } from "../utils/sortable";

export default function Column({ length, colIndex }) {
  const startIndex = colIndex * length;
  const columnRef = useRef(null);

  useEffect(() => {
    const instance = createSortable(columnRef.current);
    return () => {
      instance?.destroy();
    };
  }, [colIndex]);

  return (
    <div ref={columnRef} className="flex flex-col gap-4" data-col-index={colIndex}>
      {[...Array(length)].map((_, index) => (
        <Card key={startIndex + index} text={startIndex + index + 1} />
      ))}
    </div>
  );
}
