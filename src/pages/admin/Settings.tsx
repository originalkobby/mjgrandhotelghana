import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { ShieldCheck, Plus, Pencil } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatDateGB } from "@/lib/dateUtils";
import { ChangePasswordCard } from "@/components/admin/ChangePasswordCard";

type CancelPolicy = Tables<"cancellation_policies">;

const emptyPolicy = {
  name: "",
  description: "",
  deadline_hours: 24,
  refund_percentage: 100,
  is_default: false,
};

const emptyZone = {
  id: undefined as string | undefined,
  name: "",
  fee_ghs: 0,
  is_active: true,
  sort_order: 0,
};


export default function AdminSettings() {
  const qc = useQueryClient();
  const { user, role } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPolicy);
  const [rateInput, setRateInput] = useState<string>("");
  const [confirmRate, setConfirmRate] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZone);


  const canEditRate = role === "admin" || role === "operations_manager";

  const { data: currency, isLoading: loadingCurrency } = useQuery({
    queryKey: ["admin-currency-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "currency")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const { data: rateAuthor } = useQuery({
    queryKey: ["admin-currency-author", currency?.updated_by],
    enabled: !!currency?.updated_by,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currency!.updated_by as string)
        .maybeSingle();
      return data?.full_name ?? null;
    },
    staleTime: 60_000,
  });

  const saveRateMutation = useMutation({
    mutationFn: async () => {
      const value = Number(rateInput);
      const { error } = await supabase
        .from("app_settings")
        .update({ usd_to_ghs: value, updated_by: user?.id ?? null })
        .eq("key", "currency");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-currency-setting"] });
      toast.success("Exchange rate updated");
      setConfirmRate(false);
      setRateInput("");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  // Cancellation Policies
  const { data: policies, isLoading: loadingPolicies } = useQuery({
    queryKey: ["admin-cancel-policies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cancellation_policies").select("*").order("deadline_hours");
      if (error) throw error;
      return data as CancelPolicy[];
    },
    staleTime: 60_000,
  });

  // Delivery zones
  const { data: zones } = useQuery({
    queryKey: ["admin-delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Tables<"delivery_zones">[];
    },
    staleTime: 60_000,
  });

  const saveZoneMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      fee_ghs: number;
      is_active: boolean;
      sort_order: number;
    }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("delivery_zones").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("delivery_zones").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("Delivery zone saved");
      setZoneOpen(false);
      setZoneForm(emptyZone);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // User Roles
  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, role, user_id, profiles:user_id(full_name)")
        .order("role");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });


  const savePolicyMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        deadline_hours: form.deadline_hours,
        refund_percentage: form.refund_percentage,
        is_default: form.is_default,
      };
      if (editId) {
        const { error } = await supabase.from("cancellation_policies").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cancellation_policies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cancel-policies"] });
      toast.success(editId ? "Policy updated" : "Policy created");
      setOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm(emptyPolicy);
    setEditId(null);
  };

  const openEdit = (p: CancelPolicy) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      deadline_hours: p.deadline_hours,
      refund_percentage: p.refund_percentage,
      is_default: p.is_default,
    });
    setOpen(true);
  };

  const set = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  if (loadingPolicies || loadingRoles || loadingCurrency) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const currentRate = Number(currency?.usd_to_ghs ?? 12.5);
  const parsedRate = Number(rateInput);
  const rateValid = Number.isFinite(parsedRate) && parsedRate >= 1 && parsedRate <= 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-serif text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Cancellation Policies</TabsTrigger>
          <TabsTrigger value="roles">Staff Roles</TabsTrigger>
          <TabsTrigger value="currency">Exchange Rate</TabsTrigger>
          {canEditRate && <TabsTrigger value="delivery">Delivery Zones</TabsTrigger>}
        </TabsList>

        {canEditRate && (
          <TabsContent value="delivery" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={zoneOpen}
                onOpenChange={(v) => {
                  setZoneOpen(v);
                  if (!v) setZoneForm(emptyZone);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{zoneForm.id ? "Edit Delivery Zone" : "New Delivery Zone"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div>
                      <Label>Zone name *</Label>
                      <Input
                        value={zoneForm.name}
                        onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Delivery fee (GH₵)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          value={zoneForm.fee_ghs}
                          onChange={(e) => setZoneForm((p) => ({ ...p, fee_ghs: +e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Sort order</Label>
                        <Input
                          type="number"
                          value={zoneForm.sort_order}
                          onChange={(e) => setZoneForm((p) => ({ ...p, sort_order: +e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zoneForm.is_active}
                        onCheckedChange={(v) => setZoneForm((p) => ({ ...p, is_active: v }))}
                      />
                      <Label>Active (visible to guests)</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setZoneOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => saveZoneMutation.mutate(zoneForm)}
                      disabled={!zoneForm.name || saveZoneMutation.isPending}
                    >
                      {saveZoneMutation.isPending ? "Saving…" : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones?.map((z) => (
                      <TableRow key={z.id}>
                        <TableCell className="font-medium text-foreground">{z.name}</TableCell>
                        <TableCell className="tabular-nums">GH₵ {Number(z.fee_ghs).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={z.is_active ? "default" : "secondary"}>
                            {z.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setZoneForm({
                                id: z.id,
                                name: z.name,
                                fee_ghs: Number(z.fee_ghs),
                                is_active: z.is_active,
                                sort_order: z.sort_order,
                              });
                              setZoneOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {zones?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No delivery zones
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}



        <TabsContent value="currency" className="mt-4">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base font-serif">USD → GH₵ Exchange Rate</CardTitle>
              <CardDescription>
                Used across the public website, the dashboard, and MJ AI quotes. Existing bookings keep their stored totals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current rate</p>
                <p className="text-2xl font-serif text-foreground tabular-nums mt-1">
                  1 USD = {currentRate.toFixed(2)} GH₵
                </p>
                {currency?.updated_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated {formatDateGB(currency.updated_at)}
                    {rateAuthor ? ` by ${rateAuthor}` : ""}
                  </p>
                )}
              </div>

              {canEditRate ? (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    New rate (GH₵ per 1 USD)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={1}
                      max={100}
                      value={rateInput}
                      placeholder={currentRate.toFixed(2)}
                      onChange={(e) => setRateInput(e.target.value)}
                      className="max-w-[180px] tabular-nums"
                    />
                    <Button
                      onClick={() => setConfirmRate(true)}
                      disabled={!rateValid || parsedRate === currentRate || saveRateMutation.isPending}
                    >
                      {saveRateMutation.isPending ? "Saving…" : "Save Rate"}
                    </Button>
                  </div>
                  {rateInput && !rateValid && (
                    <p className="text-xs text-destructive">Enter a number between 1 and 100.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only administrators and operations managers can change the exchange rate.
                </p>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={confirmRate} onOpenChange={setConfirmRate}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update exchange rate?</AlertDialogTitle>
                <AlertDialogDescription>
                  All GH₵ prices on the website, dashboard, and MJ AI will immediately use
                  1 USD = {rateValid ? parsedRate.toFixed(2) : "—"} GH₵.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => saveRateMutation.mutate()}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>


        <TabsContent value="policies" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Policy</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editId ? "Edit Policy" : "New Policy"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div>
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Deadline (hours before check-in)</Label>
                      <Input type="number" value={form.deadline_hours} onChange={(e) => set("deadline_hours", +e.target.value)} />
                    </div>
                    <div>
                      <Label>Refund %</Label>
                      <Input type="number" value={form.refund_percentage} onChange={(e) => set("refund_percentage", +e.target.value)} min={0} max={100} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_default} onCheckedChange={(v) => set("is_default", v)} />
                    <Label>Default policy</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => savePolicyMutation.mutate()} disabled={!form.name || savePolicyMutation.isPending}>
                    {savePolicyMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </TableCell>
                      <TableCell>{p.deadline_hours}h before</TableCell>
                      <TableCell>{p.refund_percentage}%</TableCell>
                      <TableCell>
                        {p.is_default && <Badge variant="default">Default</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {policies?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No policies</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Staff Roles
              </CardTitle>
              <CardDescription>Roles are managed via the database. This is a read-only view.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-foreground">{(r.profiles as any)?.full_name || r.user_id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{r.role.replace("_", " ")}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No roles assigned</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
