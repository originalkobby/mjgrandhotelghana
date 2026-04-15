import { useEffect } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import expPool from "@/assets/exp-pool.jpg";
import expDining from "@/assets/exp-dining-new.jpg";
import expKitchen from "@/assets/exp-kitchen.jpg";
import expBreakfast from "@/assets/exp-breakfast.jpg";
import expPoolbar from "@/assets/exp-poolbar.jpg";

const experiences = [
  { image: expPool, title: "Poolside Retreat", desc: "Unwind in crystal-clear waters and soak up the sun in style." },
  { image: expDining, title: "Fine Dining", desc: "Savour exquisite dishes served with warmth and elegance." },
  { image: expKitchen, title: "Fitness Centre", desc: "Stay on top of your routine with our fully equipped gym, open to all guests." },
  { image: expBreakfast, title: "Breakfast in Bed", desc: "Start your morning with a lavish spread delivered to your suite." },
  { image: expPoolbar, title: "Pool Bar Vibes", desc: "Sip refreshing cocktails and catch the game at our lively poolside bar." },
];

const marqueeDuration = 20;

const Experiences = () => {
  const controls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();
  const scrollingExperiences = [...experiences, ...experiences];

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.stop();
      controls.set({ x: "0%" });
      return;
    }

    controls.set({ x: "0%" });

    void controls.start({
      x: "-50%",
      transition: {
        duration: marqueeDuration,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      },
    });

    return () => {
      controls.stop();
    };
  }, [controls, prefersReducedMotion]);

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

        <div className="overflow-hidden" aria-label="Curated experiences carousel" role="region">
          <motion.div initial={{ x: "0%" }} animate={controls} className="flex w-max gap-2">
            {scrollingExperiences.map((exp, i) => (
              <div
                key={`${exp.title}-${i}`}
                aria-hidden={i >= experiences.length}
                className="w-[80vw] max-w-[24rem] flex-none sm:w-[45vw] lg:w-[31vw]"
              >
                <ExperienceCard exp={exp} index={i % experiences.length} />
              </div>
            ))}
          </motion.div>
        </div>
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
