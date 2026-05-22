import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Hero from "@/components/Hero";
import RoomsPreview from "@/components/RoomsPreview";
import Experiences from "@/components/Experiences";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="MJ Grand Hotel Ghana — Luxury Redefined in Accra" description="Five-star luxury hotel in East Legon, Accra. Exquisite rooms, fine dining, spa, pool, and curated cultural tours. Book your stay today." path="/" />
      <Navbar />
      <Hero />
      <RoomsPreview />
      <Experiences />
      <Gallery />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default Index;
