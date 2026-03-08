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
import NotFound from "./pages/NotFound";
import MJChat from "./components/MJChat";
import { ScrollToTop } from "./components/ScrollToTop";
import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import AdminBookings from "./pages/admin/Bookings";
import AdminInventory from "./pages/admin/Inventory";

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

          {/* Admin Dashboard */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="inventory" element={<AdminInventory />} />
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
