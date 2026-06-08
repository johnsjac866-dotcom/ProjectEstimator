import { useEffect, useRef, useState } from "react";

/**
 * usePullToRefresh - attaches pull-to-refresh touch handling to a scroll container.
 * @param {Function} onRefresh - async function to call when pull threshold is reached
 * @param {Object} options
 * @param {number} options.threshold - pull distance in px to trigger refresh (default 80)
 */
export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const currentY = useRef(0);

  useEffect(() => {
    const el = document.documentElement;

    function onTouchStart(e) {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    }

    function onTouchMove(e) {
      if (startY.current === null) return;
      currentY.current = e.touches[0].clientY;
      const delta = currentY.current - startY.current;
      if (delta > 10 && el.scrollTop === 0) {
        setPulling(true);
      }
    }

    function onTouchEnd() {
      if (!pulling) { startY.current = null; return; }
      const delta = currentY.current - (startY.current || 0);
      startY.current = null;
      setPulling(false);
      if (delta >= threshold && !refreshing) {
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => setRefreshing(false));
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pulling, refreshing, threshold]);

  return { pulling, refreshing };
}