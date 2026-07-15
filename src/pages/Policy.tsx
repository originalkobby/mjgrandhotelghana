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
