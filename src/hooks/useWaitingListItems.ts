import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCollectiveTierPrice } from "@/lib/collectivePricing";
import { ensurePendingCollectiveOrder, syncWaitingListOrder } from "@/services/orderService";
import type { WaitingListItem } from "@/contexts/CartContext";

export const useWaitingListItems = (
  currentUserId: string | null,
  getSessionId: () => string
) => {
  const [waitingListItems, setWaitingListItems] = useState<WaitingListItem[]>([]);

  const fetchWaitingListItems = useCallback(async (userId: string | null): Promise<WaitingListItem[]> => {
    try {
      let query = supabase.from('waiting_list_items').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((raw) => {
        const item = raw as any;
        return {
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          flavor: item.flavor,
          quantity: item.quantity,
          current_price_per_unit: Number(item.current_price_per_unit),
          product_image: item.product_image,
          brand_slug: item.brand_slug,
          retail_price_per_unit: item.retail_price_per_unit == null ? null : Number(item.retail_price_per_unit),
          guaranteed_price_per_unit: item.guaranteed_price_per_unit == null ? null : Number(item.guaranteed_price_per_unit),
          super_price_per_unit: item.super_price_per_unit == null ? null : Number(item.super_price_per_unit),
          product_link: item.product_link,
        };
      });
    } catch (error) {
      console.error('Error fetching waiting list:', error);
      return [];
    }
  }, [getSessionId]);

  const addToWaitingList = async (item: Omit<WaitingListItem, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const insertData: any = {
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        current_price_per_unit: item.current_price_per_unit,
        product_image: item.product_image,
        brand_slug: item.brand_slug ?? null,
        retail_price_per_unit: item.retail_price_per_unit ?? null,
        guaranteed_price_per_unit: item.guaranteed_price_per_unit ?? item.current_price_per_unit,
        super_price_per_unit: item.super_price_per_unit ?? null,
        product_link: item.product_link ?? null,
      };

      if (session?.user) {
        insertData.user_id = session.user.id;
      } else {
        insertData.session_id = getSessionId();
      }

      // Check if same product+flavor exists
      let existingQuery = supabase
        .from('waiting_list_items')
        .select('id, quantity')
        .eq('product_id', item.product_id);

      if (item.flavor) {
        existingQuery = existingQuery.eq('flavor', item.flavor);
      } else {
        existingQuery = existingQuery.is('flavor', null);
      }

      if (session?.user) {
        existingQuery = existingQuery.eq('user_id', session.user.id);
      } else {
        existingQuery = existingQuery.eq('session_id', getSessionId());
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, 99);
        const { error } = await supabase
          .from('waiting_list_items')
          .update({ quantity: newQty, current_price_per_unit: item.current_price_per_unit })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('waiting_list_items').insert(insertData);
        if (error) throw error;
      }

      const waiting = await fetchWaitingListItems(session?.user?.id || null);
      setWaitingListItems(waiting);

      if (session?.user) {
        await ensurePendingCollectiveOrder(session.user.id);
        if (item.brand_slug) {
          await supabase.rpc("refresh_brand_goal" as any, { _brand_slug: item.brand_slug } as any);
        }
      }

      toast.success('Producto agregado a la lista de espera');
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      toast.error('Error al agregar a la lista de espera');
    }
  };

  const updateWaitingListItemQuantity = async (
    id: string,
    quantity: number,
    /** Pass current waitingListItems from parent to avoid stale closure */
    currentItems: WaitingListItem[]
  ) => {
    try {
      if (quantity < 1 || quantity > 99) return;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      const item = currentItems.find(i => i.id === id);
      if (!item) return;

      // Optimistic local update
      setWaitingListItems(prev =>
        prev.map(i => i.id === id ? { ...i, quantity } : i)
      );

      await supabase.from("waiting_list_items").update({ quantity }).eq("id", id);

      const [orderResult, productResult, userItemsResult] = await Promise.all([
        userId
          ? supabase
              .from("user_orders")
              .select("id")
              .eq("user_id", userId)
              .eq("order_type", "collective")
              .eq("status", "pending")
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("products")
          .select("prices, total_orders_count")
          .eq("id", item.product_id)
          .maybeSingle(),
        userId
          ? supabase
              .from("waiting_list_items")
              .select("quantity")
              .eq("user_id", userId)
              .eq("product_id", item.product_id)
          : Promise.resolve({ data: null })
      ]);

      const hasExistingOrder = !!orderResult.data;
      const product = productResult.data;
      const userTotalQty = (userItemsResult.data || []).reduce(
        (sum, i) => sum + (i.quantity || 0), 0
      );

      const baseParticipants = Number(product?.total_orders_count ?? 0);
      const effectiveParticipants = hasExistingOrder
        ? baseParticipants
        : baseParticipants + userTotalQty;

      let newPrice: number | null = null;
      if (product?.prices) {
        newPrice = getCollectiveTierPrice(product.prices, effectiveParticipants);
      }

      if (newPrice !== null) {
        await supabase
          .from("waiting_list_items")
          .update({ current_price_per_unit: newPrice })
          .eq("id", id);
        setWaitingListItems(prev =>
          prev.map(i => i.id === id ? { ...i, current_price_per_unit: newPrice! } : i)
        );
      }

      if (userId && hasExistingOrder) {
        await syncWaitingListOrder(userId);
      }
    } catch (error) {
      console.error("Error updating waiting list item:", error);
      toast.error("Error al actualizar cantidad");
      const waiting = await fetchWaitingListItems(currentUserId);
      setWaitingListItems(waiting);
    }
  };

  const updateWaitingListItemFlavor = async (id: string, flavor: string) => {
    try {
      await supabase
        .from('waiting_list_items')
        .update({ flavor })
        .eq('id', id);

      const waiting = await fetchWaitingListItems(currentUserId);
      setWaitingListItems(waiting);

      if (currentUserId) {
        await syncWaitingListOrder(currentUserId);
      }
    } catch (error) {
      console.error('Error updating waiting list item flavor:', error);
      toast.error('Error al actualizar sabor');
    }
  };

  const removeFromWaitingList = async (id: string) => {
    try {
      await supabase.from('waiting_list_items').delete().eq('id', id);

      const waiting = await fetchWaitingListItems(currentUserId);
      setWaitingListItems(waiting);

      if (currentUserId) {
        await syncWaitingListOrder(currentUserId);
      }

      toast.success('Producto eliminado de la lista de espera');
    } catch (error) {
      console.error('Error removing from waiting list:', error);
      toast.error('Error al eliminar de la lista');
    }
  };

  const clearWaitingList = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      let query = supabase.from('waiting_list_items').delete();

      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      await query;
      setWaitingListItems([]);
    } catch (error) {
      console.error('Error clearing waiting list:', error);
    }
  };

  return {
    waitingListItems,
    setWaitingListItems,
    fetchWaitingListItems,
    addToWaitingList,
    updateWaitingListItemQuantity,
    updateWaitingListItemFlavor,
    removeFromWaitingList,
    clearWaitingList,
  };
};
