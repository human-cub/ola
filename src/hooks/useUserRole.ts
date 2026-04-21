import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "mayorista" | "user";

/**
 * Returns the highest-priority role of the current authenticated user.
 * admin > mayorista > user. Returns null while loading or for guests.
 */
export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (userId: string | null) => {
      if (!userId) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!mounted) return;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("mayorista")) setRole("mayorista");
      else setRole("user");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      void fetchRole(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      void fetchRole(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, isAdmin: role === "admin", isMayorista: role === "mayorista" };
};