import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Timer } from "lucide-react";

type Offer = {
  id: string;
  delivery_id: string;
  distance_km: number;
  estimated_earning_ghs: number;
  expires_at: string;
  deliveries: {
    dest_address: string;
    dest_landmark: string | null;
    food_orders: { reference_code: string } | null;
  } | null;
};

/**
 * New jobs the dispatch engine has offered to this rider. Each offer expires on
 * its own clock; once it lapses the card disappears and the next rider is tried.
 */
export default function RiderOffers({
  riderId,
  onAccepted,
}: {
  riderId: string;
  onAccepted: () => void;
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("delivery_offers")
      .select(
        "id, delivery_id, distance_km, estimated_earning_ghs, expires_at, deliveries(dest_address, dest_landmark, food_orders(reference_code))",
      )
      .eq("rider_id", riderId)
      .eq("status", "offered")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    setOffers((data as unknown as Offer[]) ?? []);
  }, [riderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Tick the countdown and drop offers the moment they lapse.
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      setOffers((prev) => {
        const live = prev.filter((o) => new Date(o.expires_at).getTime() > Date.now());
        // An offer lapsed on this phone — nudge the engine to try the next rider.
        if (live.length !== prev.length) {
          supabase.functions.invoke("dispatch-rider", { body: { action: "sweep" } });
        }
        return live;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`rider-offers-${riderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_offers", filter: `rider_id=eq.${riderId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId, load]);

  async function respond(offer: Offer, response: "accept" | "decline") {
    setBusyId(offer.id);
    const { data, error } = await supabase.functions.invoke("dispatch-rider", {
      body: { action: "respond", offer_id: offer.id, decision: response },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast({
        title: response === "accept" ? "Could not accept" : "Could not decline",
        description: (data as any)?.error ?? error?.message ?? "Please try again.",
        variant: "destructive",
      });
      load();
      return;
    }
    toast({
      title: response === "accept" ? "Job accepted" : "Job declined",
      description:
        response === "accept" ? "Head to the hotel to collect the order." : "We'll offer it to another rider.",
    });
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    if (response === "accept") onAccepted();
  }

  if (offers.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold">New job offers</p>
      {offers.map((o) => {
        const left = Math.max(0, Math.round((new Date(o.expires_at).getTime() - now) / 1000));
        return (
          <Card key={o.id} className="border-gold/40 bg-gold/[0.06]">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg text-gold">
                    {o.deliveries?.food_orders?.reference_code ?? "New delivery"}
                  </p>
                  <p className="text-sm text-cream/70">
                    {o.distance_km} km · You earn GH₵ {Number(o.estimated_earning_ghs ?? 0).toFixed(2)}
                  </p>
                </div>
                <Badge variant="outline" className="border-gold/50 text-gold whitespace-nowrap">
                  <Timer className="w-3 h-3 mr-1" /> {left}s
                </Badge>
              </div>

              <p className="text-sm text-cream/70 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gold shrink-0" />
                {o.deliveries?.dest_address ?? "Address shown once accepted"}
                {o.deliveries?.dest_landmark ? ` (${o.deliveries.dest_landmark})` : ""}
              </p>

              <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={busyId === o.id} onClick={() => respond(o, "accept")}>
                  {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Accept"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cream/20 text-cream/80"
                  disabled={busyId === o.id}
                  onClick={() => respond(o, "decline")}
                >
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
