import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UtensilsCrossed, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "Hot Appetizers", "Salads", "Chicken Meals", "Kids Meals", "Fish Meals",
  "Beef Meals", "Seafood", "MJ Specials", "Local Dishes", "Burgers & Sandwiches",
  "Pizza", "Vegetarian", "Desserts", "Extras", "Side Orders", "Take Out Packs",
];

type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: string;
  is_active: boolean;
  sort_order: number;
};

const emptyForm = {
  category: "Hot Appetizers",
  name: "",
  description: "",
  price: "",
  is_active: true,
  sort_order: 0,
};

export default function AdminMenu() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: items, isLoading, isFetching } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("category")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MenuItem[];
    },
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category: form.category,
        name: form.name,
        description: form.description || "",
        price: form.price,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      if (editId) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
      toast.success(editId ? "Item updated" : "Item added");
      setOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
      toast.success("Item deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const openEdit = (item: MenuItem) => {
    setEditId(item.id);
    setForm({
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setOpen(true);
  };

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const filtered = items?.filter((i) => filterCategory === "all" || i.category === filterCategory) || [];

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const refreshing = isLoading || isFetching;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-serif text-foreground">Menu Management</h1>
          <Badge variant="secondary">{items?.length || 0} items</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin-menu-items"] })}
            disabled={refreshing}
            title="Refresh menu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Menu Item" : "New Menu Item"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price *</Label>
                    <Input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="GH₵ 150" />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", +e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.price || saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h2 className="font-serif text-sm font-semibold text-foreground">{category}</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.description || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.price}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {Object.keys(grouped).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No menu items found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
