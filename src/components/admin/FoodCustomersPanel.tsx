import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, RefreshCw, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeGB } from "@/lib/dateUtils";

type FoodCustomer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  visit_count: number;
  source: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

const SOURCE_LABELS: Record<string, string> = {
  device: "Device form",
  order: "Order",
};

function sourceLabel(source: string | null): string {
  return SOURCE_LABELS[source ?? "device"] ?? "Device form";
}

async function fetchCustomers(): Promise<FoodCustomer[]> {
  const { data, error } = await supabase
    .from("food_customers")
    .select("id, full_name, email, phone, visit_count, source, first_seen_at, last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data as FoodCustomer[]) ?? [];
}

function toCsv(rows: FoodCustomer[]): string {
  const header = ["Name", "Email", "Phone", "Visits", "Source", "First seen", "Last seen"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.full_name,
      r.email,
      r.phone ?? "",
      r.visit_count,
      sourceLabel(r.source),
      formatDateTimeGB(r.first_seen_at),
      formatDateTimeGB(r.last_seen_at),
    ]
      .map(esc)
      .join(","),
  );
  return [header.map(esc).join(","), ...lines].join("\n");
}

export default function FoodCustomersPanel({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-food-customers"],
    queryFn: fetchCustomers,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  function exportCsv() {
    if (!filtered.length) {
      toast.error("Nothing to export");
      return;
    }
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `food-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("food_customers").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-food-customers"] });
    toast.success("Customer removed");
  }

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-serif text-foreground">Customers</h2>
          <Badge variant="secondary">{customers?.length || 0} captured</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone"
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-food-customers"] })}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Visits</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">First seen</th>
                  <th className="px-4 py-3 font-medium">Last seen</th>
                  {isAdmin && <th className="px-4 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="text-center py-16 text-muted-foreground"
                    >
                      No customers captured yet
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                      <td className="px-4 py-3 font-medium text-foreground">{c.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{c.phone}</td>
                      <td className="px-4 py-3 tabular-nums">{c.visit_count}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDateTimeGB(c.first_seen_at)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDateTimeGB(c.last_seen_at)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === c.id}
                            onClick={() => remove(c.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
