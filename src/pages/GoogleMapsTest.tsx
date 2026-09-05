import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    initMapTest?: () => void;
    google?: any;
  }
}

// MJ Grand Hotel — No. 460 Abotsi Street, East Legon, Accra, Ghana
const HOTEL = {
  name: "MJ Grand Hotel",
  address: "No. 460 Abotsi Street, East Legon, Accra, Ghana",
  lat: 5.6358,
  lng: -0.1577,
};

type Status = "loading" | "loaded" | "error";

const GoogleMapsTest = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Loading Google Maps JavaScript API…");
  const [markerReady, setMarkerReady] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

    if (!apiKey) {
      setStatus("error");
      setMessage(
        "Browser API key is missing (VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY). The Google Maps connector must be linked to this project."
      );
      return;
    }

    const initMap = () => {
      try {
        if (!mapRef.current || !window.google?.maps) {
          setStatus("error");
          setMessage("Google Maps library not available after script load.");
          return;
        }
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: HOTEL.lat, lng: HOTEL.lng },
          zoom: 16,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        const marker = new window.google.maps.Marker({
          position: { lat: HOTEL.lat, lng: HOTEL.lng },
          map,
          title: HOTEL.name,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="font-family:sans-serif;padding:4px 2px">
            <strong>${HOTEL.name}</strong><br/>
            <span style="font-size:12px;color:#555">${HOTEL.address}</span>
          </div>`,
        });

        marker.addListener("click", () => {
          infoWindow.open({ anchor: marker, map });
        });

        setMarkerReady(true);
        setStatus("loaded");
        setMessage("Map and hotel marker loaded successfully. Click the marker to see the hotel name.");
      } catch (err: any) {
        setStatus("error");
        setMessage(`Map initialization failed: ${err?.message ?? String(err)}`);
      }
    };

    // If the API is already loaded (HMR / remount), initialize directly.
    if (window.google?.maps) {
      initMap();
      return;
    }

    // Register the global callback BEFORE loading the script (required with loading=async).
    window.initMapTest = initMap;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=initMapTest${channel ? `&channel=${channel}` : ""}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setStatus("error");
      setMessage(
        "Failed to load the Maps JavaScript API script. Check that the Browser API key is valid, billing is enabled on the Google Cloud project, and the Maps JavaScript API is enabled."
      );
    };
    document.head.appendChild(script);

    // Detect silent auth/referrer failures surfaced via gm_authFailure.
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setStatus("error");
      setMessage(
        "Google rejected the Browser API key (REQUEST_DENIED / RefererNotAllowedMapError). The key's HTTP referrer allowlist must include this domain."
      );
      if (typeof prevAuthFailure === "function") prevAuthFailure();
    };

    // Google surfaces billing / quota errors only via console.error — intercept them
    // so this test page can display the exact failure.
    const prevConsoleError = console.error;
    console.error = (...args: any[]) => {
      const text = args.map(String).join(" ");
      if (text.includes("BillingNotEnabledMapError")) {
        setStatus("error");
        setMessage(
          "BillingNotEnabledMapError: the Google Cloud project behind this Browser API key has no billing account linked. Enable billing in Google Cloud Console (Billing → link a billing account). The Maps JavaScript API itself is enabled — only billing is missing."
        );
      } else if (text.includes("ApiNotActivatedMapError")) {
        setStatus("error");
        setMessage(
          "ApiNotActivatedMapError: the Maps JavaScript API is NOT enabled on the Google Cloud project behind this key. Enable it in Google Cloud Console → APIs & Services."
        );
      }
      prevConsoleError.apply(console, args);
    };

    return () => {
      window.initMapTest = undefined;
      (window as any).gm_authFailure = prevAuthFailure;
      console.error = prevConsoleError;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <h1 className="font-serif text-3xl mb-2">Google Maps Connectivity Test</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Isolated test page — does not affect any other part of the site.
        </p>

        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            status === "loaded"
              ? "border-green-600/40 bg-green-50 text-green-800"
              : status === "error"
                ? "border-red-600/40 bg-red-50 text-red-800"
                : "border-amber-500/40 bg-amber-50 text-amber-800"
          }`}
          role="status"
        >
          <p className="font-semibold">
            {status === "loaded" ? "✓ Loaded" : status === "error" ? "✗ Error" : "… Loading"}
          </p>
          <p>{message}</p>
          <p className="mt-1 text-xs opacity-75">
            Marker: {markerReady ? "✓ created" : "not yet created"} · Center: {HOTEL.lat}, {HOTEL.lng} (East Legon, Accra)
          </p>
        </div>

        <div
          ref={mapRef}
          className="w-full rounded-xl border shadow-sm"
          style={{ height: "480px" }}
          aria-label="Google Map showing MJ Grand Hotel, East Legon, Accra"
        />
      </div>
    </div>
  );
};

export default GoogleMapsTest;
