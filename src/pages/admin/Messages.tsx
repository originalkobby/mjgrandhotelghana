import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Mail, MailOpen, Search, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

async function fetchMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: fetchMessages,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.is_read) markRead.mutate(msg.id);
  };

  const filtered = messages.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Messages</h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
              : "All messages read"}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-sans text-sm">
            {search ? "No messages match your search" : "No messages yet"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Preview</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((msg) => (
                <TableRow
                  key={msg.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${!msg.is_read ? "bg-accent/5" : ""}`}
                  onClick={() => openMessage(msg)}
                >
                  <TableCell>
                    {msg.is_read ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-accent" />
                    )}
                  </TableCell>
                  <TableCell className="font-sans font-medium">
                    {msg.full_name}
                    {!msg.is_read && (
                      <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-sans text-muted-foreground">
                    {msg.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-sans text-muted-foreground max-w-xs truncate">
                    {msg.message}
                  </TableCell>
                  <TableCell className="text-right font-sans text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(msg.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg">
                Message from {selected.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1">
                <span className="font-sans text-xs text-muted-foreground">Email</span>
                <a
                  href={`mailto:${selected.email}`}
                  className="font-sans text-sm text-accent hover:underline"
                >
                  {selected.email}
                </a>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-sans text-xs text-muted-foreground">Received</span>
                <span className="font-sans text-sm">
                  {format(new Date(selected.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-sans text-xs text-muted-foreground">Message</span>
                <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-md p-3">
                  {selected.message}
                </p>
              </div>
              <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${selected.email}?subject=Re: Your message to MJ Grand Hotel`}>
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
