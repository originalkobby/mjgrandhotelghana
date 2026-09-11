import { lazy, ComponentType } from "react";

/**
 * React.lazy that survives stale/expired chunk URLs after a new deploy.
 * Retries once, then does a one-time hard reload to fetch the new manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      // Second chance: transient network hiccup.
      try {
        return await factory();
      } catch {
        const KEY = "chunk-reload-at";
        const last = Number(sessionStorage.getItem(KEY) || 0);
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(KEY, String(Date.now()));
          window.location.reload();
          // Never resolves — the page is reloading.
          return await new Promise<{ default: T }>(() => {});
        }
        throw err;
      }
    }
  });
}
