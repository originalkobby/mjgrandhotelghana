import { useEffect } from "react";

interface Options {
  onSynced?: () => void;
}

/**
 * Booking lifecycle transitions run server-side on an hourly pg_cron job,
 * so the client no longer polls the auto-status edge function.
 * This hook simply refreshes cached data once on mount.
 */
export function useBookingLifecycleSync({ onSynced }: Options = {}) {
  useEffect(() => {
    onSynced?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useBookingLifecycleSync;
