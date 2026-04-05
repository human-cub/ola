import { useMemo } from "react";
import type { WaitingListItem } from "@/contexts/CartContext";
import type { PriceData } from "@/lib/types";

interface ProductData {
  id: string;
  link: string;
  total_orders_count: number;
  prices: PriceData[];
}

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
  productData: Record<string, ProductData>;
  isCollectionEnded: boolean;
  hasExistingOrder: boolean;
  frozenOrderData: FrozenOrderData | null;
  promoTierBonus?: number;
}

function getPromoTierIndex(currentTierIndex: number, tierBonus: number, maxTiers: number): number {
  const maxIndex = Math.min(maxTiers - 1, 3);
  return Math.min(currentTierIndex + tierBonus, maxIndex);
}

export const useWaitingListPricing = ({
  waitingListItems,
  productData,
  isCollectionEnded,
  hasExistingOrder,
  frozenOrderData,
  promoTierBonus = 0,
}: WaitingListPricingParams) => {
  const getFullPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;
    return prod.prices[0].price;
  };

  const getMaxDiscountPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;
    return prod.prices[prod.prices.length - 1].price;
  };

  const getNextDiscountThreshold = (productId: string, userQty: number): { people: number; price: number } | null => {
    if (isCollectionEnded) return null;
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return null;

    const secondTierThreshold = prod.prices.length > 1 ? prod.prices[1].people : 0;
    const current = hasExistingOrder ? prod.total_orders_count : prod.total_orders_count + userQty;

    if (current < secondTierThreshold) return null;

    for (const tier of prod.prices) {
      if (tier.people > current) return tier;
    }
    return null;
  };

  const getParticipantsCount = (productId: string, userQty: number): number => {
    if (isCollectionEnded && frozenOrderData) {
      const frozenItem = frozenOrderData.items.find(i => i.product_id === productId);
      if (frozenItem?.participants_count != null && frozenItem.participants_count > 0) {
        return frozenItem.participants_count;
      }
      return frozenOrderData.participants_count;
    }
    const prod = productData[productId];
    if (!prod) return userQty;
    if (hasExistingOrder) return prod.total_orders_count;
    return prod.total_orders_count + userQty;
  };

  const getCurrentPrice = (productId: string, userQty: number): number => {
    if (isCollectionEnded && frozenOrderData) {
      const frozenItem = frozenOrderData.items.find(i => i.product_id === productId);
      if (frozenItem) {
        // Even for frozen orders, apply promo bonus
        if (promoTierBonus > 0) {
          const prod = productData[productId];
          if (prod && prod.prices.length > 1) {
            const matchIndex = prod.prices.findIndex(t => t.price === frozenItem.price_per_unit);
            const baseTierIndex = matchIndex >= 0 ? matchIndex : 0;
            const effectiveIndex = getPromoTierIndex(baseTierIndex, promoTierBonus, prod.prices.length);
            return prod.prices[effectiveIndex]?.price ?? frozenItem.price_per_unit;
          }
        }
        return frozenItem.price_per_unit;
      }
    }
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;

    const secondTierThreshold = prod.prices.length > 1 ? prod.prices[1].people : 0;
    const secondTierPrice = prod.prices.length > 1 ? prod.prices[1].price : prod.prices[0].price;

    const totalParticipants = hasExistingOrder
      ? prod.total_orders_count
      : prod.total_orders_count + userQty;

    if (totalParticipants < secondTierThreshold) {
      // Before second tier threshold, base is second tier price
      if (promoTierBonus > 0 && prod.prices.length > 1) {
        const baseTierIndex = 1; // second tier
        const effectiveIndex = getPromoTierIndex(baseTierIndex, promoTierBonus, prod.prices.length);
        return prod.prices[effectiveIndex]?.price ?? secondTierPrice;
      }
      return secondTierPrice;
    }

    let currentTierIndex = 1;
    for (let i = prod.prices.length - 1; i >= 0; i--) {
      if (totalParticipants >= prod.prices[i].people) {
        currentTierIndex = i;
        break;
      }
    }

    if (promoTierBonus > 0) {
      const effectiveIndex = getPromoTierIndex(currentTierIndex, promoTierBonus, prod.prices.length);
      return prod.prices[effectiveIndex]?.price ?? prod.prices[currentTierIndex].price;
    }

    return prod.prices[currentTierIndex].price;
  };

  const getUserQtyForProduct = (productId: string): number => {
    return waitingListItems
      .filter(i => i.product_id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const findFrozenItem = (item: WaitingListItem) => {
    if (!frozenOrderData) return null;
    return frozenOrderData.items.find(i => i.product_id === item.product_id && i.flavor === item.flavor)
      || frozenOrderData.items.find(i => i.product_id === item.product_id);
  };

  const getSecondTierPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length < 2) return 0;
    return prod.prices[1].price;
  };

  const { subtotal, fullPrice, estimatedTotal, currentDiscount, estimatedDiscount } = useMemo(() => {
    const sub = waitingListItems.reduce((sum, item) => {
      if (isCollectionEnded && frozenOrderData) {
        const frozen = findFrozenItem(item);
        if (frozen) return sum + frozen.price_per_unit * item.quantity;
      }
      const userQty = getUserQtyForProduct(item.product_id);
      const dynamicPrice = getCurrentPrice(item.product_id, userQty) || item.current_price_per_unit;
      return sum + dynamicPrice * item.quantity;
    }, 0);

    const full = waitingListItems.reduce((sum, item) => {
      return sum + getFullPrice(item.product_id) * item.quantity;
    }, 0);

    const est = waitingListItems.reduce((sum, item) => {
      if (isCollectionEnded) return sum;
      return sum + getMaxDiscountPrice(item.product_id) * item.quantity;
    }, 0);

    return {
      subtotal: sub,
      fullPrice: full,
      estimatedTotal: est,
      currentDiscount: full - sub,
      estimatedDiscount: full - est,
    };
  }, [waitingListItems, productData, isCollectionEnded, frozenOrderData, hasExistingOrder, promoTierBonus]);

  const getBuyNowTotal = (): number => {
    return waitingListItems.reduce((sum, item) => {
      const price = getSecondTierPrice(item.product_id) || item.current_price_per_unit;
      return sum + price * item.quantity;
    }, 0);
  };

  return {
    getFullPrice,
    getMaxDiscountPrice,
    getNextDiscountThreshold,
    getParticipantsCount,
    getCurrentPrice,
    getUserQtyForProduct,
    getSecondTierPrice,
    getBuyNowTotal,
    subtotal,
    fullPrice,
    estimatedTotal,
    currentDiscount,
    estimatedDiscount,
  };
};
