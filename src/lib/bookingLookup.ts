import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function lookupBookingByReference<T>(
  client: SupabaseClient<Database>,
  reference: string,
  selectClause: string,
) {
  const rawReference = reference.trim();
  if (!rawReference) return null;

  const internalReference = rawReference.toUpperCase();

  const { data: internalBooking, error: internalError } = await client
    .from("bookings")
    .select(selectClause)
    .eq("reference_code", internalReference)
    .maybeSingle();

  if (internalError) throw internalError;
  if (internalBooking) return internalBooking as T;

  for (const otaReference of new Set([rawReference, internalReference])) {
    const { data: otaBooking, error: otaError } = await client
      .from("bookings")
      .select(selectClause)
      .eq("ota_reference", otaReference)
      .maybeSingle();

    if (otaError) throw otaError;
    if (otaBooking) return otaBooking as T;
  }

  return null;
}