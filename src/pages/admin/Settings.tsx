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
import { Settings2, ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { Tables } from "@/integrations/supabase/types";

type CancelPolicy = Tables<"cancellation_policies">;

const emptyPolicy = {
  name: "",
  description: "",
  deadline_hours: 24,
  refund_percentage: 100,
  is_default: false,
};

export default function AdminSettings() {
  const qc = useQueryClient();
  const { user: currentUser } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPolicy);
  const [deleteTarget, setDeleteTarget] = useState<{ user_id: string; name: string } | null>(null);

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

  const deleteUserMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("User deleted");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
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

  if (loadingPolicies || loadingRoles) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        
        <h1 className="text-2xl font-serif text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Cancellation Policies</TabsTrigger>
          <TabsTrigger value="roles">Staff Roles</TabsTrigger>
        </TabsList>

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
