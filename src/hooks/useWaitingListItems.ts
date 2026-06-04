import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

      // Self-heal: схлопываем исторические дубли одного product_id+flavor
      const rowsRaw = (data || []) as any[];
      const groups = new Map<string, any[]>();
      for (const r of rowsRaw) {
        const k = `${r.product_id}::${r.flavor ?? ""}`;
        const arr = groups.get(k) ?? [];
        arr.push(r);
        groups.set(k, arr);
      }
      const healed: any[] = [];
      for (const arr of groups.values()) {
        if (arr.length === 1) {
          healed.push(arr[0]);
          continue;
        }
        const total = Math.min(arr.reduce((s, r) => s + (r.quantity ?? 0), 0), 99);
        const [keep, ...extras] = arr;
        keep.quantity = total;
        healed.push(keep);
        void supabase.from("waiting_list_items").update({ quantity: total }).eq("id", keep.id);
        void supabase.from("waiting_list_items").delete().in("id", extras.map((r) => r.id));
      }
      healed.sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")));
      return healed.map((raw) => {
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

  // Пересчитать collecta-агрегат марки (refresh_brand_goal обновляет brand_overrides) —
  // это шлёт realtime-событие, на которое подписаны прогресс-бары и ценовой мета-кэш.
  const refreshBrandGoals = async (slugs: Array<string | null | undefined>) => {
    const unique = [...new Set(slugs.filter((s): s is string => !!s))];
    await Promise.all(
      unique.map((slug) =>
        supabase
          .rpc("refresh_brand_goal" as any, { _brand_slug: slug } as any)
          .then(() => undefined, () => undefined),
      ),
    );
  };

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

      const { data: existingRows } = await existingQuery.order('created_at', { ascending: true });

      if (existingRows && existingRows.length > 0) {
        // Суммируем все совпадающие строки (включая возможные дубли) и схлопываем в одну
        const totalExisting = existingRows.reduce((s: number, r: any) => s + (r.quantity ?? 0), 0);
        const newQty = Math.min(totalExisting + item.quantity, 99);
        const [keep, ...extras] = existingRows as any[];
        const { error } = await supabase
          .from('waiting_list_items')
          .update({ quantity: newQty, current_price_per_unit: item.current_price_per_unit })
          .eq('id', keep.id);
        if (error) throw error;
        if (extras.length > 0) {
          await supabase.from('waiting_list_items').delete().in('id', extras.map((r: any) => r.id));
        }
      } else {
        const { error } = await supabase.from('waiting_list_items').insert(insertData);
        if (error) throw error;
      }

      const waiting = await fetchWaitingListItems(session?.user?.id || null);
      setWaitingListItems(waiting);

      if (session?.user) {
        await ensurePendingCollectiveOrder(session.user.id);
        if (item.brand_slug) {
          const { error: goalError } = await supabase.rpc("refresh_brand_goal" as any, { _brand_slug: item.brand_slug } as any);
          if (goalError) throw goalError;
        }
      }

      toast.success('Producto agregado a la lista de espera');
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      toast.error('Error al agregar a la lista de espera');
      throw error;
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

      const { data: brand } = item.brand_slug
        ? await supabase
            .from("brand_collection_public" as any)
            .select("goal_reached")
            .eq("slug", item.brand_slug)
            .maybeSingle()
        : { data: null };

      const newPrice = (brand as any)?.goal_reached
        ? (item.super_price_per_unit ?? item.current_price_per_unit)
        : (item.guaranteed_price_per_unit ?? item.current_price_per_unit);

      await supabase
        .from("waiting_list_items")
        .update({ quantity, current_price_per_unit: newPrice })
        .eq("id", id);

      setWaitingListItems(prev =>
        prev.map(i => i.id === id ? { ...i, quantity, current_price_per_unit: newPrice } : i)
      );

      if (userId) {
        await syncWaitingListOrder(userId);
        if (item.brand_slug) {
          const { error: goalError } = await supabase.rpc("refresh_brand_goal" as any, { _brand_slug: item.brand_slug } as any);
          if (goalError) throw goalError;
        }
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
      const removed = waitingListItems.find((i) => i.id === id);
      await supabase.from('waiting_list_items').delete().eq('id', id);

      const waiting = await fetchWaitingListItems(currentUserId);
      setWaitingListItems(waiting);

      if (currentUserId) {
        await syncWaitingListOrder(currentUserId);
      }
      await refreshBrandGoals([removed?.brand_slug]);

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

      const clearedSlugs = waitingListItems.map((i) => i.brand_slug);
      await query;
      setWaitingListItems([]);
      await refreshBrandGoals(clearedSlugs);
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
