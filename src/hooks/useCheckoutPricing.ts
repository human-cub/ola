import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CartLikeItem {
  product_id: string;
  quantity: number;
  price_per_unit?: number;
  current_price_per_unit?: number;
}

function getItemPrice(item: CartLikeItem): number {
  return item.price_per_unit ?? item.current_price_per_unit ?? 0;
}

export function useCheckoutPricing(
  items: CartLikeItem[],
  deliveryZone: "caba" | "gba" | "other",
) {
  const [productFirstPrices, setProductFirstPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const productIds = [...new Set(items.map(item => item.product_id))];
      if (productIds.length === 0) return;
      const { data } = await supabase.from("products").select("id, prices").in("id", productIds);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach(p => {
          const prices = (p.prices as any[]) || [];
          map[p.id] = prices.length > 0 ? prices[0].price : 0;
        });
        setProductFirstPrices(map);
      }
    };
    fetchPrices();
  }, [items]);

  const subtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );

  const fullPrice = items.reduce(
    (sum, item) => sum + (productFirstPrices[item.product_id] || getItemPrice(item)) * item.quantity,
    0,
  );

  const discount = fullPrice - subtotal;
  const baseDeliveryCost = deliveryZone === "caba" ? 0 : deliveryZone === "gba" ? 3000 : 5000;
  const deliveryCost = subtotal >= 100000 ? 0 : baseDeliveryCost;
  const total = subtotal + deliveryCost;

  return { subtotal, fullPrice, discount, deliveryCost, total };
}
