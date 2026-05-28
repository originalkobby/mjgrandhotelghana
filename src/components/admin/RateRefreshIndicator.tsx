import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

/**
 * Compact indicator showing a 60s countdown ring until the next
 * FX rate refresh, alongside the live current date and time.
 */
export default function RateRefreshIndicator() {
  const { fetchedAt, ttlMs } = useCurrency();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!fetchedAt) return null;

  const ttlSeconds = Math.max(1, Math.round(ttlMs / 1000));
  const elapsed = Math.max(0, now - fetchedAt);
  const remainingMs = Math.max(0, ttlMs - (elapsed % ttlMs));
  const remainingSeconds = Math.min(ttlSeconds, Math.ceil(remainingMs / 1000));
  const progress = Math.min(1, remainingMs / ttlMs);

  const size = 20;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const current = new Date(now);
  const dateLabel = current.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = current.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      className="flex items-center gap-2 text-[11px] text-muted-foreground font-sans"
      title={`Currency conversion updates every ${ttlSeconds} seconds`}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-medium text-foreground tabular-nums">
          {remainingSeconds}
        </span>
      </div>
      <span className="hidden md:inline tabular-nums">
        {dateLabel} {timeLabel}
      </span>
      <span className="md:hidden tabular-nums">{timeLabel}</span>
    </div>
  );
}
