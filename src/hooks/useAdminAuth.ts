import { useState, useEffect, useCallback, useRef } from "react";
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
  const initialSessionHandled = useRef(false);

  const fetchRole = useCallback(async (_userId: string) => {
    // Use SECURITY DEFINER RPC to bypass any RLS/JWT timing issues
    const { data, error } = await supabase.rpc("get_my_admin_role");
    if (error) {
      console.error("[useAdminAuth] get_my_admin_role error:", error);
      return null;
    }
    return (data as AdminRole | null) ?? null;
  }, []);

  useEffect(() => {
    // 1. Restore session from storage FIRST
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const r = await fetchRole(session.user.id);
        setRole(r);
      }
      initialSessionHandled.current = true;
      setLoading(false);
    });

    // 2. Listen for SUBSEQUENT auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the INITIAL_SESSION event — we handle it via getSession above
        if (event === "INITIAL_SESSION") return;

        if (session?.user) {
          setUser(session.user);
          // Don't await inside onAuthStateChange to avoid deadlocks;
          // use setTimeout to defer the async role fetch
          setTimeout(async () => {
            const r = await fetchRole(session.user.id);
            setRole(r);
          }, 0);
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error.message);
      }
    } catch (err) {
      console.error("Unexpected sign out error:", err);
    } finally {
      setUser(null);
      setRole(null);
      navigate("/admin/login");
    }
  }, [navigate]);

  return { user, role, loading, signIn, signOut };
}
