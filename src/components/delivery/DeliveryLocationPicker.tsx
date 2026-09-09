import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loadGoogleMaps, HOTEL_ORIGIN } from "@/lib/googleMaps";

export type PickedLocation = {
  lat: number;
  lng: number;
  address: string;
};

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
}

/**
 * Map-based delivery address picker: search, "use my location", or drag the pin.
 * If Maps is unavailable the component degrades to a plain address box so an
 * order can still be placed (staff then confirm the fee manually).
 */
export default function DeliveryLocationPicker({ value, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const markerObj = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const placesLib = useRef<any>(null);
  const sessionToken = useRef<any>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mapsError, setMapsError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  const place = (lat: number, lng: number, address?: string) => {
    if (mapObj.current) {
      const pos = { lat, lng };
      mapObj.current.panTo(pos);
      mapObj.current.setZoom(16);
      if (markerObj.current) markerObj.current.setPosition(pos);
    }
    if (address) {
      onChange({ lat, lng, address });
      return;
    }
    if (geocoder.current) {
      geocoder.current.geocode({ location: { lat, lng } }, (res: any[], status: string) => {
        const formatted =
          status === "OK" && res?.[0]?.formatted_address
            ? res[0].formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onChange({ lat, lng, address: formatted });
      });
    } else {
      onChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    }
  };

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(async (maps) => {
        if (cancelled || !mapRef.current) return;
        const start = value ?? { lat: HOTEL_ORIGIN.lat, lng: HOTEL_ORIGIN.lng };
        const map = new maps.Map(mapRef.current, {
          center: start,
          zoom: value ? 16 : 13,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapObj.current = map;
        geocoder.current = new maps.Geocoder();

        new maps.Marker({
          position: { lat: HOTEL_ORIGIN.lat, lng: HOTEL_ORIGIN.lng },
          map,
          title: HOTEL_ORIGIN.name,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#D4AF37",
            fillOpacity: 1,
            strokeColor: "#1c1b19",
            strokeWeight: 2,
          },
        });

        markerObj.current = new maps.Marker({
          position: start,
          map,
          draggable: true,
          title: "Your delivery address",
        });
        markerObj.current.addListener("dragend", (e: any) => {
          place(e.latLng.lat(), e.latLng.lng());
        });
        map.addListener("click", (e: any) => place(e.latLng.lat(), e.latLng.lng()));

        try {
          const lib = await maps.importLibrary("places");
          if (lib?.AutocompleteSuggestion && lib?.AutocompleteSessionToken) {
            placesLib.current = lib;
            sessionToken.current = new lib.AutocompleteSessionToken();
          } else {
            setSearchNote("Address search is unavailable — drop the pin on the map instead.");
          }
        } catch {
          setSearchNote("Address search is unavailable — drop the pin on the map instead.");
        }

        setReady(true);
      })
      .catch((err: any) => {
        if (!cancelled) setMapsError(err?.message ?? "Map could not be loaded.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = (text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (!placesLib.current || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const { suggestions: found } =
          await placesLib.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            sessionToken: sessionToken.current,
            includedRegionCodes: ["gh"],
          });
        setSuggestions(found?.slice(0, 5) ?? []);
        setSearchNote(null);
      } catch (err: any) {
        setSuggestions([]);
        setSearchNote("Address search is unavailable — drop the pin on the map instead.");
      }
    }, 400);
  };

  const choose = async (suggestion: any) => {
    try {
      const prediction = suggestion.placePrediction;
      const placeObj = prediction.toPlace();
      await placeObj.fetchFields({ fields: ["location", "formattedAddress"] });
      const loc = placeObj.location;
      place(loc.lat(), loc.lng(), placeObj.formattedAddress ?? prediction.text?.text);
      setQuery(placeObj.formattedAddress ?? prediction.text?.text ?? "");
      setSuggestions([]);
    } catch {
      setSearchNote("Could not open that address — drop the pin on the map instead.");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchNote("Your browser cannot share a location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        place(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setSearchNote("We could not get your location. Please allow location access or search instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  if (mapsError) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-cream/60">
          The map is unavailable right now. Type your full address and our team will confirm the
          delivery fee with you before dispatch.
        </p>
        <Input
          value={value?.address ?? ""}
          onChange={(e) => onChange({ lat: NaN, lng: NaN, address: e.target.value })}
          className="bg-charcoal border-cream/10 text-cream"
          placeholder="House number, street, area"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
            <Input
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              className="pl-9 bg-charcoal border-cream/10 text-cream"
              placeholder="Search your address or area"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={useMyLocation}
            disabled={!ready || locating}
            className="shrink-0 border-gold/40 text-gold hover:bg-gold/10"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">My location</span>
          </Button>
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-md border border-cream/10 bg-charcoal shadow-xl overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(s)}
                  className="w-full text-left px-3 py-2 text-sm text-cream/85 hover:bg-cream/10"
                >
                  {s.placePrediction?.text?.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        ref={mapRef}
        className="w-full h-[280px] rounded-xl border border-cream/10 overflow-hidden bg-charcoal/60"
      />

      <p className="text-xs text-cream/50 flex items-start gap-2">
        <MapPin className="w-3.5 h-3.5 mt-0.5 text-gold shrink-0" />
        {value?.address
          ? value.address
          : "Search, use your location, or tap the map to drop your delivery pin."}
      </p>
      {searchNote && <p className="text-xs text-amber-400/80">{searchNote}</p>}
    </div>
  );
}
