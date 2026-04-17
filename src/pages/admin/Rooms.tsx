import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, BedDouble, RefreshCw } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import type { Tables } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";

type Room = Tables<"rooms">;

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  base_price_ghs: 0,
  bed_type: "",
  size_sqm: 0,
  max_adults: 2,
  max_children: 1,
  is_active: true,
  amenities: "",
  total_units: 1,
  image_url: "",
};

export default function AdminRooms() {
  const qc = useQueryClient();
  const { format: fc } = useCurrency();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: rooms, isLoading, isFetching } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Room[];
    },
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const images = form.image_url.trim() ? [form.image_url.trim()] : null;
      const newBasePrice = Number(form.base_price_ghs) || 0;
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description || null,
        base_price_ghs: newBasePrice,
        bed_type: form.bed_type || null,
        size_sqm: form.size_sqm || null,
        max_adults: form.max_adults,
        max_children: form.max_children,
        is_active: form.is_active,
        amenities: form.amenities ? form.amenities.split(",").map((a) => a.trim()) : null,
        total_units: Math.max(1, Number(form.total_units) || 1),
        images,
      } as any;

      // Detect base-price change to trigger downstream rate re-sync
      let basePriceChanged = false;
      if (editId) {
        const existing = rooms?.find((r) => r.id === editId);
        basePriceChanged = !!existing && Number(existing.base_price_ghs) !== newBasePrice;
        const { error } = await supabase.from("rooms").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert(payload);
        if (error) throw error;
      }
      return { basePriceChanged };
    },
    onSuccess: async (result) => {
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success(editId ? "Room updated" : "Room created");
      setOpen(false);
      resetForm();

      // If base price changed, the DB trigger has already cleared stale
      // rate_overrides. Re-run the dynamic pricing engine so fresh rates
      // are computed from the new base price across the next 90 days.
      if (result?.basePriceChanged) {
        try {
          await supabase.functions.invoke("dynamic-pricing", {
            body: { days_ahead: 90 },
          });
          qc.invalidateQueries({ queryKey: ["admin-inventory"] });
          toast.success("Inventory rates re-synced");
        } catch (err) {
          console.error("Dynamic pricing re-sync failed", err);
          toast.error("Saved, but rate re-sync failed. Run pricing engine manually.");
        }
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const openEdit = (room: Room) => {
    setEditId(room.id);
    setForm({
      name: room.name,
      slug: room.slug,
      description: room.description || "",
      base_price_ghs: room.base_price_ghs,
      bed_type: room.bed_type || "",
      size_sqm: room.size_sqm || 0,
      max_adults: room.max_adults,
      max_children: room.max_children,
      is_active: room.is_active,
      amenities: room.amenities?.join(", ") || "",
      total_units: (room as any).total_units ?? 1,
      image_url: room.images?.[0] || "",
    });
    setOpen(true);
  };

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const refreshing = isLoading || isFetching;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-foreground">Room Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin-rooms"] })}
            disabled={refreshing}
            title="Refresh rooms"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Room</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Room" : "New Room"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Base Price ($) *</Label>
                    <Input type="number" value={form.base_price_ghs} onChange={(e) => set("base_price_ghs", +e.target.value)} />
                  </div>
                  <div>
                    <Label>Bed Type</Label>
                    <Input value={form.bed_type} onChange={(e) => set("bed_type", e.target.value)} />
                  </div>
                  <div>
                    <Label>Size (sqm)</Label>
                    <Input type="number" value={form.size_sqm} onChange={(e) => set("size_sqm", +e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Adults</Label>
                    <Input type="number" value={form.max_adults} onChange={(e) => set("max_adults", +e.target.value)} />
                  </div>
                  <div>
                    <Label>Max Children</Label>
                    <Input type="number" value={form.max_children} onChange={(e) => set("max_children", +e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Amenities (comma-separated)</Label>
                  <Input value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="WiFi, Pool, AC" />
                </div>
                <div>
                  <Label>Total Rooms (units) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.total_units}
                    onChange={(e) => set("total_units", +e.target.value)}
                    placeholder="e.g. 5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many physical rooms exist of this type. Used for inventory & availability.
                  </p>
                </div>
                <div>
                  <Label>Room Image</Label>
                  <ImageUpload
                    value={form.image_url}
                    onChange={(url) => set("image_url", url)}
                    folder="rooms"
                    label="Upload Room Photo"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Total Units</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms?.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {room.images?.[0] ? (
                        <img src={room.images[0]} alt={room.name} className="w-10 h-10 rounded object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <BedDouble className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{room.name}</p>
                        {room.size_sqm && <p className="text-xs text-muted-foreground">{room.size_sqm} sqm</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{fc(room.base_price_ghs)}</TableCell>
                  <TableCell>{room.bed_type || "—"}</TableCell>
                  <TableCell>{room.max_adults}A / {room.max_children}C</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {(room as any).total_units ?? 1} {((room as any).total_units ?? 1) === 1 ? "unit" : "units"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.is_active ? "default" : "secondary"}>
                      {room.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rooms?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rooms configured</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
