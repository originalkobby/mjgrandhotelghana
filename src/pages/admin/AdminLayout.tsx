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
import RateRefreshIndicator from "@/components/admin/RateRefreshIndicator";

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
      <div className="min-h-screen flex w-full">
        <AdminSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center gap-3 border-b border-border px-4 bg-card shrink-0 sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <span className="font-serif text-lg text-foreground flex-1">Booking Command Center</span>

            {/* Currency Toggle + Refresh Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                <Button
                  variant={adminMode === "usd" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAdminMode("usd")}
                  className="h-7 px-2.5 text-xs font-sans gap-1"
                >
                  <DollarSign className="w-3 h-3" /> USD
                </Button>
                <Button
                  variant={adminMode === "ghs" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAdminMode("ghs")}
                  className="h-7 px-2.5 text-xs font-sans"
                >
                  GH₵
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground font-sans hidden sm:inline">
                1 USD = {rate.toFixed(2)} GHS
              </span>
              <RateRefreshIndicator />
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
