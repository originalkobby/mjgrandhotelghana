import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bike, Check, Loader2, MapPin, Phone } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import {
  DELIVERY_STATUS_LABELS,
  DeliveryStatus,
  TRACKING_STEPS,
  isClosed,
  stepIndex,
} from "@/lib/deliveryStatus";

export default function OrderTracking() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const riderMarker = useRef<any>(null);
  const mapsReady = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    const { data: res, error: fnError } = await supabase.functions.invoke("track-order", {
      body: { token },
    });
    if (fnError || (res as any)?.error) {
      setError((res as any)?.error ?? "We could not find that order.");
    } else {
      setData(res);
      setError(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while the delivery is still moving; stop once it is closed.
  useEffect(() => {
    if (!data || isClosed(data.status)) return;
    const seconds = Math.max(15, Number(data.poll_seconds) || 30);
    const id = setInterval(fetchStatus, seconds * 1000);
    return () => clearInterval(id);
  }, [data, fetchStatus]);

  // Map with the hotel, the destination and the live rider position.
  useEffect(() => {
    if (!data?.delivery || !mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const dest = { lat: data.delivery.dest_lat, lng: data.delivery.dest_lng };
        const origin = { lat: data.delivery.origin_lat, lng: data.delivery.origin_lng };

        if (!mapObj.current) {
          mapObj.current = new maps.Map(mapRef.current, {
            center: dest,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
          });
          new maps.Marker({ position: origin, map: mapObj.current, title: "MJ Grand Hotel" });
          new maps.Marker({ position: dest, map: mapObj.current, title: "Your address" });
          const bounds = new maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend(dest);
          mapObj.current.fitBounds(bounds, 60);
          mapsReady.current = true;
        }

        if (data.rider_location) {
          const pos = { lat: data.rider_location.lat, lng: data.rider_location.lng };
          if (!riderMarker.current) {
            riderMarker.current = new maps.Marker({
              position: pos,
              map: mapObj.current,
              title: "Your rider",
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#D4AF37",
                fillOpacity: 1,
                strokeColor: "#1c1b19",
                strokeWeight: 2,
              },
            });
          } else {
            riderMarker.current.setPosition(pos);
          }
        }
      })
      .catch(() => {
        /* map is optional — the timeline still works */
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  const status: DeliveryStatus = data?.status ?? "confirmed";
  const activeStep = stepIndex(status);

  return (
    <div className="min-h-screen bg-charcoal">
      <SEO
        title="Track your order — MJ Grand Hotel"
        description="Follow your MJ Grand Hotel food delivery in real time."
        path="/track"
      />
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-28 md:pt-36 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-cream mb-3">Track Your Order</h1>
            <div className="w-16 h-[2px] bg-gold mx-auto" />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          ) : error ? (
            <Card className="border-cream/10 bg-cream/[0.03]">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-cream/70">{error}</p>
                <Button asChild variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                  <Link to="/menu">Back to the menu</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className="border-cream/10 bg-cream/[0.03]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Reference</p>
                      <p className="font-serif text-xl text-gold">{data.order?.reference_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Status</p>
                      <p className="text-cream">{DELIVERY_STATUS_LABELS[status]}</p>
                    </div>
                  </div>

                  <ol className="space-y-4">
                    {TRACKING_STEPS.map((step, i) => {
                      const done = activeStep >= i;
                      const current = activeStep === i;
                      return (
                        <li key={step.key} className="flex gap-3">
                          <div
                            className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center border ${
                              done
                                ? "bg-gold/20 border-gold text-gold"
                                : "border-cream/15 text-cream/30"
                            }`}
                          >
                            {done ? <Check className="w-3.5 h-3.5" /> : <span className="text-[11px]">{i + 1}</span>}
                          </div>
                          <div>
                            <p className={`text-sm ${current ? "text-gold" : done ? "text-cream" : "text-cream/45"}`}>
                              {step.label}
                            </p>
                            <p className="text-xs text-cream/40">{step.blurb}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {status === "pending_review" && (
                    <p className="mt-5 text-xs text-amber-400">
                      Your address is a long way out — our team is confirming the trip and will email you shortly.
                    </p>
                  )}
                  {status === "cancelled" && (
                    <p className="mt-5 text-xs text-red-400">This order was cancelled.</p>
                  )}
                </CardContent>
              </Card>

              {data.delivery && (
                <Card className="border-cream/10 bg-cream/[0.03] overflow-hidden">
                  <div ref={mapRef} className="w-full h-[260px] bg-charcoal/60" />
                  <CardContent className="p-5 space-y-2 text-sm text-cream/70">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                      {data.delivery.dest_address}
                      {data.delivery.dest_landmark ? ` (${data.delivery.dest_landmark})` : ""}
                    </p>
                    <p>
                      <span className="text-cream/40">Estimated arrival:</span>{" "}
                      {data.delivery.eta_min_minutes}–{data.delivery.eta_max_minutes} minutes from confirmation
                    </p>
                    {data.rider && (
                      <p className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-gold" /> {data.rider.first_name} ·{" "}
                        <a href={`tel:${data.rider.phone}`} className="text-gold inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {data.rider.phone}
                        </a>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-cream/10 bg-cream/[0.03]">
                <CardContent className="p-5 space-y-2 text-sm">
                  {(data.order?.items ?? []).map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-cream/70">
                      <span>
                        {i.name} × {i.quantity}
                      </span>
                      <span>GH₵ {Number(i.line_total_ghs).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-cream/50 pt-2 border-t border-cream/10">
                    <span>Delivery</span>
                    <span>GH₵ {Number(data.order?.delivery_fee_ghs ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-cream pt-1">
                    <span>Total</span>
                    <span className="text-gold font-serif text-lg">
                      GH₵ {Number(data.order?.total_ghs ?? 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
