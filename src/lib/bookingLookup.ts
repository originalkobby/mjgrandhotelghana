import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function lookupBookingByReference<T>(
  client: SupabaseClient<Database>,
  reference: string,
  email?: string,
) {
  const rawReference = reference.trim();
  if (!rawReference) return null;

  const body: { reference: string; email?: string } = { reference: rawReference };
  const trimmedEmail = email?.trim();
  if (trimmedEmail) body.email = trimmedEmail;

  const { data, error } = await client.functions.invoke("lookup-booking", {
    body,
  });

  if (error) throw error;
  return (data?.booking as T) ?? null;
}
