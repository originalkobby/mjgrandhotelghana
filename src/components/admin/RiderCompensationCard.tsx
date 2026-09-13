import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Rule = Record<string, any>;

const MODELS = [
  { value: "fixed", label: "Fixed amount per delivery" },
  { value: "per_km", label: "Distance based (per km)" },
  { value: "percentage", label: "Percentage of the delivery fee" },
  { value: "hybrid", label: "Hybrid (base + distance + percentage)" },
];

const FIELDS: { key: string; label: string }[] = [
  { key: "base_ghs", label: "Base rider fee (GH₵)" },
  { key: "per_km_ghs", label: "Per kilometre (GH₵)" },
  { key: "percent_of_fee", label: "Percentage of delivery fee (%)" },
  { key: "min_earning_ghs", label: "Minimum earning (GH₵)" },
  { key: "max_earning_ghs", label: "Maximum earning (GH₵)" },
  { key: "peak_bonus_ghs", label: "Peak-time bonus (GH₵)" },
];

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default function RiderCompensationCard({ canEdit }: { canEdit: boolean }) {
  const [rule, setRule] = useState<Rule | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peak, setPeak] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    supabase
      .from("rider_compensation_rules")
      .select("*")
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        setRule(data ?? null);
        setLoading(false);
      });
    supabase
      .from("delivery_settings")
      .select("peak_start_hour, peak_end_hour")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPeak({ start: Number(data.peak_start_hour), end: Number(data.peak_end_hour) });
      });
  }, []);

  async function save() {
    if (!rule) return;
    setSaving(true);
    const payload: Rule = { model: rule.model };
    FIELDS.forEach((f) => {
      const n = Number(rule[f.key]);
      if (Number.isFinite(n) && n >= 0) payload[f.key] = n;
    });
    const { error } = await supabase
      .from("rider_compensation_rules")
      .update(payload)
      .eq("id", rule.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Rider pay rule saved",
      description: "Earnings already recorded keep the rule that created them.",
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rule) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          No rider pay rule is set up yet.
        </CardContent>
      </Card>
    );
  }

  const set = (k: string, v: any) => setRule({ ...rule, [k]: v });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rider compensation</CardTitle>
        <p className="text-xs text-muted-foreground">
          What the hotel pays the rider. This is separate from the delivery fee the guest pays.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5 max-w-sm">
          <Label className="text-xs">Active model</Label>
          <Select value={rule.model} disabled={!canEdit} onValueChange={(v) => set("model", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rule[f.key] ?? 0}
                disabled={!canEdit}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Peak window:{" "}
          {peak ? `${pad(peak.start)}–${pad(peak.end)}` : "loading…"} — set once under Pricing and
          timing above, and used for both the guest peak uplift and this rider bonus.
        </p>

        {canEdit && (
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save rider pay rule"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
