import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { TicketCheck, RefreshCw } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_progress: "default",
  resolved: "secondary",
  closed: "outline",
};

const URGENCY_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

export default function SupportTickets() {
  const qc = useQueryClient();

  const { data: tickets, isLoading, isFetching } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, guests(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Ticket updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const refreshing = isLoading || isFetching;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TicketCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-serif text-foreground">Support Tickets</h1>
        <Badge variant="secondary" className="ml-auto">{tickets?.length || 0} tickets</Badge>
        <Button
          variant="outline"
          size="icon"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-support-tickets"] })}
          disabled={refreshing}
          title="Refresh tickets"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room #</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="w-36">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.reference_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{(t.guests as any)?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{(t.guests as any)?.email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{(t as any).room_number || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{t.issue}</TableCell>
                  <TableCell>
                    <Badge variant={URGENCY_COLORS[t.urgency] || "outline"} className="capitalize">{t.urgency}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[t.status] || "outline"} className="capitalize">{t.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(t.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {tickets?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No support tickets</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
