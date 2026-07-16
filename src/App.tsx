import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CurrencyProvider } from "@/contexts/CurrencyContext.tsx";
import { ConvexClientProvider } from "@/components/ConvexClientProvider.tsx";
import { ClerkProvider } from "@clerk/clerk-react";

import Index from "@/pages/Index.tsx";
import { ScrollToTop } from "@/components/ScrollToTop.tsx";

// Public pages
const Menu = lazy(() => import("@/pages/Menu.tsx"));
const Dining = lazy(() => import("@/pages/Dining.tsx"));
const Policy = lazy(() => import("@/pages/Policy.tsx"));
const About = lazy(() => import("@/pages/About.tsx"));
const Booking = lazy(() => import("@/pages/Booking.tsx"));
const NotFound = lazy(() => import("@/pages/NotFound.tsx"));
const GuestServices = lazy(() => import("@/pages/GuestServices.tsx"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage.tsx"));

// Admin
const AdminLogin = lazy(() => import("@/pages/admin/Login.tsx"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout.tsx"));
const Overview = lazy(() => import("@/pages/admin/Overview.tsx"));

// Components
const MJChat = lazy(() => import("@/components/MJChat.tsx"));

const queryClient = new QueryClient();
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <ConvexClientProvider>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
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
                <Route path="/guest-services" element={<GuestServices />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Overview />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Suspense fallback={null}>
              <MJChat />
            </Suspense>
          </BrowserRouter>
        </CurrencyProvider>
      </QueryClientProvider>
    </ConvexClientProvider>
  </ClerkProvider>
);

export default App;
