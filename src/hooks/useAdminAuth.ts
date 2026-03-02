import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AdminRole = "admin" | "revenue_manager" | "front_desk" | "finance";

interface AdminAuth {
  user: User | null;
  role: AdminRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useAdminAuth(): AdminAuth {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRole = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .single();
    return (data?.role as AdminRole) ?? null;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const r = await fetchRole(session.user.id);
          setRole(r);
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const r = await fetchRole(session.user.id);
        setRole(r);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (!data.user) return "Login failed";

    const r = await fetchRole(data.user.id);
    if (!r) {
      await supabase.auth.signOut();
      return "Access denied. No admin role assigned to this account.";
    }
    setUser(data.user);
    setRole(r);
    return null;
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    navigate("/admin/login");
  }, [navigate]);

  return { user, role, loading, signIn, signOut };
}
