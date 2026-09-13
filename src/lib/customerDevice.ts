import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "mj_food_device_id";
const DETAILS_KEY = "mj_food_customer";
const VISITS_KEY = "mj_food_visits";

export type CustomerDetails = {
  full_name: string;
  email: string;
  phone: string;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the flow still works, we just re-ask next time */
  }
}

export function getDeviceId(): string {
  let id = safeGet(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    safeSet(DEVICE_KEY, id);
  }
  return id;
}

export function getCachedCustomer(): CustomerDetails | null {
  const raw = safeGet(DETAILS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CustomerDetails>;
    if (parsed.full_name && parsed.email && parsed.phone) {
      return {
        full_name: parsed.full_name,
        email: parsed.email,
        phone: parsed.phone,
      };
    }
  } catch {
    /* corrupted cache — treat as a new device */
  }
  return null;
}

export function isKnownDevice(): boolean {
  return getCachedCustomer() !== null;
}

function bumpVisits(): number {
  const current = Number(safeGet(VISITS_KEY) || "0");
  const next = Number.isFinite(current) && current > 0 ? current + 1 : 1;
  safeSet(VISITS_KEY, String(next));
  return next;
}

/** Save (or refresh) this device's customer record locally and in the database. */
export async function saveCustomer(details: CustomerDetails): Promise<void> {
  const clean: CustomerDetails = {
    full_name: details.full_name.trim(),
    email: details.email.trim().toLowerCase(),
    phone: details.phone.trim(),
  };
  safeSet(DETAILS_KEY, JSON.stringify(clean));

  const device_id = getDeviceId();
  const visit_count = bumpVisits();

  const { error } = await supabase.from("food_customers").upsert(
    {
      device_id,
      ...clean,
      visit_count,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "device_id" },
  );

  if (error) {
    // Never block ordering because the capture failed.
    console.error("Customer capture failed", error);
  }
}

/** Record a returning visit without re-asking for details. */
export async function touchCustomerVisit(): Promise<void> {
  const cached = getCachedCustomer();
  if (!cached) return;
  await saveCustomer(cached);
}
