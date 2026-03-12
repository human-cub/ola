import { getCollectiveTierPrice, getFirstTierPrice } from "@/lib/collectivePricing";
import type { OrderItem } from "@/lib/types";

export interface ProductPricingData {
  prices: unknown;
  totalOrdersCount: number;
}

export interface RecalculationResult {
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  hasChanges: boolean;
}

export function recalculateOrderItems(
  items: OrderItem[],
  productPricingMap: Map<string, ProductPricingData>,
  deliveryCost: number,
): RecalculationResult {
  let hasChanges = false;

  const recalculatedItems = items.map((item) => {
    const productData = productPricingMap.get(item.product_id);
    if (!productData) return item;

    const newPrice = getCollectiveTierPrice(
      productData.prices,
      productData.totalOrdersCount,
    );
    if (newPrice === null || newPrice === item.price_per_unit) return item;

    hasChanges = true;
    return { ...item, price_per_unit: newPrice };
  });

  const subtotal = recalculatedItems.reduce(
    (sum, item) => sum + Number(item.price_per_unit) * item.quantity,
    0,
  );

  const fullPrice = recalculatedItems.reduce((sum, item) => {
    const productData = productPricingMap.get(item.product_id);
    const firstTierPrice = getFirstTierPrice(
      productData?.prices,
      Number(item.price_per_unit),
    );
    return sum + firstTierPrice * item.quantity;
  }, 0);

  const discountAmount = Math.max(0, fullPrice - subtotal);
  const totalAmount = subtotal + deliveryCost;

  return { items: recalculatedItems, subtotal, discountAmount, totalAmount, hasChanges };
}
