import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

/**
 * Compact "Last updated" indicator with a circular progress ring
 * showing minutes elapsed since the FX rate was last fetched.
 * Refreshes hourly via the cached fetch in CurrencyContext.
 */
export default function RateRefreshIndicator() {
  const { fetchedAt, ttlMs } = useCurrency();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!fetchedAt) return null;

  const elapsed = Math.max(0, now - fetchedAt);
  const ttlMinutes = Math.floor(ttlMs / 60_000);
  const elapsedMinutes = Math.min(ttlMinutes, Math.floor(elapsed / 60_000));
  const progress = Math.min(1, elapsed / ttlMs);

  const size = 28;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const fetched = new Date(fetchedAt);
  const dateLabel = fetched.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = fetched.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      className="flex items-center gap-2 text-[11px] text-muted-foreground font-sans"
      title={`FX rate refreshes every ${ttlMinutes} minutes`}
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
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-foreground tabular-nums">
          {elapsedMinutes}
        </span>
      </div>
      <span className="hidden md:inline">
        Last updated: {dateLabel} {timeLabel}
      </span>
      <span className="md:hidden">{timeLabel}</span>
    </div>
  );
}
