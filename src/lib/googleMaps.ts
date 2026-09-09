// Single shared loader for the Google Maps JavaScript API.
// Loads once per page, resolves for every caller, and never throws twice.

declare global {
  interface Window {
    google?: any;
    __mjMapsCallback?: () => void;
    gm_authFailure?: () => void;
  }
}

let loadPromise: Promise<any> | null = null;

export type MapsLoadError = {
  code: "missing_key" | "auth" | "network";
  message: string;
};

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No browser"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

  if (!apiKey) {
    return Promise.reject(
      Object.assign(new Error("Maps is not configured for this site."), { code: "missing_key" }),
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    window.gm_authFailure = () => {
      loadPromise = null;
      reject(
        Object.assign(new Error("Google rejected the map key for this site."), { code: "auth" }),
      );
    };

    window.__mjMapsCallback = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(Object.assign(new Error("Maps failed to initialise."), { code: "network" }));
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places&callback=__mjMapsCallback` +
      (channel ? `&channel=${channel}` : "");
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      reject(Object.assign(new Error("Could not reach Google Maps."), { code: "network" }));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const HOTEL_ORIGIN = {
  name: "MJ Grand Hotel",
  address: "No. 460 Abotsi Street, East Legon, Accra, Ghana",
  lat: 5.6358,
  lng: -0.1577,
};
