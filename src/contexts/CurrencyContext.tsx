import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { fetchUsdToGhsRate, formatUsd, formatGhs, formatCurrency as formatCurrencyUtil, RATE_CACHE_TTL } from "@/lib/currency";

interface CurrencyContextValue {
  rate: number;
  loading: boolean;
  /** Timestamp (ms) when current rate was fetched */
  fetchedAt: number | null;
  /** TTL in ms before rate refreshes */
  ttlMs: number;
  adminMode: "usd" | "ghs";
  setAdminMode: (mode: "usd" | "ghs") => void;
  toUsd: (ghsAmount: number) => string;
  toGhs: (ghsAmount: number) => string;
  format: (ghsAmount: number) => string;
  convertToUsd: (ghsAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(16);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState<"usd" | "ghs">(() => {
    try {
      return (localStorage.getItem("mj_admin_currency") as "usd" | "ghs") || "usd";
    } catch {
      return "usd";
    }
  });

  useEffect(() => {
    const load = () =>
      fetchUsdToGhsRate()
        .then((r) => {
          setRate(r.rate);
          setFetchedAt(r.fetchedAt);
        })
        .finally(() => setLoading(false));
    load();
    const id = setInterval(load, RATE_CACHE_TTL);
    return () => clearInterval(id);
  }, []);

  const handleSetAdminMode = (mode: "usd" | "ghs") => {
    setAdminMode(mode);
    try {
      localStorage.setItem("mj_admin_currency", mode);
    } catch {}
  };

  const value: CurrencyContextValue = {
    rate,
    loading,
    fetchedAt,
    ttlMs: RATE_CACHE_TTL,
    adminMode,
    setAdminMode: handleSetAdminMode,
    toUsd: (amount: number) => formatUsd(amount),
    toGhs: (amount: number) => formatGhs(amount, rate),
    format: (amount: number) => formatCurrencyUtil(amount, rate, adminMode),
    convertToUsd: (amount: number) => amount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
