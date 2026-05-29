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
}

const fetchSociosProducts = async (): Promise<SociosProduct[]> => {
  const [productsRes, overridesRes] = await Promise.all([
    supabase.functions.invoke("fetch-external-products"),
    supabase.from("socios_product_overrides").select("sku,is_active"),
  ]);
  if (productsRes.error) throw productsRes.error;
  const products = ((productsRes.data as any)?.products ?? []) as SociosProduct[];
  const inactive = new Set(
    ((overridesRes.data ?? []) as { sku: string; is_active: boolean }[])
      .filter((o) => o.is_active === false)
      .map((o) => o.sku),
  );
  return products.filter((p) => !inactive.has(p.sku));
};

export const useSociosProducts = () =>
  useQuery({
    queryKey: ["socios", "products"],
    queryFn: fetchSociosProducts,
    staleTime: 1000 * 60 * 5,
  });