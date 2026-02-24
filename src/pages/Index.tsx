import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RoomsPreview from "@/components/RoomsPreview";
import Experiences from "@/components/Experiences";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <RoomsPreview />
      <Experiences />
      <Gallery />
      <Footer />
    </div>
  );
};

export default Index;
