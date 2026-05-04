import { supabase } from "@/integrations/supabase/client";
import { getCollectiveTierPrice, getFirstTierPrice, isCollectiveOrderClosed } from "@/lib/collectivePricing";
import { formatPrice, formatFullName } from "@/lib/formatting";
import { parseAddress } from "@/lib/address";
import { fetchServerTime } from "@/lib/serverClock";
import type { OrderItem, OrderType, OrderStatus } from "@/lib/types";

/**
 * Creates a new pending collective order for the CURRENT cycle if none exists,
 * or syncs the current-cycle order. Closed-cycle pending orders are left untouched.
 */
export const ensurePendingCollectiveOrder = async (userId: string) => {
  const { data: pendingOrders } = await supabase
    .from("user_orders")
    .select("id, order_number, created_at, collective_close_date, items")
    .eq("user_id", userId)
    .eq("order_type", "collective")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const serverNow = await fetchServerTime().catch(() => new Date());

  // Find a CURRENT-cycle pending order (not closed)
  const currentCycleOrder = (pendingOrders || []).find((o) => {
    return !isCollectiveOrderClosed({
      createdAt: o.created_at,
      collectiveCloseDate: o.collective_close_date,
      now: serverNow,
    });
  });

  if (currentCycleOrder) {
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
 * Syncs waiting list items with the CURRENT-cycle pending collective order.
 * Closed-cycle orders are NOT touched here — their items are managed via
 * `updateClosedOrderItemQuantity` / `removeClosedOrderItem` instead.
 */
export const syncWaitingListOrder = async (userId: string) => {
  try {
    const { data: waitingListData } = await supabase
      .from("waiting_list_items")
      .select("*")
      .eq("user_id", userId);

    const { data: pendingOrders } = await supabase
      .from("user_orders")
      .select("id, items, created_at, collective_close_date")
      .eq("user_id", userId)
      .eq("order_type", "collective")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const serverNow = await fetchServerTime().catch(() => new Date());

    // Operate ONLY on the current-cycle pending order. Skip closed ones.
    const existingOrder = (pendingOrders || []).find((o) => {
      return !isCollectiveOrderClosed({
        createdAt: o.created_at,
        collectiveCloseDate: o.collective_close_date,
        now: serverNow,
      });
    });

    if (!existingOrder) return;

    if (!waitingListData || waitingListData.length === 0) {
      await supabase
        .from("user_orders")
        .delete()
        .eq("id", existingOrder.id);
      return;
    }

    // Current cycle: always recalculate dynamically.
    const isFrozenCycle = false;

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
      const totalCount = productCountsMap.get(item.product_id) || 0;
      const recalcPrice = calcTierPrice(item.product_id, totalCount);
      if (recalcPrice !== null) {
        unitPrice = recalcPrice;
      }
      const result: any = {
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: unitPrice,
        product_image: item.product_image,
      };
      return result;
    });

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
 * Update quantity of a single item inside a CLOSED-cycle pending order.
 * Only modifies that user's snapshot — global counters are untouched
 * (the DB trigger filters by `created_at >= week_start`, so old orders
 * don't affect `waiting_for_discount_count`).
 *
 * The user's individual `participants_count` snapshot grows by the qty delta,
 * which can move them into a lower tier and reduce their personal price.
 */
export const updateClosedOrderItem = async (
  orderId: string,
  itemMatch: { product_id: string; flavor: string | null },
  newQuantity: number
): Promise<void> => {
  if (newQuantity < 1 || newQuantity > 99) return;

  const { data: order } = await supabase
    .from("user_orders")
    .select("id, items, delivery_cost, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "pending") return;

  const items = (order.items as any[]) || [];
  const idx = items.findIndex(
    (i) => i.product_id === itemMatch.product_id && (i.flavor || null) === itemMatch.flavor
  );
  if (idx === -1) return;

  const current = items[idx];
  const oldQty = Number(current.quantity || 0);
  const delta = newQuantity - oldQty;

  // Recalculate this user's personal tier price using their personal snapshot
  // bumped by the qty delta. Global counters stay frozen.
  const baseSnapshot = Number(current.participants_count || 0);
  const personalSnapshot = Math.max(1, baseSnapshot + delta);

  const { data: product } = await supabase
    .from("products")
    .select("prices")
    .eq("id", current.product_id)
    .maybeSingle();

  let newPrice = current.price_per_unit;
  if (product?.prices) {
    const tierPrice = getCollectiveTierPrice(product.prices, personalSnapshot);
    if (tierPrice !== null) newPrice = tierPrice;
  }

  const updatedItems = items.map((i, k) =>
    k === idx
      ? {
          ...i,
          quantity: newQuantity,
          price_per_unit: newPrice,
          participants_count: personalSnapshot,
        }
      : i
  );

  const subtotal = updatedItems.reduce(
    (s, i) => s + Number(i.price_per_unit) * Number(i.quantity),
    0
  );
  const productIds = [...new Set(updatedItems.map((i) => i.product_id))];
  const { data: productsData } = await supabase
    .from("products")
    .select("id, prices")
    .in("id", productIds);
  let fullPrice = 0;
  updatedItems.forEach((i) => {
    const prod = productsData?.find((p) => p.id === i.product_id);
    const firstTier = getFirstTierPrice(prod?.prices, Number(i.price_per_unit));
    fullPrice += firstTier * Number(i.quantity);
  });

  await supabase
    .from("user_orders")
    .update({
      items: updatedItems,
      subtotal,
      total_amount: subtotal + Number(order.delivery_cost || 0),
      discount_amount: fullPrice - subtotal,
    })
    .eq("id", orderId);
};

/**
 * Remove an item from a CLOSED-cycle pending order.
 * Global counters stay frozen (trigger filter on `created_at`).
 * If the order becomes empty, it is deleted.
 */
export const removeClosedOrderItem = async (
  orderId: string,
  itemMatch: { product_id: string; flavor: string | null }
): Promise<void> => {
  const { data: order } = await supabase
    .from("user_orders")
    .select("id, items, delivery_cost, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "pending") return;

  const items = (order.items as any[]) || [];
  const updatedItems = items.filter(
    (i) => !(i.product_id === itemMatch.product_id && (i.flavor || null) === itemMatch.flavor)
  );

  if (updatedItems.length === 0) {
    await supabase.from("user_orders").delete().eq("id", orderId);
    return;
  }

  const subtotal = updatedItems.reduce(
    (s, i) => s + Number(i.price_per_unit) * Number(i.quantity),
    0
  );
  const productIds = [...new Set(updatedItems.map((i) => i.product_id))];
  const { data: productsData } = await supabase
    .from("products")
    .select("id, prices")
    .in("id", productIds);
  let fullPrice = 0;
  updatedItems.forEach((i) => {
    const prod = productsData?.find((p) => p.id === i.product_id);
    const firstTier = getFirstTierPrice(prod?.prices, Number(i.price_per_unit));
    fullPrice += firstTier * Number(i.quantity);
  });

  await supabase
    .from("user_orders")
    .update({
      items: updatedItems,
      subtotal,
      total_amount: subtotal + Number(order.delivery_cost || 0),
      discount_amount: fullPrice - subtotal,
    })
    .eq("id", orderId);
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
  options?: { bonus?: number },
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

  const bonus = options?.bonus;

  // Recalculate items with new prices.
  // If `bonus` is provided, shift each item's CURRENT tier by `bonus` individually,
  // capped at the last available tier per product. Otherwise apply the absolute `tier` to all.
  const updatedItems = order.items.map(item => {
    const prices = productPricesMap[item.product_id] || [];
    let targetIdx = tier;
    if (typeof bonus === "number") {
      let baseIdx = order.order_type === "immediate" ? 1 : 0;
      if (order.order_type === "collective") {
        const matched = prices.findIndex((t: any) => Number(t.price) === Number(item.price_per_unit));
        baseIdx = matched >= 0 ? matched : 1;
      }
      targetIdx = Math.min(baseIdx + bonus, Math.max(prices.length - 1, 0));
    }
    const newPrice = prices[targetIdx]?.price ?? item.price_per_unit;
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
