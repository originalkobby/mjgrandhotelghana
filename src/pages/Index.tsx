import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Hero from "@/components/Hero";

const RoomsPreview = lazy(() => import("@/components/RoomsPreview"));
const Experiences = lazy(() => import("@/components/Experiences"));
const Gallery = lazy(() => import("@/components/Gallery"));
const ContactForm = lazy(() => import("@/components/ContactForm"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="MJ Grand Hotel Ghana — Luxury Redefined in Accra" description="Five-star luxury hotel in East Legon, Accra. Exquisite rooms, fine dining, spa, pool, and curated cultural tours. Book your stay today." path="/" />
      <Navbar />
      <Hero />
      <Suspense fallback={<div className="h-screen" />}>
        <RoomsPreview />
        <Experiences />
        <Gallery />
        <ContactForm />
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
