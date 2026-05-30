import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  products_count?: number;
  target_amount?: number;
  booster_mode?: 'off' | 'active' | 'first_24h';
  booster_started_at?: string | null;
  virtual_score?: number;
}

const fetchBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase.functions.invoke(
    "fetch-external-brands",
    { body: {} },
  );
  if (error) throw error;
  return ((data as { brands?: Brand[] })?.brands ?? []);
};

export const useBrands = (options?: { includeInactive?: boolean }) => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["brands", "external"],
    queryFn: fetchBrands,
    staleTime: 1000 * 60 * 5,
    select: (rows) =>
      options?.includeInactive ? rows : rows.filter((r) => r.is_active),
  });

  useEffect(() => {
    const channel = supabase
      .channel("brand-overrides-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_overrides" },
        () => qc.invalidateQueries({ queryKey: ["brands"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
};