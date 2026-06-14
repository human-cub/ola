import { supabase } from "@/integrations/supabase/client";
import { applyCashRounding } from "@/lib/cashRounding";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, address")
    .eq("user_id", userId)
    .maybeSingle();

  const customerName = formatFullName(profile?.first_name, profile?.last_name, "Cliente");
  const phone = profile?.phone || "";

  const deliveryAddress = parseAddress(profile?.address ?? null);

  const orderItems = waitingListData.map((raw) => {
    const item = raw as any;
    return {
      product_id: item.product_id,
      product_name: item.product_name,
      flavor: item.flavor,
      quantity: item.quantity,
      price_per_unit: Number(item.current_price_per_unit),
      product_image: item.product_image,
      brand_slug: item.brand_slug ?? null,
      retail_price_per_unit: item.retail_price_per_unit == null ? null : Number(item.retail_price_per_unit),
      guaranteed_price_per_unit: item.guaranteed_price_per_unit == null ? null : Number(item.guaranteed_price_per_unit),
      super_price_per_unit: item.super_price_per_unit == null ? null : Number(item.super_price_per_unit),
      product_link: item.product_link ?? null,
    };
  });

  const subtotal = waitingListData.reduce(
    (sum, item) => sum + Number(item.current_price_per_unit) * item.quantity,
    0
  );

  const fullPrice = orderItems.reduce(
    (sum, item) => sum + Number(item.retail_price_per_unit ?? item.price_per_unit) * item.quantity,
    0,
  );

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

    // Read the customer's applied promo (client-side) so the synced order carries it
    // and the admin sees it. Collective promo = one level up: PG -> SP.
    let promoCode: string | null = null;
    let promoBonus = 0;
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("ola_applied_promo") : null;
      if (raw) { const pj = JSON.parse(raw); promoCode = pj?.code ?? null; promoBonus = Number(pj?.tier_bonus ?? 0); }
    } catch { /* ignore */ }
    // Referrer reward: a pending one-time Super discount on the referrer's group order.
    const { data: prof } = await supabase
      .from("profiles")
      .select("has_referral_reward, has_social_reward")
      .eq("user_id", userId)
      .maybeSingle();
    const hasReferral = !!(prof as any)?.has_referral_reward;
    const hasSocial = !!(prof as any)?.has_social_reward;
    const hasReward = hasReferral || hasSocial;
    const hasPromo = (!!promoCode && promoBonus > 0) || hasReward;

    if (!waitingListData || waitingListData.length === 0) {
      await supabase
        .from("user_orders")
        .delete()
        .eq("id", existingOrder.id);
      return;
    }

    const orderItems = waitingListData.map(raw => {
      const item = raw as any;
      const result: any = {
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: hasPromo
          ? Number(item.super_price_per_unit ?? item.guaranteed_price_per_unit ?? item.current_price_per_unit)
          : Number(item.current_price_per_unit),
        product_image: item.product_image,
        brand_slug: item.brand_slug ?? null,
        retail_price_per_unit: item.retail_price_per_unit == null ? null : Number(item.retail_price_per_unit),
        guaranteed_price_per_unit: item.guaranteed_price_per_unit == null ? null : Number(item.guaranteed_price_per_unit),
        super_price_per_unit: item.super_price_per_unit == null ? null : Number(item.super_price_per_unit),
        product_link: item.product_link ?? null,
      };
      return result;
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price_per_unit) * item.quantity,
      0
    );

    const fullPrice = orderItems.reduce(
      (sum, item) => sum + Number(item.retail_price_per_unit ?? item.price_per_unit) * item.quantity,
      0,
    );

    const discountAmount = fullPrice - subtotal;

    await supabase
      .from("user_orders")
      .update({
        items: orderItems,
        subtotal,
        total_amount: subtotal,
        discount_amount: discountAmount,
        is_promo: hasPromo,
        promo_code: hasPromo ? (promoCode ?? (hasReferral ? "REFERIDO" : hasSocial ? "INSTAGRAM" : null)) : null,
        promo_tier: hasPromo ? (promoBonus || null) : null,
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
    .select("id, items, delivery_cost, status, payment_method")
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
      total_amount: applyCashRounding(subtotal + Number(order.delivery_cost || 0), (order as any).payment_method),
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
    .select("id, items, delivery_cost, status, payment_method")
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
      total_amount: applyCashRounding(subtotal + Number(order.delivery_cost || 0), (order as any).payment_method),
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
    payment_method?: string | null;
  },
  tier: number | null,
  options?: { bonus?: number; code?: string | null },
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
    const restoredTotal = applyCashRounding(restoredSubtotal + order.delivery_cost, order.payment_method);

    const { error } = await supabase
      .from("user_orders")
      .update({
        items: restoredItems as any,
        subtotal: restoredSubtotal,
        discount_amount: restoredDiscount,
        total_amount: restoredTotal,
        is_promo: false,
        promo_tier: null,
        promo_code: null,
      } as any)
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
  const newTotal = applyCashRounding(newSubtotal + order.delivery_cost, order.payment_method);

  const { error } = await supabase
    .from("user_orders")
    .update({
      items: updatedItems as any,
      subtotal: newSubtotal,
      discount_amount: discountAmount,
      total_amount: newTotal,
      is_promo: true,
      promo_tier: tier,
      promo_code: options?.code ?? null,
    } as any)
    .eq("id", order.id);

  if (error) throw error;
};


export type OrderPriceLevel = "ca" | "garantizado" | "super";

/**
 * Set an order's price level. Sources each item's prices from the stored fields, falling back
 * to the catalog priceMap (CA=t1, PG=t3, SP=t4) so immediate orders (no stored PG/SP) work too.
 *   ca          -> Comprar Ahora (t1)  [base for immediate]
 *   garantizado -> Precio Garantizado (t3)  [base for collective]
 *   super       -> Super-Precio (t4)
 * is_promo = level above the order's base. Recomputes subtotal / discount (vs retail) / total.
 */
export const setOrderPriceLevel = async (
  order: { id: string; items: any[]; delivery_cost: number | null; order_type?: string; payment_method?: string | null },
  level: OrderPriceLevel,
  opts?: { priceMap?: Map<string, { t1?: number; t3?: number; t4?: number }>; code?: string | null },
): Promise<void> => {
  const priceMap = opts?.priceMap;
  const updatedItems = (order.items ?? []).map((raw: any) => {
    const item = raw as any;
    const info = priceMap?.get(item.product_id);
    const ca = Number(item.comprar_ahora_price_per_unit ?? info?.t1 ?? item.price_per_unit);
    const pg = Number(item.guaranteed_price_per_unit ?? info?.t3 ?? item.price_per_unit);
    const sp = Number(item.super_price_per_unit ?? info?.t4 ?? pg);
    const price = level === "super" ? sp : level === "ca" ? ca : pg;
    return { ...item, price_per_unit: price };
  });
  const subtotal = updatedItems.reduce((acc: number, it: any) => acc + Number(it.price_per_unit) * it.quantity, 0);
  const fullPrice = updatedItems.reduce(
    (acc: number, it: any) => acc + Number(it.retail_price_per_unit ?? it.price_per_unit) * it.quantity,
    0,
  );
  const discountAmount = Math.max(fullPrice - subtotal, 0);
  const totalAmount = applyCashRounding(subtotal + (Number(order.delivery_cost) || 0), order.payment_method);
  const base = order.order_type === "immediate" ? "ca" : "garantizado";
  const { error } = await supabase
    .from("user_orders")
    .update({
      items: updatedItems as any,
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      is_promo: level !== base,
      promo_code: opts?.code ?? null,
      promo_tier: null,
    } as any)
    .eq("id", order.id);
  if (error) throw error;
};
