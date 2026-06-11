import { useMemo } from "react";
import type { WaitingListItem } from "@/contexts/CartContext";
import {
  buyNowPriceFor,
  retailFor,
  waitingPriceFor,
  type CatalogPriceInfo,
} from "@/hooks/useCatalogPricing";

interface FrozenOrderData {
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price_per_unit: number;
    flavor: string | null;
    product_image: string | null;
    participants_count?: number;
  }>;
  subtotal: number;
  participants_count: number;
}

interface WaitingListPricingParams {
  waitingListItems: WaitingListItem[];
  isCollectionEnded: boolean;
  hasExistingOrder: boolean;
  frozenOrderData: FrozenOrderData | null;
  promoTierBonus?: number;
  /** Tier bonus para "Comprar ahora". La recompensa de referido NO aplica al pago
   *  inmediato (sólo al pedido colectivo), así que aquí se pasa el bonus de promo solo.
   *  Si se omite, cae a promoTierBonus. */
  buyNowTierBonus?: number;
  priceMap: Map<string, CatalogPriceInfo>;
  brandReached: Map<string, boolean>;
}

/**
 * New brand-collective model:
 * - price in waiting list = t3 guaranteed; brand Meta reached or promo -> t4 (max t4)
 * - after the weekly freeze, frozen stored prices apply (promo still lifts to t4)
 * - "sin descuento" baseline is ALWAYS retail
 */
export const useWaitingListPricing = ({
  waitingListItems,
  isCollectionEnded,
  hasExistingOrder,
  frozenOrderData,
  promoTierBonus = 0,
  buyNowTierBonus,
  priceMap,
  brandReached,
}: WaitingListPricingParams) => {
  const buyNowBonus = buyNowTierBonus ?? promoTierBonus;
  const hasPromo = promoTierBonus > 0;

  const storedPriceFor = (productId: string): number => {
    const item = waitingListItems.find((i) => i.product_id === productId);
    return item?.current_price_per_unit ?? 0;
  };

  const getCurrentPrice = (productId: string): number => {
    const info = priceMap.get(productId);
    const stored = storedPriceFor(productId);

    if (isCollectionEnded && frozenOrderData) {
      const frozenItem = frozenOrderData.items.find((i) => i.product_id === productId);
      const frozenPrice = frozenItem?.price_per_unit ?? stored;
      // Promo still upgrades a frozen order to Súper-Precio (t4).
      return hasPromo ? waitingPriceFor(info, true, promoTierBonus, frozenPrice) : frozenPrice;
    }

    const reached = info?.brandSlug ? brandReached.get(info.brandSlug) ?? false : false;
    return waitingPriceFor(info, reached, promoTierBonus, stored);
  };

  const getUserQtyForProduct = (productId: string): number => {
    return waitingListItems
      .filter((i) => i.product_id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const { subtotal, fullPrice, estimatedTotal, currentDiscount, estimatedDiscount } = useMemo(() => {
    let sub = 0;
    let full = 0;
    let est = 0;

    for (const item of waitingListItems) {
      const info = priceMap.get(item.product_id);
      const unit = getCurrentPrice(item.product_id) || item.current_price_per_unit || 0;
      sub += unit * item.quantity;
      full += retailFor(info, unit) * item.quantity;
      if (!isCollectionEnded) {
        // Best case at close = Súper-Precio (t4)
        const best = info ? info.t4 || info.t3 || unit : unit;
        est += best * item.quantity;
      }
    }

    return {
      subtotal: sub,
      fullPrice: full,
      estimatedTotal: est,
      currentDiscount: full - sub,
      estimatedDiscount: full - est,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingListItems, priceMap, brandReached, isCollectionEnded, frozenOrderData, hasExistingOrder, promoTierBonus]);

  const getBuyNowTotal = (): number => {
    return waitingListItems.reduce((sum, item) => {
      const info = priceMap.get(item.product_id);
      const price = buyNowPriceFor(info, buyNowBonus, item.current_price_per_unit || 0);
      return sum + price * item.quantity;
    }, 0);
  };

  return {
    getCurrentPrice,
    getUserQtyForProduct,
    getBuyNowTotal,
    subtotal,
    fullPrice,
    estimatedTotal,
    currentDiscount,
    estimatedDiscount,
  };
};
