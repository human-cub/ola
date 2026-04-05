import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePriceTiers } from "@/lib/collectivePricing";

interface CartLikeItem {
  product_id: string;
  quantity: number;
  price_per_unit?: number;
  current_price_per_unit?: number;
}

function getItemPrice(item: CartLikeItem): number {
  return item.price_per_unit ?? item.current_price_per_unit ?? 0;
}

interface ProductPriceData {
  prices: { people: number; price: number }[];
}

/**
 * Given the current tier index and a promo bonus, return the effective tier index
 * capped at tier index 4 (0-based index 3, which is the 4th tier).
 */
function getPromoTierIndex(currentTierIndex: number, tierBonus: number, maxTiers: number): number {
  const maxIndex = Math.min(maxTiers - 1, 3); // max tier 4 (index 3)
  return Math.min(currentTierIndex + tierBonus, maxIndex);
}

export function useCheckoutPricing(
  items: CartLikeItem[],
  deliveryZone: "caba" | "gba" | "other",
  promoTierBonus: number = 0,
  isCollective: boolean = false,
) {
  const [productPriceData, setProductPriceData] = useState<Record<string, ProductPriceData>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const productIds = [...new Set(items.map(item => item.product_id))];
      if (productIds.length === 0) return;
      const { data } = await supabase.from("products").select("id, prices, total_orders_count").in("id", productIds);
      if (data) {
        const map: Record<string, ProductPriceData> = {};
        data.forEach(p => {
          map[p.id] = {
            prices: normalizePriceTiers(p.prices),
          };
        });
        setProductPriceData(map);
      }
    };
    fetchPrices();
  }, [items]);

  const pricing = useMemo(() => {
    // Calculate per-item prices considering promo tier bonus
    let subtotal = 0;
    let fullPrice = 0;

    for (const item of items) {
      const pd = productPriceData[item.product_id];
      const tiers = pd?.prices || [];
      const firstTierPrice = tiers.length > 0 ? tiers[0].price : getItemPrice(item);

      fullPrice += firstTierPrice * item.quantity;

      if (promoTierBonus > 0 && tiers.length > 1) {
        // For "Comprar Ahora" (immediate): base tier = 0 (first tier)
        // For "Sumate al grupo" (collective): base tier = current item price tier
        let baseTierIndex = 0;

        if (isCollective) {
          // Find which tier the current price corresponds to
          const currentPrice = getItemPrice(item);
          const matchIndex = tiers.findIndex(t => t.price === currentPrice);
          baseTierIndex = matchIndex >= 0 ? matchIndex : 0;
        }

        const effectiveIndex = getPromoTierIndex(baseTierIndex, promoTierBonus, tiers.length);
        const promoPrice = tiers[effectiveIndex]?.price ?? getItemPrice(item);
        subtotal += promoPrice * item.quantity;
      } else {
        subtotal += getItemPrice(item) * item.quantity;
      }
    }

    const discount = fullPrice - subtotal;
    const baseDeliveryCost = deliveryZone === "caba" ? 0 : deliveryZone === "gba" ? 3000 : 5000;
    const deliveryCost = subtotal >= 100000 ? 0 : baseDeliveryCost;
    const total = subtotal + deliveryCost;

    return { subtotal, fullPrice, discount, deliveryCost, total };
  }, [items, productPriceData, deliveryZone, promoTierBonus, isCollective]);

  return pricing;
}
