import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SociosProduct {
  id: string;
  name: string;
  weight: string;
  brand_id: string | null;
  images: string[];
  flavors: { name: string; image?: string | null }[];
  retail_price: number;
  buy_price: number;
  discount_pct: number;
}

const fetchSociosProducts = async (): Promise<SociosProduct[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, weight, brand_id, images, flavors, prices, is_qa_only")
    .order("name");
  if (error) throw error;
  return (data || [])
    .filter((p: any) => !p.is_qa_only)
    .map((p: any) => {
      const prices = (p.prices || []) as Array<{ people: number; price: number }>;
      const retail = prices[0]?.price ?? 0;
      const buy = prices[prices.length - 1]?.price ?? retail;
      const discount = retail > 0 ? Math.round(((retail - buy) / retail) * 100) : 0;
      const flavorsRaw = (p.flavors || []) as any[];
      const flavors = flavorsRaw.map((f) =>
        typeof f === "string" ? { name: f, image: null } : { name: f.name, image: f.image ?? null },
      );
      return {
        id: p.id,
        name: p.name,
        weight: p.weight,
        brand_id: p.brand_id ?? null,
        images: (p.images || []) as string[],
        flavors,
        retail_price: retail,
        buy_price: buy,
        discount_pct: discount,
      };
    })
    .filter((p) => p.buy_price > 0);
};

export const useSociosProducts = () =>
  useQuery({
    queryKey: ["socios", "products"],
    queryFn: fetchSociosProducts,
    staleTime: 1000 * 60 * 5,
  });