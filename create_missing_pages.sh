#!/bin/bash

# Create pages directory if it doesn't exist
mkdir -p src/pages/admin

# Create Index.tsx
cat <<EOF > src/pages/Index.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">Welcome to MJ Grand Hotel Ghana</h1>
          <p className="mt-4 text-center text-muted-foreground">Luxury Redefined in Accra</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
EOF

# Create Menu.tsx
cat <<EOF > src/pages/Menu.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Menu = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">Our Menu</h1>
          <p className="mt-4 text-center text-muted-foreground">Delicious dishes for every taste.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Menu;
EOF

# Create Dining.tsx
cat <<EOF > src/pages/Dining.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Dining = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">Dining Options</h1>
          <p className="mt-4 text-center text-muted-foreground">Experience our exquisite culinary offerings.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dining;
EOF

# Create About.tsx
cat <<EOF > src/pages/About.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">About Us</h1>
          <p className="mt-4 text-center text-muted-foreground">Learn more about MJ Grand Hotel Ghana.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
EOF

# Create Policy.tsx
cat <<EOF > src/pages/Policy.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Policy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">Privacy Policy</h1>
          <p className="mt-4 text-center text-muted-foreground">Our commitment to your privacy.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policy;
EOF

# Create GuestServices.tsx
cat <<EOF > src/pages/GuestServices.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GuestServices = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">Guest Services</h1>
          <p className="mt-4 text-center text-muted-foreground">Dedicated to making your stay exceptional.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuestServices;
EOF

# Create GalleryPage.tsx
cat <<EOF > src/pages/GalleryPage.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GalleryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">Our Gallery</h1>
          <p className="mt-4 text-center text-muted-foreground">A visual tour of MJ Grand Hotel Ghana.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GalleryPage;
EOF

# Create NotFound.tsx
cat <<EOF > src/pages/NotFound.tsx
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
EOF

# Create Admin Pages
cat <<EOF > src/pages/admin/Login.tsx
import { SignIn } from "@clerk/clerk-react";

const AdminLogin = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn routing="path" path="/admin/login" />
    </div>
  );
};

export default AdminLogin;
EOF

cat <<EOF > src/pages/admin/AdminLayout.tsx
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
EOF

cat <<EOF > src/pages/admin/Overview.tsx
const Overview = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
      <p>Welcome to the MJ Grand Hotel admin panel.</p>
    </div>
  );
};

export default Overview;
EOF

cat <<EOF > src/pages/admin/Inventory.tsx
const AdminInventory = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Inventory</h1>
      <p>Manage hotel inventory here.</p>
    </div>
  );
};

export default AdminInventory;
EOF

cat <<EOF > src/pages/admin/Messages.tsx
const AdminMessages = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Messages</h1>
      <p>Manage guest messages here.</p>
    </div>
  );
};

export default AdminMessages;
EOF

cat <<EOF > src/pages/admin/Guests.tsx
const AdminGuests = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Guests</h1>
      <p>Manage guest information here.</p>
    </div>
  );
};

export default AdminGuests;
EOF

cat <<EOF > src/pages/admin/Promotions.tsx
const AdminPromotions = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Promotions</h1>
      <p>Manage promotions and offers here.</p>
    </div>
  );
};

export default AdminPromotions;
EOF

cat <<EOF > src/pages/admin/Rooms.tsx
const AdminRooms = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Rooms</h1>
      <p>Manage room details and availability here.</p>
    </div>
  );
};

export default AdminRooms;
EOF

cat <<EOF > src/pages/admin/SupportTickets.tsx
const AdminSupport = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Support Tickets</h1>
      <p>Manage support tickets here.</p>
    </div>
  );
};

export default AdminSupport;
EOF

cat <<EOF > src/pages/admin/Settings.tsx
const AdminSettings = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
      <p>Configure application settings here.</p>
    </div>
  );
};

export default AdminSettings;
EOF

cat <<EOF > src/pages/admin/MenuManagement.tsx
const AdminMenu = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Menu Management</h1>
      <p>Manage menu items here.</p>
    </div>
  );
};

export default AdminMenu;
EOF

cat <<EOF > src/pages/admin/RevenueIntelligence.tsx
const RevenueIntelligence = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Revenue Intelligence</h1>
      <p>View revenue insights and analytics here.</p>
    </div>
  );
};

export default RevenueIntelligence;
EOF

cat <<EOF > src/pages/admin/GalleryManagement.tsx
const AdminGallery = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Gallery Management</h1>
      <p>Manage gallery images here.</p>
    </div>
  );
};

export default AdminGallery;
EOF

cat <<EOF > src/pages/admin/Reports.tsx
const AdminReports = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Reports</h1>
      <p>View and generate hotel reports here.</p>
    </div>
  );
};

export default AdminReports;
EOF

# Create missing components
mkdir -p src/components
cat <<EOF > src/components/Navbar.tsx
const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-lg font-bold">MJ Grand Hotel</a>
        <div>
          <a href="/menu" className="mx-2">Menu</a>
          <a href="/dining" className="mx-2">Dining</a>
          <a href="/booking" className="mx-2">Booking</a>
          <a href="/admin" className="mx-2">Admin</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
EOF

cat <<EOF > src/components/Footer.tsx
const Footer = () => {
  return (
    <footer className="bg-gray-800 p-4 text-white text-center">
      <div className="container mx-auto">
        <p>&copy; $(date +%Y) MJ Grand Hotel Ghana. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
EOF

cat <<EOF > src/components/ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
EOF

echo "All missing pages and components have been created!"
