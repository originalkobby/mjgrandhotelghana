import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseBookingLifecycleSyncOptions {
  enabled?: boolean;
  intervalMs?: number;
  onSynced?: () => void | Promise<void>;
}

export function useBookingLifecycleSync({
  enabled = true,
  intervalMs = 30_000,
  onSynced,
}: UseBookingLifecycleSyncOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;

      try {
        // auto-status requires admin/front_desk auth — for non-staff sessions this
        // is expected to 401 and we silently skip it. The refresh callback still
        // runs so the UI re-reads the latest persisted state from the DB.
        await supabase.functions.invoke("auto-status");
      } catch (error) {
        // swallow — unauthorized callers (guests) won't trigger lifecycle changes
      }

      try {
        if (!cancelled) {
          await onSynced?.();
        }
      } catch (error) {
        console.error("Booking lifecycle refresh failed:", error);
      } finally {
        running = false;
      }
    };


    void run();
    const intervalId = window.setInterval(() => {
      void run();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, onSynced]);
}