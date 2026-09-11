import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Bike, Loader2, MapPin, Navigation, Phone } from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TONE,
  DeliveryStatus,
  isClosed,
} from "@/lib/deliveryStatus";

type Job = {
  id: string;
  status: DeliveryStatus;
  dest_address: string;
  dest_landmark: string | null;
  dest_lat: number;
  dest_lng: number;
  fee_ghs: number;
  distance_km: number;
  food_orders: {
    reference_code: string;
    guest_name: string;
    phone: string | null;
    total_ghs: number;
    payment_method: string | null;
    payment_status: string;
  } | null;
};

const RIDER_NEXT: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  rider_assigned: ["rider_accepted"],
  rider_accepted: ["rider_picked_up"],
  rider_picked_up: ["on_the_way"],
  on_the_way: ["delivered", "failed"],
};

export default function RiderPortal() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [rider, setRider] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data: r } = await supabase
      .from("delivery_riders")
      .select("id, full_name, rider_code, status, is_active")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setRider(r ?? null);
    if (r?.id) {
      const { data } = await supabase
        .from("deliveries")
        .select(
          "id, status, dest_address, dest_landmark, dest_lat, dest_lng, fee_ghs, distance_km, food_orders(reference_code, guest_name, phone, total_ghs, payment_method, payment_status)",
        )
        .eq("rider_id", r.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setJobs((data as unknown as Job[]) ?? []);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  // Share the rider's position while a run is live so guests can follow it.
  useEffect(() => {
    const active = jobs.find((j) =>
      ["rider_accepted", "rider_picked_up", "on_the_way"].includes(j.status),
    );
    if (!rider?.id || !active || !navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from("rider_locations").insert({
          rider_id: rider.id,
          delivery_id: active.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed_mps: pos.coords.speed,
        });
      },
      () => {
        /* location sharing is best-effort */
      },
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 20000 },
    );

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [jobs, rider?.id]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSigningIn(false);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  }

  async function act(job: Job, status: DeliveryStatus) {
    setBusyId(job.id);
    const { data, error } = await supabase.functions.invoke("delivery-action", {
      body: { delivery_id: job.id, action: "update_status", status },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast({
        title: "Could not update",
        description: (data as any)?.error ?? error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: `Marked ${DELIVERY_STATUS_LABELS[status]}` });
    load();
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
        <SEO title="Rider Portal — MJ Grand Hotel" description="Delivery rider portal." path="/rider" />
        <Card className="w-full max-w-sm border-cream/10 bg-cream/[0.03]">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Bike className="w-8 h-8 text-gold mx-auto mb-2" />
              <h1 className="font-serif text-xl text-cream">Rider Portal</h1>
            </div>
            <form onSubmit={signIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-cream/70 text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-charcoal border-cream/10 text-cream"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-cream/70 text-sm">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-charcoal border-cream/10 text-cream"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={signingIn}>
                {signingIn ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <p className="text-cream/70">This account is not registered as a delivery rider.</p>
          <Button variant="outline" className="border-gold/40 text-gold" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const open = jobs.filter((j) => !isClosed(j.status));
  const done = jobs.filter((j) => isClosed(j.status));

  return (
    <div className="min-h-screen bg-charcoal pb-16">
      <SEO title="Rider Portal — MJ Grand Hotel" description="Delivery rider portal." path="/rider" />
      <div className="border-b border-cream/10 px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-serif text-lg text-cream">{rider.full_name}</p>
          <p className="text-xs text-cream/45">{rider.rider_code}</p>
        </div>
        <Button variant="ghost" className="text-cream/70" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-gold animate-spin" />
          </div>
        )}

        {!loading && open.length === 0 && (
          <p className="text-center text-cream/50 py-10">No deliveries assigned to you right now.</p>
        )}

        {open.map((job) => (
          <Card key={job.id} className="border-cream/10 bg-cream/[0.03]">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg text-gold">{job.food_orders?.reference_code}</p>
                  <p className="text-sm text-cream/70">{job.food_orders?.guest_name}</p>
                </div>
                <Badge variant="outline" className={DELIVERY_STATUS_TONE[job.status]}>
                  {DELIVERY_STATUS_LABELS[job.status]}
                </Badge>
              </div>

              <p className="text-sm text-cream/70 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gold shrink-0" />
                {job.dest_address}
                {job.dest_landmark ? ` (${job.dest_landmark})` : ""}
              </p>

              <p className="text-sm text-cream/60">
                {job.distance_km} km ·{" "}
                {job.food_orders?.payment_method === "cash_on_delivery"
                  ? `Collect GH₵ ${Number(job.food_orders?.total_ghs ?? 0).toFixed(2)}`
                  : "Already paid"}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {job.food_orders?.phone && (
                  <Button asChild variant="outline" size="sm" className="border-gold/40 text-gold">
                    <a href={`tel:${job.food_orders.phone}`}>
                      <Phone className="w-3.5 h-3.5 mr-1.5" /> Call guest
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm" className="border-cream/20 text-cream/80">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.dest_lat},${job.dest_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" /> Navigate
                  </a>
                </Button>
                {(RIDER_NEXT[job.status] ?? []).map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    disabled={busyId === job.id}
                    variant={n === "failed" ? "outline" : "default"}
                    onClick={() => act(job, n)}
                  >
                    {busyId === job.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      DELIVERY_STATUS_LABELS[n]
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {done.length > 0 && (
          <div className="pt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cream/35 mb-2">Recent</p>
            <div className="space-y-2">
              {done.slice(0, 8).map((j) => (
                <div
                  key={j.id}
                  className="flex justify-between text-sm text-cream/55 border border-cream/10 rounded-md px-3 py-2"
                >
                  <span>{j.food_orders?.reference_code}</span>
                  <span>{DELIVERY_STATUS_LABELS[j.status]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
