import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, CalendarCheck, AlertTriangle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "booking" | "ticket" | "conversation";
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
}

const ICON_MAP = {
  booking: CalendarCheck,
  ticket: AlertTriangle,
  conversation: MessageCircle,
};

const COLOR_MAP = {
  booking: "text-emerald-500",
  ticket: "text-amber-500",
  conversation: "text-blue-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => [
      { ...n, id: crypto.randomUUID(), read: false, createdAt: new Date() },
      ...prev.slice(0, 49), // keep max 50
    ]);
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const b = payload.new as any;
          addNotification({
            type: "booking",
            title: "New Booking",
            body: `Ref ${b.reference_code} — $${Math.round(Number(b.final_total_ghs) / 16).toLocaleString()}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const b = payload.new as any;
          addNotification({
            type: "booking",
            title: "Booking Updated",
            body: `Ref ${b.reference_code} → ${b.status}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        (payload) => {
          const t = payload.new as any;
          addNotification({
            type: "ticket",
            title: `Support Ticket (${t.urgency})`,
            body: t.issue?.slice(0, 80) || "New issue reported",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const c = payload.new as any;
          if (c.role === "user") {
            addNotification({
              type: "conversation",
              title: "Guest Message",
              body: c.message?.slice(0, 80) || "New message",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-serif text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No notifications yet
                </p>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors ${
                        !n.read ? "bg-accent/5" : ""
                      }`}
                    >
                      <Icon size={16} className={`mt-0.5 shrink-0 ${COLOR_MAP[n.type]}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
