import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Mapa product_id -> cantidad de pedidos (popularidad real, vista product_popularity).
type PopRecord = Record<string, number>;

const CACHE_KEY = "catalog:popularity:v1";
const CACHE_TTL = 1000 * 60 * 60 * 24;

const readCache = (): PopRecord | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; data: PopRecord };
    if (!parsed?.data || Date.now() - parsed.at > CACHE_TTL) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const writeCache = (data: PopRecord) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — ignorar */
  }
};

const fetchPopularity = async (): Promise<PopRecord> => {
  const rec: PopRecord = {};
  const { data, error } = await supabase
    .from("product_popularity" as any)
    .select("product_id, orders_count");
  if (!error && data) {
    for (const r of data as Array<{ product_id: string; orders_count: number }>) {
      if (r.product_id) rec[r.product_id] = r.orders_count ?? 0;
    }
  }
  writeCache(rec);
  return rec;
};

interface HasVariants {
  variants: { productId: string }[];
}

/**
 * Popularidad real (conteo de pedidos por SKU). Cacheada en localStorage para
 * render instantáneo al recargar (sin parpadeo) + revalidación en background.
 */
export const usePopularity = () => {
  const query = useQuery({
    queryKey: ["product-popularity", "v1"],
    queryFn: fetchPopularity,
    staleTime: 1000 * 60 * 10,
    initialData: readCache,
    initialDataUpdatedAt: 0,
  });

  const rec = query.data ?? {};
  const scoreOf = useCallback(
    (p: HasVariants): number => {
      let s = 0;
      for (const v of p.variants) {
        const c = rec[v.productId] ?? 0;
        if (c > s) s = c;
      }
      return s;
    },
    [rec],
  );

  return { scoreOf, ready: query.data !== undefined };
};
