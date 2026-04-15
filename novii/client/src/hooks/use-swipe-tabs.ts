import { useRef, useCallback } from "react";

interface UseSwipeTabsOptions {
  tabs: string[];
  currentTab: string;
  onTabChange: (tab: string) => void;
  threshold?: number;
  isRTL?: boolean;
}

export function useSwipeTabs({ tabs, currentTab, onTabChange, threshold = 50, isRTL = false }: UseSwipeTabsOptions) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = true;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaY) > Math.abs(deltaX)) return;

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

  return { onTouchStart, onTouchEnd };
}
