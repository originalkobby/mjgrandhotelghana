import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Bike, KeyRound, Loader2, Pencil, Plus } from "lucide-react";

export type Rider = {
  id: string;
  user_id: string | null;
  rider_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  vehicle_type: string;
  vehicle_reference: string | null;
  status: string;
  is_active: boolean;
  notes: string | null;
  last_active_at: string | null;
};

const VEHICLES = ["motorbike", "bicycle", "car", "van", "on_foot"];
const STATUSES = ["available", "busy", "offline", "suspended"];

const blank = {
  full_name: "",
  phone: "",
  email: "",
  vehicle_type: "motorbike",
  vehicle_reference: "",
  notes: "",
  status: "offline",
  login_password: "",
};

function nextCode(existing: Rider[]) {
  const nums = existing
    .map((r) => Number(String(r.rider_code).replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `RID-${String(next).padStart(3, "0")}`;
}

export default function RidersPanel({ canManage }: { canManage: boolean }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [pwFor, setPwFor] = useState<Rider | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("delivery_riders")
      .select(
        "id, user_id, rider_code, full_name, phone, email, vehicle_type, vehicle_reference, status, is_active, notes, last_active_at",
      )
      .order("full_name");
    if (error) toast({ title: "Could not load riders", description: error.message, variant: "destructive" });
    setRiders((data as Rider[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  }

  function openEdit(r: Rider) {
    setEditing(r);
    setForm({
      full_name: r.full_name,
      phone: r.phone,
      email: r.email ?? "",
      vehicle_type: r.vehicle_type,
      vehicle_reference: r.vehicle_reference ?? "",
      notes: r.notes ?? "",
      status: r.status,
      login_password: "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("delivery_riders")
          .update({
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            vehicle_type: form.vehicle_type,
            vehicle_reference: form.vehicle_reference.trim() || null,
            notes: form.notes.trim() || null,
            status: form.status as Rider["status"],
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Rider updated" });
      } else {
        let userId: string | null = null;

        // Optional login for the rider portal.
        if (form.login_password.trim()) {
          if (!form.email.trim()) throw new Error("An email is required to create a rider login.");
          const { data, error } = await supabase.functions.invoke("admin-users", {
            body: {
              action: "create_rider_account",
              email: form.email.trim(),
              password: form.login_password.trim(),
              full_name: form.full_name.trim(),
            },
          });
          if (error || (data as any)?.error) {
            throw new Error((data as any)?.error ?? error?.message ?? "Could not create the rider login.");
          }
          userId = (data as any).user_id ?? null;
        }

        const { error } = await supabase.from("delivery_riders").insert({
          rider_code: nextCode(riders),
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          vehicle_type: form.vehicle_type,
          vehicle_reference: form.vehicle_reference.trim() || null,
          notes: form.notes.trim() || null,
          status: form.status as Rider["status"],
          user_id: userId,
        });
        if (error) throw error;
        toast({
          title: "Rider added",
          description: userId ? "They can now sign in at /rider." : "No login was created for this rider.",
        });
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: Rider, active: boolean) {
    const { error } = await supabase
      .from("delivery_riders")
      .update({ is_active: active, status: active ? r.status : "offline" })
      .eq("id", r.id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: active ? "Rider activated" : "Rider deactivated" });
    load();
  }

  async function savePassword() {
    if (!pwFor?.user_id) return;
    if (newPassword.trim().length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_rider_password", userId: pwFor.user_id, password: newPassword.trim() },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Could not change the password",
        description: (data as any)?.error ?? error?.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Password updated" });
    setPwFor(null);
    setNewPassword("");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {riders.length} rider{riders.length === 1 ? "" : "s"} · only active riders can be assigned to a delivery.
        </p>
        {canManage && (
          <Button onClick={openNew} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add rider
          </Button>
        )}
      </div>

      {riders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No riders yet. Add one so deliveries can be dispatched.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {riders.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-serif text-lg text-foreground flex items-center gap-2">
                    <Bike className="w-4 h-4 text-muted-foreground" /> {r.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.rider_code} · {r.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.vehicle_type.replace("_", " ")}
                    {r.vehicle_reference ? ` · ${r.vehicle_reference}` : ""}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline">{r.status}</Badge>
                    {!r.is_active && <Badge variant="outline">inactive</Badge>}
                    {!r.user_id && <Badge variant="outline">no login</Badge>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex flex-col items-end gap-2">
                    <Switch checked={r.is_active} onCheckedChange={(v) => toggleActive(r, v)} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    {r.user_id && (
                      <Button variant="ghost" size="sm" onClick={() => setPwFor(r)}>
                        <KeyRound className="w-3.5 h-3.5 mr-1" /> Password
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit rider" : "Add rider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plate / reference</Label>
                <Input
                  value={form.vehicle_reference}
                  onChange={(e) => setForm({ ...form, vehicle_reference: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {!editing && (
              <div className="space-y-1.5 rounded-md border p-3">
                <Label>Rider portal password</Label>
                <Input
                  type="text"
                  value={form.login_password}
                  onChange={(e) => setForm({ ...form, login_password: e.target.value })}
                  placeholder="Leave blank for no login"
                />
                <p className="text-xs text-muted-foreground">
                  Fill this in with the rider's email to give them access to the rider app at /rider.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save changes" : "Add rider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwFor} onOpenChange={(o) => !o && setPwFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password for {pwFor?.full_name}</DialogTitle>
          </DialogHeader>
          <Input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwFor(null)}>
              Cancel
            </Button>
            <Button onClick={savePassword} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
