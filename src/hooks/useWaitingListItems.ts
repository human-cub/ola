import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ensurePendingCollectiveOrder, syncWaitingListOrder } from "@/services/orderService";
import { collectaUnitPrice, dispatchCollectaDelta } from "@/lib/collectaBus";
import type { WaitingListItem } from "@/contexts/CartContext";

const MAX_QTY = 99;
const WRITE_DEBOUNCE_MS = 350;

export const useWaitingListItems = (
  currentUserId: string | null,
  getSessionId: () => string
) => {
  const [waitingListItems, setWaitingListItems] = useState<WaitingListItem[]>([]);

  // Refs para que los timers diferidos lean siempre el estado actual
  const itemsRef = useRef<WaitingListItem[]>([]);
  useEffect(() => {
    itemsRef.current = waitingListItems;
  }, [waitingListItems]);
  const userIdRef = useRef<string | null>(currentUserId);
  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  // Optimistic-дельта суммы сбора: только для залогиненных — вклад гостя не
  // попадает в real_score (заказ не создаётся), сервер сумму не изменит.
  const emitCollectaDelta = (item: Pick<WaitingListItem, "brand_slug" | "guaranteed_price_per_unit" | "current_price_per_unit">, qtyDiff: number) => {
    if (!userIdRef.current || !qtyDiff) return;
    dispatchCollectaDelta(item.brand_slug, qtyDiff * collectaUnitPrice(item));
  };

  // Optimistic UI + escrituras diferidas (debounce) por línea, como en el carrito:
  // la cadena costosa (precio según goal_reached -> UPDATE -> sync orden -> refresh
  // collecta) corre UNA vez con la cantidad final, no en cada click.
  const pendingQty = useRef(new Map<string, number>());
  const writeTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const tempIdMap = useRef(new Map<string, string>());
  const writeChain = useRef(new Map<string, Promise<void>>());

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

  const failSync = useCallback(
    async (msg: string) => {
      toast.error(msg);
      const waiting = await fetchWaitingListItems(userIdRef.current);
      setWaitingListItems(waiting);
      // Сбросить optimistic-дельты баров к серверному значению
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("collecta-changed"));
      }
    },
    [fetchWaitingListItems],
  );

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
    // brand_overrides realtime недоступен анону после локдауна — оповещаем UI событием
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("collecta-changed"));
    }
  };

  // Цена строки по состоянию сбора марки (goal_reached -> super, иначе guaranteed)
  const resolveLinePrice = async (item: WaitingListItem): Promise<number> => {
    const { data: brand } = item.brand_slug
      ? await supabase
          .from("brand_collection_public" as any)
          .select("goal_reached")
          .eq("slug", item.brand_slug)
          .maybeSingle()
      : { data: null };

    return (brand as any)?.goal_reached
      ? (item.super_price_per_unit ?? item.current_price_per_unit)
      : (item.guaranteed_price_per_unit ?? item.current_price_per_unit);
  };

  // Flush diferido de cantidad: corre la cadena completa UNA vez con el valor final
  const scheduleWrite = useCallback(
    (lineId: string, delay = WRITE_DEBOUNCE_MS) => {
      const timers = writeTimers.current;
      const prev = timers.get(lineId);
      if (prev) clearTimeout(prev);

      const flush = () => {
        const realId = tempIdMap.current.get(lineId) ?? lineId;
        if (realId.startsWith("tmp-")) {
          timers.set(lineId, setTimeout(flush, 200));
          return;
        }
        timers.delete(lineId);
        const qty = pendingQty.current.get(lineId);
        if (qty === undefined) return;

        const doWrite = async () => {
          const item = itemsRef.current.find((i) => i.id === lineId || i.id === realId);
          if (!item) {
            // La línea fue eliminada mientras tanto: el remove ya sincronizó todo
            pendingQty.current.delete(lineId);
            return;
          }
          try {
            const newPrice = await resolveLinePrice(item);

            const { error } = await supabase
              .from("waiting_list_items")
              .update({ quantity: qty, current_price_per_unit: newPrice })
              .eq("id", realId);
            if (error) throw error;

            setWaitingListItems(prev =>
              prev.map(i => (i.id === lineId || i.id === realId) ? { ...i, current_price_per_unit: newPrice } : i)
            );

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              await syncWaitingListOrder(session.user.id);
            }
            await refreshBrandGoals([item.brand_slug]);

            if (pendingQty.current.get(lineId) === qty && !writeTimers.current.has(lineId)) {
              pendingQty.current.delete(lineId);
            }
          } catch (error) {
            console.error("Error updating waiting list item:", error);
            await failSync("Error al actualizar cantidad");
          }
        };
        const prevChain = writeChain.current.get(realId) ?? Promise.resolve();
        writeChain.current.set(realId, prevChain.then(doWrite, doWrite));
      };

      timers.set(lineId, setTimeout(flush, delay));
    },
    [failSync],
  );

  const addToWaitingList = async (item: Omit<WaitingListItem, 'id'>) => {
    // Si la línea (producto+sabor) ya existe localmente, es un incremento optimista
    const existingLocal = itemsRef.current.find(
      (i) => i.product_id === item.product_id && (i.flavor ?? null) === (item.flavor ?? null),
    );
    if (existingLocal) {
      const q = Math.min(existingLocal.quantity + item.quantity, MAX_QTY);
      pendingQty.current.set(existingLocal.id, q);
      setWaitingListItems((prev) =>
        prev.map((i) => (i.id === existingLocal.id ? { ...i, quantity: q } : i)),
      );
      emitCollectaDelta(existingLocal, q - existingLocal.quantity);
      scheduleWrite(existingLocal.id);
      toast.success('Producto agregado a mis grupos');
      return;
    }

    // Optimista: la línea aparece ya mismo con un id temporal
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setWaitingListItems((prev) => [
      ...prev,
      {
        id: tempId,
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
      },
    ]);
    emitCollectaDelta(
      {
        brand_slug: item.brand_slug ?? null,
        guaranteed_price_per_unit: item.guaranteed_price_per_unit ?? item.current_price_per_unit,
        current_price_per_unit: item.current_price_per_unit,
      },
      item.quantity,
    );
    toast.success('Producto agregado a mis grupos');

    // Persistencia en segundo plano
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
        const localPending = pendingQty.current.get(tempId);
        const newQty = Math.min(localPending ?? (totalExisting + item.quantity), MAX_QTY);
        const [keep, ...extras] = existingRows as any[];
        tempIdMap.current.set(tempId, keep.id);
        setWaitingListItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: keep.id, quantity: newQty } : i)),
        );
        const { error } = await supabase
          .from('waiting_list_items')
          .update({ quantity: newQty, current_price_per_unit: item.current_price_per_unit })
          .eq('id', keep.id);
        if (error) throw error;
        if (extras.length > 0) {
          await supabase.from('waiting_list_items').delete().in('id', extras.map((r: any) => r.id));
        }
      } else {
        const { data: created, error } = await supabase
          .from('waiting_list_items')
          .insert(insertData)
          .select('id')
          .single();
        if (error || !created) throw error ?? new Error('insert failed');
        tempIdMap.current.set(tempId, (created as any).id);
        setWaitingListItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: (created as any).id } : i)),
        );
      }

      if (session?.user) {
        await ensurePendingCollectiveOrder(session.user.id);
      }
      await refreshBrandGoals([item.brand_slug]);
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      await failSync('Error al agregar el producto');
      throw error;
    }
  };

  const updateWaitingListItemQuantity = async (
    id: string,
    quantity: number,
    /** Pass current waitingListItems from parent to avoid stale closure */
    currentItems: WaitingListItem[]
  ) => {
    if (quantity < 1 || quantity > MAX_QTY) return;

    const item =
      itemsRef.current.find(i => i.id === id) ?? currentItems.find(i => i.id === id);
    if (!item) return;

    // Optimistic local update; la cadena de persistencia corre en el flush
    pendingQty.current.set(id, quantity);
    setWaitingListItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity } : i)
    );
    emitCollectaDelta(item, quantity - item.quantity);
    scheduleWrite(id);
  };

  const updateWaitingListItemFlavor = async (id: string, flavor: string) => {
    setWaitingListItems(prev =>
      prev.map(i => i.id === id ? { ...i, flavor } : i)
    );
    const write = async (attempt = 0): Promise<void> => {
      const realId = tempIdMap.current.get(id) ?? id;
      if (realId.startsWith('tmp-')) {
        if (attempt < 25) setTimeout(() => void write(attempt + 1), 200);
        return;
      }
      try {
        const { error } = await supabase
          .from('waiting_list_items')
          .update({ flavor })
          .eq('id', realId);
        if (error) throw error;

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncWaitingListOrder(session.user.id);
        }
      } catch (error) {
        console.error('Error updating waiting list item flavor:', error);
        await failSync('Error al actualizar sabor');
      }
    };
    await write();
  };

  const removeFromWaitingList = async (id: string) => {
    const removed = itemsRef.current.find((i) => i.id === id);

    // Optimista: la línea desaparece ya mismo
    const timer = writeTimers.current.get(id);
    if (timer) clearTimeout(timer);
    writeTimers.current.delete(id);
    pendingQty.current.delete(id);
    setWaitingListItems((prev) => prev.filter((i) => i.id !== id));
    if (removed) emitCollectaDelta(removed, -removed.quantity);
    toast.success('Producto eliminado de mis grupos');

    const write = async (attempt = 0): Promise<void> => {
      const realId = tempIdMap.current.get(id) ?? id;
      if (realId.startsWith('tmp-')) {
        if (attempt < 25) setTimeout(() => void write(attempt + 1), 200);
        return;
      }
      try {
        const { error } = await supabase.from('waiting_list_items').delete().eq('id', realId);
        if (error) throw error;

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncWaitingListOrder(session.user.id);
        }
        await refreshBrandGoals([removed?.brand_slug]);
      } catch (error) {
        console.error('Error removing from waiting list:', error);
        await failSync('Error al eliminar de la lista');
      }
    };
    await write();
  };

  const clearWaitingList = async () => {
    try {
      for (const t of writeTimers.current.values()) clearTimeout(t);
      writeTimers.current.clear();
      pendingQty.current.clear();

      const { data: { session } } = await supabase.auth.getSession();

      let query = supabase.from('waiting_list_items').delete();

      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      const clearedSlugs = waitingListItems.map((i) => i.brand_slug);
      // Без optimistic-дельт: clear зовётся и после сабмита коллективного заказа,
      // где сумма сбора НЕ падает (заказ остаётся pending и продолжает считаться).
      // Ручная очистка листа обновит бары через refreshBrandGoals -> collecta-changed.
      setWaitingListItems([]);
      await query;
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
