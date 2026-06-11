import { useMemo } from "react";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useBrandCollectionData } from "@/hooks/useBrandCollection";

export interface CatalogPriceInfo {
  retail: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  brandSlug: string | null;
  brandName: string | null;
  urlSlug: string;
  flavors: string[];
  size: string | null;
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
          t4: v.priceT4 || p.priceT4 || 0,
          brandSlug: p.brandSlug,
          brandName: p.brandName,
          urlSlug: p.urlSlug,
          flavors,
          size: p.size,
        });
      });
    });
    return map;
  }, [catalogProducts]);

  // Общий кэш сбора всех марок: один запрос/канал на приложение
  // (инвалидация по collecta-changed/realtime — внутри useBrandCollectionData)
  const { data: overrides } = useBrandCollectionData();

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

/** Collective/waiting: base t3 (Garantizado). Brand Meta reached -> t4 (Super).
 *  A promo bonus shifts up the named ladder [PG=t3, SP=t4] (cap SP). Never below guaranteed. */
export const waitingPriceFor = (
  info: CatalogPriceInfo | undefined,
  reached: boolean,
  promoBonus: number,
  fallback: number,
): number => {
  if (!info) return fallback;
  if (reached) return info.t4 || info.t3 || fallback;
  const ladder = [info.t3, info.t4]; // PG, SP
  const idx = Math.min(Math.max(promoBonus, 0), ladder.length - 1);
  return ladder[idx] || info.t3 || fallback;
};

/** Buy now ("Comprar Ahora"): base t1 (CA). A promo bonus shifts up the named ladder
 *  [CA=t1, PG=t3, SP=t4] (cap SP): +1 -> PG, +2 -> SP. */
export const buyNowPriceFor = (
  info: CatalogPriceInfo | undefined,
  promoBonus: number,
  fallback: number,
): number => {
  if (!info) return fallback;
  const ladder = [info.t1, info.t3, info.t4]; // CA, PG, SP
  const idx = Math.min(Math.max(promoBonus, 0), ladder.length - 1);
  return ladder[idx] || info.t1 || fallback;
};

/** Retail baseline for "sin descuento". Falls back so unknown items show zero discount. */
export const retailFor = (info: CatalogPriceInfo | undefined, fallback: number): number =>
  info?.retail || fallback;
