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

const BRANDS_CACHE_KEY = "catalog:brands:v1";
const BRANDS_CACHE_TTL = 1000 * 60 * 60 * 24;

const readBrandsCache = (): Brand[] | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(BRANDS_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; data: Brand[] };
    if (!parsed?.data || Date.now() - parsed.at > BRANDS_CACHE_TTL) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const writeBrandsCache = (data: Brand[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRANDS_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — игнорируем */
  }
};

export const useBrands = (options?: { includeInactive?: boolean }) => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["brands", "external"],
    queryFn: async () => {
      const rows = await fetchBrands();
      writeBrandsCache(rows);
      return rows;
    },
    staleTime: 1000 * 60 * 5,
    initialData: readBrandsCache,
    initialDataUpdatedAt: 0, // фоновый рефетч сразу
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