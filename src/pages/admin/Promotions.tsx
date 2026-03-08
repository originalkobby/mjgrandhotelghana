import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Tag,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Promotion {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
  room_restrictions: string[] | null;
  created_at: string;
}

interface Room {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  start_date: "",
  end_date: "",
  is_active: true,
  usage_limit: "",
  room_restrictions: [] as string[],
};

async function fetchPromotions() {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Promotion[];
}

async function fetchRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Room[];
}

export default function Promotions() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: fetchPromotions,
    staleTime: 30_000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["admin-rooms-list"],
    queryFn: fetchRooms,
    staleTime: 60_000,
  });

  const filtered = promotions.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      code: p.code,
      description: p.description ?? "",
      discount_type: p.discount_type,
      discount_value: p.discount_value.toString(),
      start_date: p.start_date ?? "",
      end_date: p.end_date ?? "",
      is_active: p.is_active,
      usage_limit: p.usage_limit?.toString() ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount_value) {
      toast({ title: "Missing fields", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("promotions").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("promotions").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Updated" : "Created", description: `Promo code ${payload.code} saved.` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("promotions").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `Promo ${deleteTarget.code} removed.` });
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    }
  };

  const toggleActive = async (p: Promotion) => {
    const { error } = await supabase
      .from("promotions")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    }
  };

  const copyCode = (p: Promotion) => {
    navigator.clipboard.writeText(p.code);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            Promotions
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Create and manage promo codes & discounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4" /> New Promo
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-promotions"] })}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search promos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="font-sans"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Code</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Discount</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider hidden md:table-cell">Validity</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Usage</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-muted rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-sans">
                        {search ? "No promos match your search" : "No promotions yet — create your first one!"}
                      </TableCell>
                    </TableRow>
                  )
                  : filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono font-semibold text-foreground">{p.code}</span>
                          <button
                            onClick={() => copyCode(p)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy code"
                          >
                            {copiedId === p.id ? (
                              <Check className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                            {p.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-sans">
                        <span className="font-medium text-foreground">
                          {p.discount_type === "percentage"
                            ? `${p.discount_value}%`
                            : `GH₵ ${Number(p.discount_value).toLocaleString()}`}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {p.discount_type === "percentage" ? "off" : "flat"}
                        </span>
                      </TableCell>
                      <TableCell className="font-sans text-sm hidden md:table-cell">
                        {p.start_date && p.end_date ? (
                          <span className="text-muted-foreground">
                            {format(new Date(p.start_date), "MMM d")} – {format(new Date(p.end_date), "MMM d, yyyy")}
                          </span>
                        ) : p.start_date ? (
                          <span className="text-muted-foreground">From {format(new Date(p.start_date), "MMM d, yyyy")}</span>
                        ) : p.end_date ? (
                          <span className="text-muted-foreground">Until {format(new Date(p.end_date), "MMM d, yyyy")}</span>
                        ) : (
                          <span className="text-muted-foreground/50">No dates set</span>
                        )}
                      </TableCell>
                      <TableCell className="font-sans text-sm">
                        <span className="text-foreground">{p.usage_count}</span>
                        <span className="text-muted-foreground">
                          {p.usage_limit ? ` / ${p.usage_limit}` : " / ∞"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`cursor-pointer ${
                            p.is_active
                              ? "bg-accent/20 text-accent border-accent/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => toggleActive(p)}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(p)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit Promotion" : "Create Promotion"}
            </DialogTitle>
            <DialogDescription className="font-sans">
              {editingId ? "Update the promo code details below." : "Set up a new promotional discount."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Promo Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (GH₵)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  Discount Value {form.discount_type === "percentage" ? "(%)" : "(GH₵)"}
                </Label>
                <Input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === "percentage" ? "e.g. 15" : "e.g. 50"}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Usage Limit</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Internal note about this promo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Guests can use this code at checkout</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Promotion?</DialogTitle>
            <DialogDescription className="font-sans">
              This will permanently remove <strong>{deleteTarget?.code}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
