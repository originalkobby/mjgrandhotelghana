import { Navigate, Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";


export default function AdminLayout() {
  const { user, role, loading } = useAdminAuth();
  const { adminMode, setAdminMode, rate } = useCurrency();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="admin-shell min-h-screen flex w-full">
        <AdminSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center gap-3 border-b border-border/40 px-4 md:px-6 bg-admin-bar text-admin-bar-foreground shrink-0 sticky top-0 z-30">
            <SidebarTrigger className="text-admin-bar-foreground/80 hover:text-admin-bar-foreground" />
            <span className="font-serif text-lg md:text-xl tracking-wide text-admin-bar-foreground flex-1">
              Booking Command Center
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-md border border-accent/50 p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminMode("usd")}
                  className={`h-7 px-2.5 text-[11px] font-sans gap-1 uppercase tracking-[0.14em] rounded-sm ${
                    adminMode === "usd"
                      ? "bg-accent text-accent-foreground hover:bg-accent"
                      : "text-admin-bar-foreground/80 hover:bg-transparent hover:text-admin-bar-foreground"
                  }`}
                >
                  <DollarSign className="w-3 h-3" /> USD
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminMode("ghs")}
                  className={`h-7 px-2.5 text-[11px] font-sans uppercase tracking-[0.14em] rounded-sm ${
                    adminMode === "ghs"
                      ? "bg-accent text-accent-foreground hover:bg-accent"
                      : "text-admin-bar-foreground/80 hover:bg-transparent hover:text-admin-bar-foreground"
                  }`}
                >
                  GH₵
                </Button>
              </div>
              <span className="text-[10px] tracking-[0.14em] uppercase text-admin-bar-foreground/70 font-sans hidden sm:inline">
                1 USD = {rate.toFixed(2)} GHS
              </span>
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

    </SidebarProvider>
  );
}
