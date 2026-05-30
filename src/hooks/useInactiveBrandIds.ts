import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the set of local brand IDs that are marked as inactive
 * in the admin panel (brands.is_active = false, synced from brand_overrides).
 * Used to filter products on the main public site. Does NOT affect /socios.
 */
export const useInactiveBrandIds = () => {
  return useQuery({
    queryKey: ["inactive-brand-ids"],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, is_active")
        .eq("is_active", false);
      if (error) {
        console.warn("useInactiveBrandIds failed:", error.message);
        return new Set();
      }
      return new Set((data ?? []).map((b) => b.id));
    },
    staleTime: 1000 * 60,
  });
};