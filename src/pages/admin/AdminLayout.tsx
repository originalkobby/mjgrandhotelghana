import { Outlet, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const AdminLayout = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  const isAdmin = user?.publicMetadata?.role === "admin" || user?.emailAddresses.some(e => e.emailAddress.endsWith("@mjgrandhotelghana.com"));

  if (!isSignedIn || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-layout">
      <nav className="p-4 bg-primary text-primary-foreground">
        Admin Dashboard
      </nav>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
