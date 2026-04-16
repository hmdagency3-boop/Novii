import { useRef, useState, useCallback, useEffect } from "react";

interface ZoomState {
  scale: number;
  originX: number;
  originY: number;
}

function getTouchDistance(t0: Touch, t1: Touch) {
  const dx = t0.clientX - t1.clientX;
  const dy = t0.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function usePinchZoom() {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, originX: 50, originY: 50 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastDistRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, originX: 50, originY: 50 });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        lastDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        const rect = el.getBoundingClientRect();
        const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width * 100;
        const midY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height * 100;
        setZoom(prev => ({ ...prev, originX: midX, originY: midY }));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDistRef.current !== null) {
        e.preventDefault();
        const newDist = getTouchDistance(e.touches[0], e.touches[1]);
        const delta = newDist / lastDistRef.current;
        lastDistRef.current = newDist;
        setZoom(prev => ({
          ...prev,
          scale: Math.min(Math.max(prev.scale * delta, 1), 4),
        }));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        lastDistRef.current = null;
        setZoom(prev =>
          prev.scale < 1.1
            ? { scale: 1, originX: 50, originY: 50 }
            : prev
        );
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const isZoomed = zoom.scale > 1.05;

  const imageStyle: React.CSSProperties = {
    transform: `scale(${zoom.scale})`,
    transformOrigin: `${zoom.originX}% ${zoom.originY}%`,
    transition: isPinchingRef.current ? "none" : "transform 0.25s ease",
    willChange: "transform",
  };

  return {
    containerRef,
    isZoomed,
    imageStyle,
    resetZoom,
  };
}
