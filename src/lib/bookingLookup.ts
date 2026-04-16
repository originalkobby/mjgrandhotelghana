import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function lookupBookingByReference<T>(
  client: SupabaseClient<Database>,
  reference: string,
) {
  const rawReference = reference.trim();
  if (!rawReference) return null;

  const { data, error } = await client.functions.invoke("lookup-booking", {
    body: { reference: rawReference },
  });

  if (error) throw error;
  return (data?.booking as T) ?? null;
}
