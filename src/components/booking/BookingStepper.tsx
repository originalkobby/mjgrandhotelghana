import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { BookingStep } from "@/hooks/useBooking";

const STEP_LABELS: Record<BookingStep, string> = {
  search: "Dates",
  rooms: "Room",
  addons: "Extras",
  details: "Details",
  confirmation: "Confirm",
};

const STEPS: BookingStep[] = ["search", "rooms", "addons", "details", "confirmation"];

interface Props {
  currentStep: BookingStep;
  currentIndex: number;
}

export default function BookingStepper({ currentStep, currentIndex }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-6">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "hsl(38 60% 52%)"
                    : isCurrent
                    ? "hsl(30 10% 15%)"
                    : "hsl(30 15% 92%)",
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <span className={isCurrent ? "text-primary-foreground" : "text-muted-foreground"}>
                    {i + 1}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-[10px] sm:text-xs font-sans font-medium uppercase tracking-wider ${
                  isCurrent ? "text-foreground" : isCompleted ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-px mb-5 ${
                  i < currentIndex ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
