import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const email = "f&b@mjgrandhotelghana.com";
  const password = crypto.randomUUID().slice(0, 12) + "Aa1!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "F&B / Kitchen Staff" },
  });

  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message ?? "no user" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: data.user.id, role: "restaurant_staff" });

  return new Response(
    JSON.stringify({ user_id: data.user.id, email, password, roleError: roleError?.message ?? null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
