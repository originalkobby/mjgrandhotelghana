import type { BookingStep } from "@/hooks/useBooking";

interface Props {
  currentStep: BookingStep;
  currentIndex: number;
  roomPreselected?: boolean;
}

const LABELS: { key: BookingStep; label: string }[] = [
  { key: "search", label: "Dates" },
  { key: "rooms", label: "Room" },
  { key: "addons", label: "Extras" },
  { key: "details", label: "Details" },
  { key: "payment", label: "Payment" },
];

const BookingStepper = ({ currentIndex }: Props) => {
  return (
    <nav aria-label="Booking progress" className="mb-10">
      <ol className="flex items-center justify-between gap-2">
        {LABELS.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2">
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span
                className={[
                  "hidden text-xs uppercase tracking-wider sm:inline",
                  active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {s.label}
              </span>
              {i < LABELS.length - 1 && (
                <span className={`mx-1 hidden h-px flex-1 sm:block ${done ? "bg-primary/40" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BookingStepper;
