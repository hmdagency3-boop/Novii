import { useRef, useState, useEffect } from "react";

export interface PinchOverlay {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  originX: number;
  originY: number;
  releasing: boolean;
}

const HIDDEN: PinchOverlay = {
  active: false, x: 0, y: 0, width: 0, height: 0,
  scale: 1, originX: 50, originY: 50, releasing: false,
};

function touchDist(a: Touch, b: Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function usePinchZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<PinchOverlay>(HIDDEN);
  const lastDistRef = useRef<number | null>(null);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      if (releaseTimer.current) clearTimeout(releaseTimer.current);

      const rect = el.getBoundingClientRect();
      lastDistRef.current = touchDist(e.touches[0], e.touches[1]);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      setOverlay({
        active: true,
        releasing: false,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        scale: 1,
        originX: ((midX - rect.left) / rect.width) * 100,
        originY: ((midY - rect.top) / rect.height) * 100,
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastDistRef.current === null) return;
      e.preventDefault();
      const newDist = touchDist(e.touches[0], e.touches[1]);
      const delta = newDist / lastDistRef.current;
      lastDistRef.current = newDist;
      setOverlay(prev =>
        prev.active
          ? { ...prev, scale: Math.min(Math.max(prev.scale * delta, 1), 4) }
          : prev
      );
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) return;
      lastDistRef.current = null;
      setOverlay(prev => prev.active ? { ...prev, releasing: true, scale: 1 } : prev);
      releaseTimer.current = setTimeout(() => {
        setOverlay(HIDDEN);
      }, 300);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    };
  }, []);

  return { containerRef, overlay };
}
