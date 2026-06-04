import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

export interface CatalogPriceInfo {
  retail: number;
  t1: number;
  t2: number;
  t3: number;
  brandSlug: string | null;
  urlSlug: string;
  flavors: string[];
}

/**
 * Shared pricing source for the new brand-collective model.
 * priceMap: productId (uuidv5 of SKU) -> catalog prices + brand/url info.
 * brandReached: brandSlug -> whether the brand collective hit its money target (Meta).
 */
export const useCatalogPricing = () => {
  const { data: catalogProducts } = useCatalogProducts();

  const priceMap = useMemo(() => {
    const map = new Map<string, CatalogPriceInfo>();
    (catalogProducts ?? []).forEach((p) => {
      const flavors = p.variants.map((v) => v.flavor).filter(Boolean) as string[];
      p.variants.forEach((v) => {
        map.set(v.productId, {
          retail: v.priceRetailDisplay || p.priceRetailDisplay || 0,
          t1: v.priceT1 || p.priceT1 || 0,
          t2: v.priceT2 || p.priceT2 || 0,
          t3: v.priceT3 || p.priceT3 || 0,
          brandSlug: p.brandSlug,
          urlSlug: p.urlSlug,
          flavors,
        });
      });
    });
    return map;
  }, [catalogProducts]);

  const { data: overrides } = useQuery({
    queryKey: ["brand-overrides-meta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brand_collection_public" as any)
        .select("slug, collected_total, target_amount, goal_reached");
      return data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const brandReached = useMemo(() => {
    const map = new Map<string, boolean>();
    (overrides ?? []).forEach((b: any) => {
      const target = Number(b.target_amount ?? 0);
      map.set(
        b.slug,
        Boolean(b.goal_reached) || (target > 0 && Number(b.collected_total ?? 0) >= target),
      );
    });
    return map;
  }, [overrides]);

  return { priceMap, brandReached };
};

// ---- New model price rules. Discounts are ALWAYS computed against retail. ----

/** Waiting list / collective: t2 guaranteed; brand Meta reached or promo -> t3. Never beyond t3. */
export const waitingPriceFor = (
  info: CatalogPriceInfo | undefined,
  reached: boolean,
  hasPromo: boolean,
  fallback: number,
): number => {
  if (!info) return fallback;
  return reached || hasPromo ? info.t3 || info.t2 || fallback : info.t2 || fallback;
};

/** Buy now: t1; promo -> t2. */
export const buyNowPriceFor = (
  info: CatalogPriceInfo | undefined,
  hasPromo: boolean,
  fallback: number,
): number => {
  if (!info) return fallback;
  return hasPromo ? info.t2 || info.t1 || fallback : info.t1 || fallback;
};

/** Retail baseline for "sin descuento". Falls back so unknown items show zero discount. */
export const retailFor = (info: CatalogPriceInfo | undefined, fallback: number): number =>
  info?.retail || fallback;
