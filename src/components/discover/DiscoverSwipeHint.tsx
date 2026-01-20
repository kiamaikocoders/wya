import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'wya.discover.swipeHintDismissed.v1';

function safeGetDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function safeSetDismissed(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}

function useIsCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.('(hover: none) and (pointer: coarse)');
    if (!mql) return;

    const update = () => setIsCoarse(!!mql.matches);
    update();

    // Safari < 14 compatibility
    // eslint-disable-next-line deprecation/deprecation
    if (mql.addEventListener) mql.addEventListener('change', update);
    // eslint-disable-next-line deprecation/deprecation
    else mql.addListener(update);

    return () => {
      // eslint-disable-next-line deprecation/deprecation
      if (mql.removeEventListener) mql.removeEventListener('change', update);
      // eslint-disable-next-line deprecation/deprecation
      else mql.removeListener(update);
    };
  }, []);

  return isCoarse;
}

const DiscoverSwipeHint: React.FC = () => {
  const isCoarsePointer = useIsCoarsePointer();
  const [visible, setVisible] = useState(false);

  const shouldShow = useMemo(() => {
    // Prefer showing on touch devices, but don’t hard-block desktop.
    return true;
  }, []);

  const dismiss = () => {
    safeSetDismissed();
    setVisible(false);
  };

  useEffect(() => {
    if (!shouldShow) return;
    if (safeGetDismissed()) return;

    // Slight delay to avoid flashing during route transitions.
    const t = window.setTimeout(() => setVisible(true), 500);
    return () => window.clearTimeout(t);
  }, [shouldShow]);

  // Auto-dismiss once the user performs a horizontal swipe gesture.
  useEffect(() => {
    if (!visible) return;

    let startX = 0;
    let startY = 0;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dismiss();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-black/65 backdrop-blur-md border border-white/15 w-[176px] h-[176px] flex flex-col items-center justify-center px-4 text-center">
            <div className="text-white text-lg font-semibold leading-tight">
              Swipe for
              <br />
              next story
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-white/90">
              <ChevronRight className="h-8 w-8" />
              <ChevronRight className="h-8 w-8 -ml-4 opacity-70" />
            </div>
            {!isCoarsePointer && (
              <div className="mt-2 text-[11px] text-white/70">You can also scroll sideways</div>
            )}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl bg-black/70 backdrop-blur-md border border-white/15 px-5 py-2 text-white font-medium shadow-lg"
            aria-label="Dismiss swipe hint"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverSwipeHint;

