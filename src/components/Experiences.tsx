import { motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import expSpa from "@/assets/exp-spa.jpg";
import expDining from "@/assets/exp-dining.jpg";
import expRooftop from "@/assets/exp-rooftop.jpg";
import expCulture from "@/assets/exp-culture.jpg";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const experiences = [
  { image: expSpa, title: "Spa & Wellness", desc: "Rejuvenate body and soul with our world-class treatments." },
  { image: expDining, title: "Fine Dining", desc: "Savor exquisite cuisines crafted by Michelin-starred chefs." },
  { image: expRooftop, title: "Rooftop Lounge", desc: "Breathtaking skyline views paired with artisanal cocktails." },
  { image: expCulture, title: "Cultural Journeys", desc: "Curated excursions to discover the region's hidden treasures." },
];

const Experiences = () => {
  return (
    <section id="experiences" className="py-24 md:py-32 bg-secondary">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3">
            Discover
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            Curated Experiences
          </h2>
        </motion.div>

        <Carousel
          opts={{ align: "start", loop: true, direction: "ltr" }}
          plugins={[
            Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true, playOnInit: true }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-5">
            {experiences.map((exp, i) => (
              <CarouselItem key={exp.title} className="pl-5 basis-[80%] sm:basis-1/2 lg:basis-1/3">
                <ExperienceCard exp={exp} index={i} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

const ExperienceCard = ({ exp, index }: { exp: typeof experiences[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.3, 0, 0.2, 1] }}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden aspect-[3/4]">
        <img
          src={exp.image}
          alt={exp.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-serif text-xl text-cream mb-1">{exp.title}</h3>
          <p className="font-sans text-sm text-cream/70 leading-relaxed opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            {exp.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Experiences;
