import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CartItem } from "@/contexts/CartContext";

const MAX_QTY = 99;
const WRITE_DEBOUNCE_MS = 300;

export const useCartItems = (
  currentUserId: string | null,
  getSessionId: () => string
) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Refs para que los timers diferidos lean siempre el estado actual
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = cartItems;
  }, [cartItems]);
  const userIdRef = useRef<string | null>(currentUserId);
  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  // Optimistic UI: la interfaz cambia al instante; el servidor se sincroniza
  // en segundo plano con debounce por línea (misma estrategia que socios).
  const pendingQty = useRef(new Map<string, number>());
  const writeTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const tempIdMap = useRef(new Map<string, string>());
  const writeChain = useRef(new Map<string, Promise<void>>());

  const fetchCartItems = useCallback(async (userId: string | null): Promise<CartItem[]> => {
    try {
      let query: any = supabase.from('cart_items').select('*').eq('mode', 'retail');

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
          price_per_unit: Number(item.price_per_unit),
          product_image: item.product_image,
          product_link: item.product_link,
        };
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [];
    }
  }, [getSessionId]);

  const failSync = useCallback(
    async (msg: string) => {
      toast.error(msg);
      const cart = await fetchCartItems(userIdRef.current);
      setCartItems(cart);
    },
    [fetchCartItems],
  );

  // Persiste (debounced) la última cantidad deseada de una línea. 0 = borrar.
  const scheduleWrite = useCallback(
    (lineId: string, delay = WRITE_DEBOUNCE_MS) => {
      const timers = writeTimers.current;
      const prev = timers.get(lineId);
      if (prev) clearTimeout(prev);

      const flush = () => {
        const realId = tempIdMap.current.get(lineId) ?? lineId;
        if (realId.startsWith("tmp-")) {
          // El INSERT de esta línea sigue en vuelo: reintentar en breve
          timers.set(lineId, setTimeout(flush, 200));
          return;
        }
        timers.delete(lineId);
        const qty = pendingQty.current.get(lineId);
        if (qty === undefined) return;

        const doWrite = async () => {
          const { error } =
            qty <= 0
              ? await supabase.from('cart_items').delete().eq('id', realId)
              : await supabase
                  .from('cart_items')
                  .update({ quantity: Math.min(qty, MAX_QTY) })
                  .eq('id', realId);
          if (error) {
            console.error('cart write failed', error);
            await failSync('Error al actualizar el carrito');
            return;
          }
          if (pendingQty.current.get(lineId) === qty && !writeTimers.current.has(lineId)) {
            pendingQty.current.delete(lineId);
          }
        };
        const prevChain = writeChain.current.get(realId) ?? Promise.resolve();
        writeChain.current.set(realId, prevChain.then(doWrite, doWrite));
      };

      timers.set(lineId, setTimeout(flush, delay));
    },
    [failSync],
  );

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    try {
      const addQty = Math.min(Math.max(item.quantity, 1), MAX_QTY);

      // Si la línea (producto+sabor) ya existe localmente, es un incremento
      const existingLocal = itemsRef.current.find(
        (i) => i.product_id === item.product_id && (i.flavor ?? null) === (item.flavor ?? null),
      );
      if (existingLocal) {
        const q = Math.min(existingLocal.quantity + addQty, MAX_QTY);
        pendingQty.current.set(existingLocal.id, q);
        setCartItems((prev) =>
          prev.map((i) => (i.id === existingLocal.id ? { ...i, quantity: q } : i)),
        );
        scheduleWrite(existingLocal.id);
        toast.success('Producto agregado al carrito');
        return;
      }

      // Optimista: la línea aparece ya mismo con un id temporal
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCartItems((prev) => [
        ...prev,
        {
          id: tempId,
          product_id: item.product_id,
          product_name: item.product_name,
          flavor: item.flavor,
          quantity: addQty,
          price_per_unit: item.price_per_unit,
          product_image: item.product_image,
          product_link: item.product_link ?? null,
        },
      ]);
      toast.success('Producto agregado al carrito');

      // Persistencia en segundo plano
      const { data: { session } } = await supabase.auth.getSession();

      const insertData: any = {
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: addQty,
        price_per_unit: item.price_per_unit,
        product_image: item.product_image,
        product_link: item.product_link ?? null,
        mode: 'retail',
      };

      if (session?.user) {
        insertData.user_id = session.user.id;
      } else {
        insertData.session_id = getSessionId();
      }

      // Check if same product+flavor exists (otra sesión / duplicados viejos)
      let existingQuery: any = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('mode', 'retail')
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
        const newQty = Math.min(localPending ?? (totalExisting + addQty), MAX_QTY);
        const [keep, ...extras] = existingRows as any[];
        tempIdMap.current.set(tempId, keep.id);
        setCartItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: keep.id, quantity: newQty } : i)),
        );
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', keep.id);
        if (error) throw error;
        if (extras.length > 0) {
          await supabase.from('cart_items').delete().in('id', extras.map((r: any) => r.id));
        }
      } else {
        const insertQty = Math.min(pendingQty.current.get(tempId) ?? addQty, MAX_QTY);
        insertData.quantity = insertQty;
        const { data: created, error } = await supabase
          .from('cart_items')
          .insert(insertData)
          .select('id')
          .single();
        if (error || !created) throw error ?? new Error('insert failed');
        tempIdMap.current.set(tempId, (created as any).id);
        setCartItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: (created as any).id } : i)),
        );
        if (
          pendingQty.current.get(tempId) === insertQty &&
          !writeTimers.current.has(tempId)
        ) {
          pendingQty.current.delete(tempId);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      await failSync('Error al agregar al carrito');
      throw error;
    }
  };

  const updateCartItemQuantity = async (id: string, quantity: number) => {
    if (quantity < 1 || quantity > MAX_QTY) return;
    pendingQty.current.set(id, quantity);
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    scheduleWrite(id);
  };

  const updateCartItemFlavor = async (id: string, flavor: string) => {
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, flavor } : i)));
    const write = async (attempt = 0): Promise<void> => {
      const realId = tempIdMap.current.get(id) ?? id;
      if (realId.startsWith('tmp-')) {
        if (attempt < 25) setTimeout(() => void write(attempt + 1), 200);
        return;
      }
      const { error } = await supabase
        .from('cart_items')
        .update({ flavor })
        .eq('id', realId);
      if (error) {
        console.error('Error updating cart item flavor:', error);
        await failSync('Error al actualizar sabor');
      }
    };
    await write();
  };

  const removeFromCart = async (id: string) => {
    pendingQty.current.set(id, 0);
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    scheduleWrite(id);
    toast.success('Producto eliminado del carrito');
  };

  const clearCart = async () => {
    try {
      for (const t of writeTimers.current.values()) clearTimeout(t);
      writeTimers.current.clear();
      pendingQty.current.clear();
      setCartItems([]);

      const { data: { session } } = await supabase.auth.getSession();

      // mode-фильтр: не трогаем строки mayorista того же юзера
      let query = supabase.from('cart_items').delete().eq('mode', 'retail');

      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      await query;
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return {
    cartItems,
    setCartItems,
    fetchCartItems,
    addToCart,
    updateCartItemQuantity,
    updateCartItemFlavor,
    removeFromCart,
    clearCart,
  };
};
