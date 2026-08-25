import { useCallback, useEffect, useRef } from 'react';

export function useTapLock(lockDurationMs = 600) {
  const isLockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (action: () => void): boolean => {
      if (isLockedRef.current) return false;

      isLockedRef.current = true;
      try {
        action();
      } finally {
        timerRef.current = setTimeout(() => {
          isLockedRef.current = false;
          timerRef.current = null;
        }, lockDurationMs);
      }
      return true;
    },
    [lockDurationMs]
  );
}
