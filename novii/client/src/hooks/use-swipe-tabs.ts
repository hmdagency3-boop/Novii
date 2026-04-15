import { useRef, useCallback } from "react";

interface UseSwipeTabsOptions {
  tabs: string[];
  currentTab: string;
  onTabChange: (tab: string) => void;
  threshold?: number;
  isRTL?: boolean;
}

export function useSwipeTabs({ tabs, currentTab, onTabChange, threshold = 40, isRTL = false }: UseSwipeTabsOptions) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const locked = useRef<'horizontal' | 'vertical' | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    locked.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (locked.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 10 || dy > 10) {
      locked.current = dx > dy ? 'horizontal' : 'vertical';
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (locked.current !== 'horizontal') return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const dt = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaX) / dt;

    const shouldSwipe = Math.abs(deltaX) > threshold || velocity > 0.35;
    if (!shouldSwipe) return;

    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex === -1) return;

    const swipedLeft = isRTL ? deltaX > 0 : deltaX < 0;
    const swipedRight = isRTL ? deltaX < 0 : deltaX > 0;

    if (swipedLeft && currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1]);
    } else if (swipedRight && currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1]);
    }
  }, [tabs, currentTab, onTabChange, threshold, isRTL]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
