import { Navigate, Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout() {
  const { user, role, loading } = useAdminAuth();

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
          <header className="h-14 flex items-center gap-3 border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <span className="font-serif text-lg text-foreground flex-1">Booking Command Center</span>
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
