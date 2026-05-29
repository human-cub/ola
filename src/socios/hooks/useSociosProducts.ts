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
  const { data, error } = await supabase.functions.invoke("fetch-external-products");
  if (error) throw error;
  return ((data as any)?.products ?? []) as SociosProduct[];
};

export const useSociosProducts = () =>
  useQuery({
    queryKey: ["socios", "products"],
    queryFn: fetchSociosProducts,
    staleTime: 1000 * 60 * 5,
  });