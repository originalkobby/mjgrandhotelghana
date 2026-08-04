import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "admin_session_started_at";

interface Options {
  maxDurationMs: number;
  onTimeout: () => void;
  enabled?: boolean;
}

/**
 * Enforces a hard session-duration cap (not idle-based).
 * The start time is persisted in sessionStorage so a page refresh
 * preserves the countdown, but closing the tab starts a fresh window.
 */
export function useSessionTimeout({ maxDurationMs, onTimeout, enabled = true }: Options) {
  const [remainingMs, setRemainingMs] = useState<number>(maxDurationMs);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let startedAt = Number(sessionStorage.getItem(STORAGE_KEY));
    if (!startedAt || Number.isNaN(startedAt)) {
      startedAt = Date.now();
      sessionStorage.setItem(STORAGE_KEY, String(startedAt));
    }

    const remaining = startedAt + maxDurationMs - Date.now();
    setRemainingMs(Math.max(0, remaining));

    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeout();
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeout();
      }
    }, remaining);

    const tick = setInterval(() => {
      const left = startedAt + maxDurationMs - Date.now();
      setRemainingMs(Math.max(0, left));
    }, 30_000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(tick);
    };
  }, [enabled, maxDurationMs, onTimeout]);

  return { remainingMs };
}

export const ADMIN_SESSION_STORAGE_KEY = STORAGE_KEY;
