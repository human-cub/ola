import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SociosProduct {
  sku: string;
  name: string;
  name_short: string | null;
  flavor: string | null;
  size: string | null;
  category_slug: string | null;
  url_slug: string | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  images: string[];
  retail_price: number;
  buy_price: number;
  discount_pct: number;
  sort_order: number;
  tags?: string[];
}

const CACHE_KEY = "socios:products:v1";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h — siempre revalidamos en background

const readCache = (): SociosProduct[] | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; data: SociosProduct[] };
    if (!parsed?.data || Date.now() - parsed.at > CACHE_TTL) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const writeCache = (data: SociosProduct[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — ignorar */
  }
};

const fetchSociosProducts = async (): Promise<SociosProduct[]> => {
  const [catRes, overridesRes] = await Promise.all([
    supabase.functions.invoke<{ products: SociosProduct[] }>("socios-prices"),
    supabase.from("socios_product_overrides").select("sku,is_active"),
  ]);
  if (catRes.error) throw catRes.error;
  const products = catRes.data?.products ?? [];
  const inactive = new Set(
    ((overridesRes.data ?? []) as { sku: string; is_active: boolean }[])
      .filter((o) => o.is_active === false)
      .map((o) => o.sku),
  );
  const filtered = products.filter((p) => !inactive.has(p.sku));
  writeCache(filtered);
  return filtered;
};

export const useSociosProducts = () =>
  useQuery({
    queryKey: ["socios", "products"],
    queryFn: fetchSociosProducts,
    staleTime: 1000 * 60 * 5,
    initialData: readCache,
    initialDataUpdatedAt: 0, // forzar refetch en background
  });