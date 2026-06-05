import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "mayorista" | "user";

const fetchRole = async (): Promise<AppRole | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as AppRole);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("mayorista")) return "mayorista";
  return "user";
};

// Один модульный трекер смены пользователя на приложение
let lastUid: string | null | undefined;

/**
 * Returns the highest-priority role of the current authenticated user.
 * admin > mayorista > user. Returns null while loading or for guests.
 * React Query: все инстансы хука делят ОДИН запрос (раньше каждый
 * компонент с useUserRole фетчил user_roles сам).
 */
export const useUserRole = () => {
  const qc = useQueryClient();
  const { data: role = null, isLoading: loading } = useQuery({
    queryKey: ["user-role"],
    queryFn: fetchRole,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      // Рефетч только при реальной смене пользователя (Supabase шлёт
      // SIGNED_IN/TOKEN_REFRESHED на каждый фокус вкладки)
      if (uid === lastUid) return;
      lastUid = uid;
      void qc.invalidateQueries({ queryKey: ["user-role"] });
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  return { role, loading, isAdmin: role === "admin", isMayorista: role === "mayorista" };
};
