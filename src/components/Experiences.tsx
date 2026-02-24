import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import expSpa from "@/assets/exp-spa.jpg";
import expDining from "@/assets/exp-dining.jpg";
import expRooftop from "@/assets/exp-rooftop.jpg";
import expCulture from "@/assets/exp-culture.jpg";

const experiences = [
  { image: expSpa, title: "Spa & Wellness", desc: "Rejuvenate body and soul with our world-class treatments." },
  { image: expDining, title: "Fine Dining", desc: "Savor exquisite cuisines crafted by Michelin-starred chefs." },
  { image: expRooftop, title: "Rooftop Lounge", desc: "Breathtaking skyline views paired with artisanal cocktails." },
  { image: expCulture, title: "Cultural Journeys", desc: "Curated excursions to discover the region's hidden treasures." },
];

const Experiences = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="experiences" className="py-24 md:py-32 bg-secondary">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
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

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {experiences.map((exp, i) => (
            <ExperienceCard key={exp.title} exp={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ExperienceCard = ({ exp, index }: { exp: typeof experiences[0]; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.3, 0, 0.2, 1] }}
      className="group min-w-[280px] snap-center flex-shrink-0 lg:min-w-0 cursor-pointer"
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
