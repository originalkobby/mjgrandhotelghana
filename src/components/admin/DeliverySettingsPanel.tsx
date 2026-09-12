import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import RiderCompensationCard from "@/components/admin/RiderCompensationCard";

type Settings = Record<string, any>;

const NUMBER_FIELDS: { key: string; label: string; hint?: string; step?: string }[] = [
  { key: "base_fee_ghs", label: "Base fee (GH₵)" },
  { key: "price_per_km_ghs", label: "Price per km (GH₵)" },
  { key: "min_fee_ghs", label: "Minimum fee (GH₵)" },
  { key: "max_fee_ghs", label: "Maximum fee (GH₵)" },
  { key: "discount_percent", label: "Discount (%)" },
  { key: "manual_review_km", label: "Flag for review beyond (km)" },
  { key: "max_delivery_km", label: "Maximum delivery distance (km)" },
  { key: "peak_start_hour", label: "Peak starts (hour, 0–23)" },
  { key: "peak_end_hour", label: "Peak ends (hour, 0–23)" },
  { key: "peak_uplift_percent", label: "Peak uplift (%)" },
  { key: "default_prep_minutes", label: "Kitchen prep time (minutes)" },
  { key: "eta_buffer_minutes", label: "Delivery time buffer (minutes)" },
  { key: "rider_ping_seconds", label: "Rider location update (seconds)" },
];

const TOGGLES: { key: string; label: string; hint: string }[] = [
  { key: "delivery_enabled", label: "Accept delivery orders", hint: "Turn off to pause doorstep delivery." },
  { key: "auto_assign_riders", label: "Auto-assign riders", hint: "Pick the first available rider automatically." },
  { key: "customer_tracking_enabled", label: "Customer tracking link", hint: "Let guests follow their order live." },
  { key: "delivery_emails_enabled", label: "Delivery emails", hint: "Send status emails to the guest." },
];

export default function DeliverySettingsPanel({ canEdit }: { canEdit: boolean }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("delivery_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast({ title: "Could not load settings", description: error.message, variant: "destructive" });
        setSettings(data ?? null);
      });
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const payload: Settings = {
      origin_address: settings.origin_address,
      service_area_label: settings.service_area_label,
      reference_rate_ghs: Number(settings.reference_rate_ghs),
    };
    NUMBER_FIELDS.forEach((f) => {
      const n = Number(settings[f.key]);
      if (Number.isFinite(n)) payload[f.key] = n;
    });
    TOGGLES.forEach((t) => {
      payload[t.key] = !!settings[t.key];
    });

    const { error } = await supabase.from("delivery_settings").update(payload).eq("id", settings.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Delivery settings saved" });
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const set = (k: string, v: any) => setSettings({ ...settings, [k]: v });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <Switch
                checked={!!settings[t.key]}
                disabled={!canEdit}
                onCheckedChange={(v) => set(t.key, v)}
              />
            </div>
          ))}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pick-up address</Label>
              <Input
                value={settings.origin_address ?? ""}
                disabled={!canEdit}
                onChange={(e) => set("origin_address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service area shown to guests</Label>
              <Input
                value={settings.service_area_label ?? ""}
                disabled={!canEdit}
                onChange={(e) => set("service_area_label", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pricing and timing</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          {NUMBER_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input
                type="number"
                step="0.01"
                value={settings[f.key] ?? 0}
                disabled={!canEdit}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save settings"}
          </Button>
        </div>
      )}

      <RiderCompensationCard canEdit={canEdit} />
    </div>
  );
}
