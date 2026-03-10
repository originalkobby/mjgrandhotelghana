import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Dining from "./pages/Dining";
import Policy from "./pages/Policy";
import About from "./pages/About";
import Booking from "./pages/Booking";
import BookingLookup from "./pages/BookingLookup";
import NotFound from "./pages/NotFound";
import GuestServices from "./pages/GuestServices";
import MJChat from "./components/MJChat";
import { ScrollToTop } from "./components/ScrollToTop";
import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import AdminBookings from "./pages/admin/Bookings";
import AdminInventory from "./pages/admin/Inventory";
import AdminMessages from "./pages/admin/Messages";
import AdminGuests from "./pages/admin/Guests";
import AdminPromotions from "./pages/admin/Promotions";
import AdminReports from "./pages/admin/Reports";
import AdminRooms from "./pages/admin/Rooms";
import AdminSupport from "./pages/admin/SupportTickets";
import AdminSettings from "./pages/admin/Settings";
import AdminMenu from "./pages/admin/MenuManagement";

function ChatWidget() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <MJChat />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/dining" element={<Dining />} />
          <Route path="/about" element={<About />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/lookup" element={<BookingLookup />} />
          <Route path="/guest-services" element={<GuestServices />} />

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
            <Route path="reports" element={<AdminReports />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
