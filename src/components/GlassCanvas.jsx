import { useEffect, useRef } from "react";
import { initGlassGL } from "../utils/glassWebGL";

const DEFAULT_BG = "/src/assets/background.jpg";

export default function GlassCanvas({ containerRef, imageUrl = DEFAULT_BG }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef?.current;
    if (!canvas || !container) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    const gl = initGlassGL(canvas, img);
    if (!gl) return;
    glRef.current = gl;

    gl.setImage(img);
    gl.resize(window.innerWidth, window.innerHeight);

    const getCardRects = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const cards = container.querySelectorAll("[data-card-id]");
      return Array.from(cards).map((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left - canvasRect.left;
        const y = r.top - canvasRect.top;
        const dragging = el.classList.contains("sortable-drag");
        return {
          x,
          y,
          width: r.width,
          height: r.height,
          centerX: x + r.width / 2,
          centerY: y + r.height / 2,
          dragging,
        };
      });
    };

    gl.start(getCardRects);

    const onResize = () => {
      gl.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      gl.destroy();
      glRef.current = null;
    };
  }, [containerRef, imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
