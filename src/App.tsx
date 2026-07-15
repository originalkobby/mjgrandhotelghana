import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/clerk-react";

import Index from "./pages/Index.tsx";
import { ScrollToTop } from "./components/ScrollToTop";

// Public pages — lazy-loaded so the homepage ships a smaller initial bundle.
const Menu = lazy(() => import("./pages/Menu.tsx"));
const Dining = lazy(() => import("./pages/Dining.tsx"));
const Policy = lazy(() => import("./pages/Policy.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Booking = lazy(() => import("./pages/Booking.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const GuestServices = lazy(() => import("./pages/GuestServices.tsx"));
const GalleryPage = lazy(() => import("./pages/GalleryPage.tsx"));

// Admin (always lazy — never needed for public visitors).
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Overview = lazy(() => import("./pages/admin/Overview"));
const AdminBookings = lazy(() => import("./pages/admin/Bookings"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminGuests = lazy(() => import("./pages/admin/Guests"));
const AdminPromotions = lazy(() => import("./pages/admin/Promotions"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminRooms = lazy(() => import("./pages/admin/Rooms"));
const AdminSupport = lazy(() => import("./pages/admin/SupportTickets"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminMenu = lazy(() => import("./pages/admin/MenuManagement"));
const RevenueIntelligence = lazy(() => import("./pages/admin/RevenueIntelligence"));
const AdminGallery = lazy(() => import("./pages/admin/GalleryManagement"));

// Defer the chat widget so it never blocks LCP.
const MJChat = lazy(() => import("./components/MJChat"));

function ChatWidget() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return (
    <Suspense fallback={null}>
      <MJChat />
    </Suspense>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Your Clerk Publishable Key (Found in Clerk Dashboard)
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <ConvexClientProvider>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/dining" element={<Dining />} />
                <Route path="/about" element={<About />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/booking/lookup" element={<Navigate to="/booking" replace />} />
                <Route path="/guest-services" element={<GuestServices />} />
                <Route path="/gallery" element={<GalleryPage />} />

                {/* Admin Dashboard */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Overview />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="guests" element={<AdminGuests />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="rooms" element={<AdminRooms />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="menu" element={<AdminMenu />} />
                  <Route path="gallery" element={<AdminGallery />} />
                  <Route path="revenue" element={<RevenueIntelligence />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ChatWidget />
          </BrowserRouter>
        </TooltipProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ConvexClientProvider>
  </ClerkProvider>
);

export default App;
