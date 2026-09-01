import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr) return json({ error: "Role check failed" }, 500);
    if (!isAdmin) return json({ error: "Forbidden: admin access required" }, 403);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action = String(body.action ?? "");

    if (action === "list") {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listErr) return json({ error: listErr.message }, 500);

      const { data: roles } = await admin.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string>();
      (roles ?? []).forEach((r: { user_id: string; role: string }) => {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role);
      });

      const users = (list.users ?? [])
        .filter((u) => roleMap.has(u.id))
        .map((u) => ({
          id: u.id,
          email: u.email ?? "",
          role: roleMap.get(u.id) ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
        }))
        .sort((a, b) => a.email.localeCompare(b.email));

      return json({ users });
    }

    if (action === "set_password") {
      const userId = String(body.userId ?? "");
      const password = String(body.password ?? "");
      if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
        return json({ error: "Invalid user id" }, 400);
      }
      if (password.length < 8 || password.length > 72) {
        return json({ error: "Password must be 8-72 characters" }, 400);
      }

      const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
      if (updErr) return json({ error: updErr.message }, 400);

      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
