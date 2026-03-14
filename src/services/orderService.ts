import { supabase } from "@/integrations/supabase/client";
import { getCollectiveTierPrice, getFirstTierPrice, isCollectiveOrderClosed, getLastSundayClose } from "@/lib/collectivePricing";
import { formatPrice, formatFullName } from "@/lib/formatting";
import { parseAddress } from "@/lib/address";
import { fetchServerTime } from "@/lib/serverClock";
import type { OrderItem, OrderType, OrderStatus } from "@/lib/types";

/**
 * Creates a new pending collective order if none exists, or syncs existing one.
 * Pure async function — no React dependency.
 */
export const ensurePendingCollectiveOrder = async (userId: string) => {
  const { data: existingOrder } = await supabase
    .from("user_orders")
    .select("id, order_number")
    .eq("user_id", userId)
    .eq("order_type", "collective")
    .eq("status", "pending")
    .maybeSingle();

  if (existingOrder) {
    await syncWaitingListOrder(userId);
    return;
  }

  const { data: waitingListData } = await supabase
    .from("waiting_list_items")
    .select("*")
    .eq("user_id", userId);

  if (!waitingListData || waitingListData.length === 0) return;

  const productIds = [...new Set(waitingListData.map(i => i.product_id))];
  const { data: productsData } = await supabase
    .from("products")
    .select("id, prices")
    .in("id", productIds);

  const productPricesMap = new Map<string, any[]>();
  productsData?.forEach(p => {
    productPricesMap.set(p.id, (p.prices as any[]) || []);
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, address")
    .eq("user_id", userId)
    .maybeSingle();

  const customerName = formatFullName(profile?.first_name, profile?.last_name, "Cliente");
  const phone = profile?.phone || "";

  const deliveryAddress = parseAddress(profile?.address ?? null);

  const orderItems = waitingListData.map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    flavor: item.flavor,
    quantity: item.quantity,
    price_per_unit: item.current_price_per_unit,
    product_image: item.product_image,
  }));

  const subtotal = waitingListData.reduce(
    (sum, item) => sum + Number(item.current_price_per_unit) * item.quantity,
    0
  );

  let fullPrice = 0;
  waitingListData.forEach(item => {
    const prices = productPricesMap.get(item.product_id);
    if (prices && prices.length > 0) {
      const sortedPrices = [...prices].sort((a, b) => (a.people || 0) - (b.people || 0));
      const firstTierPrice = sortedPrices[0]?.price || item.current_price_per_unit;
      fullPrice += firstTierPrice * item.quantity;
    } else {
      fullPrice += Number(item.current_price_per_unit) * item.quantity;
    }
  });

  const discountAmount = fullPrice - subtotal;

  const orderNumber = `OLA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  const { data: newOrder, error: insertError } = await supabase
    .from("user_orders")
    .insert([{
      user_id: userId,
      order_number: orderNumber,
      order_type: "collective" as const,
      items: orderItems as any,
      subtotal,
      total_amount: subtotal,
      discount_amount: discountAmount,
      delivery_address: deliveryAddress as any,
      status: "pending" as const,
      notes: phone || null,
    }])
    .select("id, order_number")
    .single();

  if (insertError) throw insertError;

  const orderUrl = `${window.location.origin}/mi-cuenta/pedidos/${newOrder.id}`;
  await supabase.functions.invoke("notify-telegram", {
    body: {
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      order_type: "Compra Colectiva",
      customer_name: customerName,
      phone,
      total: formatPrice(subtotal),
      order_url: orderUrl,
      waiting_for_discount: true,
    },
  });
};

/**
 * Syncs waiting list items with the existing pending collective order.
 * Handles frozen-cycle logic and dynamic price recalculation.
 */
export const syncWaitingListOrder = async (userId: string) => {
  try {
    const { data: waitingListData } = await supabase
      .from("waiting_list_items")
      .select("*")
      .eq("user_id", userId);

    const { data: existingOrder } = await supabase
      .from("user_orders")
      .select("id, items, created_at, collective_close_date")
      .eq("user_id", userId)
      .eq("order_type", "collective")
      .eq("status", "pending")
      .maybeSingle();

    if (!existingOrder) return;

    if (!waitingListData || waitingListData.length === 0) {
      await supabase
        .from("user_orders")
        .delete()
        .eq("id", existingOrder.id);
      return;
    }

    const serverNow = await fetchServerTime().catch(() => new Date());
    const orderCreatedAt = new Date(existingOrder.created_at);
    const hasManuallyFrozenItems = existingOrder.items && (existingOrder.items as any[]).some(
      (item: any) => item.participants_count != null && Number(item.participants_count) > 0
    );
    const isFrozenCycle = hasManuallyFrozenItems || isCollectiveOrderClosed({
      createdAt: existingOrder.created_at,
      collectiveCloseDate: existingOrder.collective_close_date,
      now: serverNow,
    });

    const frozenPriceMap = new Map<string, number>();
    const frozenParticipantsMap = new Map<string, number>();
    if (isFrozenCycle && existingOrder.items) {
      (existingOrder.items as any[]).forEach((item: any) => {
        const key = `${item.product_id}||${item.flavor || ''}`;
        frozenPriceMap.set(key, item.price_per_unit);
        if (item.participants_count != null) {
          frozenParticipantsMap.set(key, item.participants_count);
        }
        if (!frozenPriceMap.has(item.product_id)) {
          frozenPriceMap.set(item.product_id, item.price_per_unit);
        }
        if (item.participants_count != null && !frozenParticipantsMap.has(item.product_id)) {
          frozenParticipantsMap.set(item.product_id, item.participants_count);
        }
      });
    }

    const productIds = [...new Set(waitingListData.map(i => i.product_id))];
    const { data: productsData } = await supabase
      .from("products")
      .select("id, prices, total_orders_count")
      .in("id", productIds);

    const productPricesMap = new Map<string, any[]>();
    const productCountsMap = new Map<string, number>();
    productsData?.forEach(p => {
      productPricesMap.set(p.id, (p.prices as any[]) || []);
      productCountsMap.set(p.id, p.total_orders_count || 0);
    });

    const calcTierPrice = (productId: string, participants: number): number | null => {
      const prices = productPricesMap.get(productId);
      return getCollectiveTierPrice(prices, participants);
    };

    const orderItems = waitingListData.map(item => {
      let unitPrice = item.current_price_per_unit;
      let participantsCount: number | undefined;
      if (isFrozenCycle) {
        const key = `${item.product_id}||${item.flavor || ''}`;
        unitPrice = frozenPriceMap.get(key) ?? frozenPriceMap.get(item.product_id) ?? item.current_price_per_unit;
        participantsCount = frozenParticipantsMap.get(key) ?? frozenParticipantsMap.get(item.product_id);
      } else {
        const totalCount = productCountsMap.get(item.product_id) || 0;
        const recalcPrice = calcTierPrice(item.product_id, totalCount);
        if (recalcPrice !== null) {
          unitPrice = recalcPrice;
        }
      }
      const result: any = {
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: unitPrice,
        product_image: item.product_image,
      };
      if (participantsCount != null) {
        result.participants_count = participantsCount;
      }
      return result;
    });

    if (!isFrozenCycle) {
      for (const item of waitingListData) {
        const totalCount = productCountsMap.get(item.product_id) || 0;
        const newPrice = calcTierPrice(item.product_id, totalCount);
        if (newPrice !== null && newPrice !== item.current_price_per_unit) {
          await supabase
            .from("waiting_list_items")
            .update({ current_price_per_unit: newPrice })
            .eq("id", item.id);
        }
      }
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price_per_unit) * item.quantity,
      0
    );

    let fullPrice = 0;
    orderItems.forEach(item => {
      const prices = productPricesMap.get(item.product_id);
      const firstTierPrice = getFirstTierPrice(prices, Number(item.price_per_unit));
      fullPrice += firstTierPrice * item.quantity;
    });

    const discountAmount = fullPrice - subtotal;

    await supabase
      .from("user_orders")
      .update({
        items: orderItems,
        subtotal,
        total_amount: subtotal,
        discount_amount: discountAmount,
      })
      .eq("id", existingOrder.id);
  } catch (error) {
    console.error("Error syncing waiting list order:", error);
  }
};

/**
 * Apply or cancel a promo tier on an order. Recalculates prices based on the tier.
 * tier=null cancels the promo and restores original prices.
 */
export const applyPromoTier = async (
  order: {
    id: string;
    items: OrderItem[];
    order_type: OrderType;
    participants_count: number | null;
    status: OrderStatus;
    delivery_cost: number;
  },
  tier: number | null,
): Promise<void> => {
  const productIds = [...new Set(order.items.map(item => item.product_id))];
  const { data: productsData } = await supabase
    .from("products")
    .select("id, prices, total_orders_count")
    .in("id", productIds);

  if (!productsData) throw new Error("Error al obtener precios de productos");

  const productPricesMap: Record<string, any[]> = {};
  const productCountersMap: Record<string, number> = {};
  productsData.forEach((p: any) => {
    productPricesMap[p.id] = p.prices || [];
    productCountersMap[p.id] = p.total_orders_count || 0;
  });

  if (tier === null) {
    // Cancel promo: restore to original prices based on order type
    const restoredItems = order.items.map(item => {
      const prices = productPricesMap[item.product_id] || [];
      let restoredPrice = item.price_per_unit;

      if (order.order_type === 'immediate') {
        restoredPrice = prices[1]?.price || prices[0]?.price || item.price_per_unit;
      } else {
        const participantsCount =
          (item as any).participants_count ||
          order.participants_count ||
          productCountersMap[item.product_id] ||
          1;
        const matchedPrice = getCollectiveTierPrice(prices, participantsCount);
        restoredPrice = matchedPrice ?? item.price_per_unit;
      }

      return { ...item, price_per_unit: restoredPrice };
    });

    const restoredSubtotal = restoredItems.reduce((sum, item) => sum + item.price_per_unit * item.quantity, 0);
    const firstTierTotal = restoredItems.reduce((sum, item) => {
      const prices = productPricesMap[item.product_id] || [];
      return sum + (prices[0]?.price || item.price_per_unit) * item.quantity;
    }, 0);
    const restoredDiscount = firstTierTotal - restoredSubtotal;
    const restoredTotal = restoredSubtotal + order.delivery_cost;

    const { error } = await supabase
      .from("user_orders")
      .update({
        items: restoredItems as any,
        subtotal: restoredSubtotal,
        discount_amount: restoredDiscount,
        total_amount: restoredTotal,
        is_promo: false,
        promo_tier: null,
      })
      .eq("id", order.id);

    if (error) throw error;
    return;
  }

  // Recalculate items with new prices based on tier (1-5 maps to prices[0]-prices[4])
  const updatedItems = order.items.map(item => {
    const prices = productPricesMap[item.product_id] || [];
    const priceIndex = tier - 1;
    const newPrice = prices[priceIndex]?.price || item.price_per_unit;
    return { ...item, price_per_unit: newPrice };
  });

  const newSubtotal = updatedItems.reduce((sum, item) => sum + item.price_per_unit * item.quantity, 0);
  const firstTierTotal = order.items.reduce((sum, item) => {
    const prices = productPricesMap[item.product_id] || [];
    const firstPrice = prices[0]?.price || item.price_per_unit;
    return sum + firstPrice * item.quantity;
  }, 0);
  const discountAmount = firstTierTotal - newSubtotal;
  const newTotal = newSubtotal + order.delivery_cost;

  const { error } = await supabase
    .from("user_orders")
    .update({
      items: updatedItems as any,
      subtotal: newSubtotal,
      discount_amount: discountAmount,
      total_amount: newTotal,
      is_promo: true,
      promo_tier: tier,
    })
    .eq("id", order.id);

  if (error) throw error;
};
