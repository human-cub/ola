import { useMemo } from "react";
import {
  buyNowPriceFor,
  retailFor,
  useCatalogPricing,
  waitingPriceFor,
} from "@/hooks/useCatalogPricing";

interface CartLikeItem {
  product_id: string;
  quantity: number;
  price_per_unit?: number;
  current_price_per_unit?: number;
}

function getStoredPrice(item: CartLikeItem): number {
  return item.price_per_unit ?? item.current_price_per_unit ?? 0;
}

/**
 * New brand-collective pricing model:
 * - immediate ("Comprar Ahora"): t1, promo -> t2
 * - collective (waiting list): t2 guaranteed; brand Meta reached or promo -> t3
 * - discount is always computed against retail (price_retail_display)
 */
export function useCheckoutPricing(
  items: CartLikeItem[],
  deliveryZone: "caba" | "gba" | "other",
  promoTierBonus: number = 0,
  isCollective: boolean = false,
) {
  const { priceMap, brandReached } = useCatalogPricing();
  const hasPromo = promoTierBonus > 0;

  const getUnitPrice = (item: CartLikeItem): number => {
    const stored = getStoredPrice(item);
    const info = priceMap.get(item.product_id);
    if (isCollective) {
      const reached = info?.brandSlug ? brandReached.get(info.brandSlug) ?? false : false;
      return waitingPriceFor(info, reached, hasPromo, stored);
    }
    return buyNowPriceFor(info, hasPromo, stored);
  };

  const pricing = useMemo(() => {
    let subtotal = 0;
    let fullPrice = 0;

    for (const item of items) {
      const unit = getUnitPrice(item);
      subtotal += unit * item.quantity;
      fullPrice += retailFor(priceMap.get(item.product_id), unit) * item.quantity;
    }

    const discount = fullPrice - subtotal;
    const baseDeliveryCost = deliveryZone === "caba" ? 0 : deliveryZone === "gba" ? 3000 : 5000;
    const deliveryCost = subtotal >= 100000 ? 0 : baseDeliveryCost;
    const total = subtotal + deliveryCost;

    return { subtotal, fullPrice, discount, deliveryCost, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, priceMap, brandReached, deliveryZone, promoTierBonus, isCollective]);

  return { ...pricing, getUnitPrice };
}
