import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, Wifi, UtensilsCrossed, Waves, Dumbbell, ConciergeBell, Car } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-hotel.jpg";

const USD_TO_GHS = 12.5;

const amenities = [
  { icon: Wifi, title: "High-Speed Wi-Fi", text: "Complimentary connectivity throughout the property." },
  { icon: UtensilsCrossed, title: "Restaurant & Bar", text: "Continental and Ghanaian cuisine, served all day." },
  { icon: Waves, title: "Outdoor Pool", text: "A quiet poolside retreat framed by palms." },
  { icon: Dumbbell, title: "Fitness Centre", text: "Modern equipment, open early until late." },
  { icon: ConciergeBell, title: "24/7 Concierge", text: "Attentive service whenever you need it." },
  { icon: Car, title: "Airport Transfer", text: "Private transfers to and from Kotoka International." },
];

const Home = () => {
  const rooms = useQuery(api.rooms.listActiveRooms) as any[] | undefined;
  const featured = (rooms ?? []).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="MJ Grand Hotel Ghana | Luxury Hotel in East Legon, Accra"
        description="Stay at MJ Grand Hotel in East Legon, Accra. Elegant rooms and suites, fine dining, pool, fitness centre and 24/7 concierge. Book direct for the best rate."
        path="/"
      />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[92vh] items-center">
          <img
            src={heroImage}
            alt="MJ Grand Hotel Ghana illuminated at dusk with poolside gardens"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
          <div className="container relative py-32">
            <div className="max-w-2xl animate-fade-up">
              <p className="eyebrow text-accent">East Legon · Accra, Ghana</p>
              <h1 className="mt-5 font-serif text-4xl leading-[1.1] text-white md:text-6xl">
                Quiet luxury, warm Ghanaian hospitality
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
                Thoughtfully designed rooms and suites, memorable dining and service
                that anticipates. Book direct for our best available rate.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.03]"
                >
                  Book your stay <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dining"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Explore dining
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="container py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="eyebrow">The Hotel</p>
              <h2 className="mt-4 font-serif text-3xl md:text-4xl">
                A refined address in the heart of East Legon
              </h2>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              MJ Grand Hotel blends contemporary comfort with the generosity of Ghanaian
              hospitality. Minutes from Accra's business and diplomatic districts, the
              property offers a calm base for travellers, families and long-stay guests —
              with dining, wellness and event spaces all under one roof.
            </p>
          </div>
        </section>

        {/* Rooms */}
        <section className="bg-secondary/50 py-24">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Accommodation</p>
                <h2 className="mt-4 font-serif text-3xl md:text-4xl">Rooms &amp; Suites</h2>
              </div>
              <Link to="/booking" className="text-sm text-accent hover:underline">
                Check availability →
              </Link>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rooms === undefined
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-lg bg-muted" />
                  ))
                : featured.map((room) => {
                    const usd = Number(room.base_price_ghs ?? 0);
                    return (
                      <article
                        key={room._id}
                        className="group overflow-hidden rounded-lg border border-border bg-card"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-muted">
                          {room.images?.[0] ? (
                            <img
                              src={room.images[0]}
                              alt={`${room.name} at MJ Grand Hotel Ghana`}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : null}
                        </div>
                        <div className="p-6">
                          <h3 className="font-serif text-xl">{room.name}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {room.description}
                          </p>
                          <div className="mt-5 flex items-end justify-between">
                            <div>
                              <p className="font-serif text-2xl">${usd.toFixed(0)}</p>
                              <p className="text-xs text-muted-foreground">
                                GH₵{(usd * USD_TO_GHS).toLocaleString("en-GB")} · per night
                              </p>
                            </div>
                            <Link
                              to="/booking"
                              className="rounded-full border border-border px-5 py-2 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
                            >
                              Book
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="container py-24">
          <p className="eyebrow">Facilities</p>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">Everything for an easy stay</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-border p-7">
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="mt-5 text-base font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container flex flex-col items-center gap-6 text-center">
            <h2 className="max-w-2xl font-serif text-3xl md:text-4xl">
              Reserve your room at our best available rate
            </h2>
            <p className="max-w-xl text-sm text-primary-foreground/70">
              Direct bookings include complimentary Wi-Fi, flexible cancellation and
              priority room assignment.
            </p>
            <Link
              to="/booking"
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.03]"
            >
              Book now
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
