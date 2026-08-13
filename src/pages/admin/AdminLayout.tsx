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

            <div className="admin-rail flex items-center h-11 pl-1 pr-1">
              <div className="flex items-center gap-0.5 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminMode("usd")}
                  className={`h-8 px-3 text-[11px] font-sans uppercase tracking-[0.16em] rounded-none transition-colors duration-200 ${
                    adminMode === "usd"
                      ? "bg-accent text-accent-foreground hover:bg-accent border border-accent"
                      : "text-admin-bar-foreground/70 hover:bg-transparent hover:text-admin-bar-foreground border border-accent"
                  }`}
                >
                  $ USD
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminMode("ghs")}
                  className={`h-8 px-3 text-[11px] font-sans uppercase tracking-[0.16em] rounded-none transition-colors duration-200 ${
                    adminMode === "ghs"
                      ? "bg-accent text-accent-foreground hover:bg-accent border border-accent"
                      : "text-admin-bar-foreground/70 hover:bg-transparent hover:text-admin-bar-foreground border border-accent"
                  }`}
                >
                  GH₵
                </Button>
              </div>

              <div className="hidden md:flex flex-col justify-center px-3 leading-none">
                <span className="text-[8px] uppercase tracking-[0.24em] text-admin-bar-foreground/55 font-sans">
                  Exchange Rate
                </span>
                <span className="text-[11px] tracking-[0.08em] text-admin-bar-foreground font-sans tabular-nums mt-0.5">
                  1 USD = {rate.toFixed(2)} GHS
                </span>
              </div>

              <span className="admin-rail-divider" />

              <div className="px-1">
                <NotificationBell />
              </div>
            </div>

          </header>
          <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6 lg:p-8 flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>

    </SidebarProvider>
  );
}
