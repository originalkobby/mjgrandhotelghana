import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { fetchUsdToGhsRate, formatUsd, formatGhs, formatCurrency as formatCurrencyUtil, ghsToUsd } from "@/lib/currency";

interface CurrencyContextValue {
  /** Live USD → GHS exchange rate */
  rate: number;
  /** Whether rate is still loading */
  loading: boolean;
  /** Admin dashboard display mode */
  adminMode: "usd" | "ghs";
  /** Toggle admin dashboard currency */
  setAdminMode: (mode: "usd" | "ghs") => void;
  /** Format GHS amount as USD */
  toUsd: (ghsAmount: number) => string;
  /** Format GHS amount as GH₵ */
  toGhs: (ghsAmount: number) => string;
  /** Format based on admin mode setting */
  format: (ghsAmount: number) => string;
  /** Get raw USD number from GHS */
  convertToUsd: (ghsAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(16); // fallback
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState<"usd" | "ghs">(() => {
    try {
      return (localStorage.getItem("mj_admin_currency") as "usd" | "ghs") || "usd";
    } catch {
      return "usd";
    }
  });

  useEffect(() => {
    fetchUsdToGhsRate()
      .then(setRate)
      .finally(() => setLoading(false));
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
    toUsd: (ghs: number) => formatUsd(ghs, rate),
    toGhs: (ghs: number) => formatGhs(ghs),
    format: (ghs: number) => formatCurrencyUtil(ghs, rate, adminMode),
    convertToUsd: (ghs: number) => ghsToUsd(ghs, rate),
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
