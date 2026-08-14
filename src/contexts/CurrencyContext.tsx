import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { fetchUsdToGhsRate, formatUsd, formatGhs, formatCurrency as formatCurrencyUtil, RATE_CACHE_TTL } from "@/lib/currency";

interface CurrencyContextValue {
  rate: number;
  loading: boolean;
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
        })
        .finally(() => setLoading(false));
    load();
    const id = setInterval(load, RATE_CACHE_TTL);

    const channel = supabase
      .channel("app-settings-currency")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload) => {
          const next = Number((payload.new as { usd_to_ghs?: number } | null)?.usd_to_ghs);
          if (Number.isFinite(next) && next > 0) setRate(next);
        }
      )
      .subscribe();

    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
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
