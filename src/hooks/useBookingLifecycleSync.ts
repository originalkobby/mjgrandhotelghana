import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseBookingLifecycleSyncOptions {
  enabled?: boolean;
  intervalMs?: number;
  onSynced?: () => void | Promise<void>;
}

export function useBookingLifecycleSync({
  enabled = true,
  intervalMs = 60_000,
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
        await supabase.functions.invoke("auto-status");
        if (!cancelled) {
          await onSynced?.();
        }
      } catch (error) {
        console.error("Booking lifecycle sync failed:", error);
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