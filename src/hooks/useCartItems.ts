import { useState, useCallback, useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
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

  // --- Capa de datos: usuario autenticado -> tabla directa (RLS por user_id);
  // invitado -> RPC SECURITY DEFINER acotada por session_id (bearer-token).
  // Asi un anonimo solo toca SU carrito y no puede leer/modificar el de otros.
  const dbListCart = useCallback(async (userId: string | null): Promise<any[]> => {
    if (userId) {
      const { data, error } = await supabase
        .from('cart_items').select('*')
        .eq('mode', 'retail').eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    const { data, error } = await (supabase.rpc as any)('guest_cart_list', { _session_id: getSessionId() } as any);
    if (error) throw error;
    return (data ?? []) as any[];
  }, [getSessionId]);

  const dbFindCart = useCallback(async (userId: string | null, productId: string, flavor: string | null): Promise<any[]> => {
    if (userId) {
      let q: any = supabase.from('cart_items').select('id, quantity')
        .eq('mode', 'retail').eq('product_id', productId).eq('user_id', userId);
      q = flavor ? q.eq('flavor', flavor) : q.is('flavor', null);
      const { data } = await q.order('created_at', { ascending: true });
      return (data ?? []) as any[];
    }
    const { data } = await (supabase.rpc as any)('guest_cart_find', {
      _session_id: getSessionId(), _product_id: productId, _flavor: flavor,
    } as any);
    return (data ?? []) as any[];
  }, [getSessionId]);

  const dbInsertCart = useCallback(async (userId: string | null, item: Omit<CartItem, 'id'>, quantity: number): Promise<string> => {
    if (userId) {
      const { data, error } = await supabase.from('cart_items').insert({
        user_id: userId,
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity,
        price_per_unit: item.price_per_unit,
        product_image: item.product_image,
        product_link: item.product_link ?? null,
        mode: 'retail',
      } as any).select('id').single();
      if (error || !data) throw error ?? new Error('insert failed');
      return (data as any).id as string;
    }
    const { data, error } = await (supabase.rpc as any)('guest_cart_insert', {
      _session_id: getSessionId(),
      _product_id: item.product_id,
      _product_name: item.product_name,
      _flavor: item.flavor ?? null,
      _quantity: quantity,
      _price_per_unit: item.price_per_unit,
      _product_image: item.product_image ?? null,
      _product_link: item.product_link ?? null,
    } as any);
    if (error || !data) throw error ?? new Error('insert failed');
    return data as string;
  }, [getSessionId]);

  const dbSetQuantity = useCallback(async (userId: string | null, id: string, qty: number): Promise<{ error: any }> => {
    if (userId) {
      return await supabase.from('cart_items').update({ quantity: Math.min(qty, MAX_QTY) }).eq('id', id);
    }
    return await (supabase.rpc as any)('guest_cart_set_quantity', { _session_id: getSessionId(), _id: id, _quantity: Math.min(qty, MAX_QTY) } as any);
  }, [getSessionId]);

  const dbDeleteCart = useCallback(async (userId: string | null, ids: string[]): Promise<{ error: any }> => {
    if (userId) {
      return await supabase.from('cart_items').delete().in('id', ids);
    }
    return await (supabase.rpc as any)('guest_cart_delete', { _session_id: getSessionId(), _ids: ids } as any);
  }, [getSessionId]);

  const dbSetFlavor = useCallback(async (userId: string | null, id: string, flavor: string): Promise<{ error: any }> => {
    if (userId) {
      return await supabase.from('cart_items').update({ flavor }).eq('id', id);
    }
    return await (supabase.rpc as any)('guest_cart_set_flavor', { _session_id: getSessionId(), _id: id, _flavor: flavor } as any);
  }, [getSessionId]);

  const dbClearCart = useCallback(async (userId: string | null): Promise<void> => {
    if (userId) {
      await supabase.from('cart_items').delete().eq('mode', 'retail').eq('user_id', userId);
      return;
    }
    await (supabase.rpc as any)('guest_cart_clear', { _session_id: getSessionId() } as any);
  }, [getSessionId]);

  const fetchCartItems = useCallback(async (userId: string | null): Promise<CartItem[]> => {
    try {
      const data = await dbListCart(userId);
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
  }, [dbListCart]);

  const failSync = useCallback(
    async (msg: string) => {
      toast.error(msg);
      const cart = await fetchCartItems(userIdRef.current);
      setCartItems(cart);
    },
    [fetchCartItems],
  );

  // Persiste (debounced) la ultima cantidad deseada de una linea. 0 = borrar.
  const scheduleWrite = useCallback(
    (lineId: string, delay = WRITE_DEBOUNCE_MS) => {
      const timers = writeTimers.current;
      const prev = timers.get(lineId);
      if (prev) clearTimeout(prev);

      const flush = () => {
        const realId = tempIdMap.current.get(lineId) ?? lineId;
        if (realId.startsWith("tmp-")) {
          // El INSERT de esta linea sigue en vuelo: reintentar en breve
          timers.set(lineId, setTimeout(flush, 200));
          return;
        }
        timers.delete(lineId);
        const qty = pendingQty.current.get(lineId);
        if (qty === undefined) return;

        const doWrite = async () => {
          const { error } =
            qty <= 0
              ? await dbDeleteCart(userIdRef.current, [realId])
              : await dbSetQuantity(userIdRef.current, realId, qty);
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
    [failSync, dbDeleteCart, dbSetQuantity],
  );

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    try {
      const addQty = Math.min(Math.max(item.quantity, 1), MAX_QTY);
      track("Add to Cart", {
        name: item.product_name,
        flavor: item.flavor,
        qty: addQty,
        price: item.price_per_unit,
        mode: "retail",
      });

      // Si la linea (producto+sabor) ya existe localmente, es un incremento
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

      // Optimista: la linea aparece ya mismo con un id temporal
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

      // Persistencia en segundo plano. user_id desde la sesion actual;
      // invitado -> RPC por session_id.
      const { data: { session } } = await supabase.auth.getSession();
      const ownerId = session?.user?.id ?? null;

      // Check if same product+flavor exists (otra sesion / duplicados viejos)
      const existingRows = await dbFindCart(ownerId, item.product_id, item.flavor ?? null);

      if (existingRows && existingRows.length > 0) {
        // Suma todas las filas coincidentes (incl. duplicados) y colapsa en una
        const totalExisting = existingRows.reduce((s: number, r: any) => s + (r.quantity ?? 0), 0);
        const localPending = pendingQty.current.get(tempId);
        const newQty = Math.min(localPending ?? (totalExisting + addQty), MAX_QTY);
        const [keep, ...extras] = existingRows as any[];
        tempIdMap.current.set(tempId, keep.id);
        setCartItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: keep.id, quantity: newQty } : i)),
        );
        const { error } = await dbSetQuantity(ownerId, keep.id, newQty);
        if (error) throw error;
        if (extras.length > 0) {
          await dbDeleteCart(ownerId, extras.map((r: any) => r.id));
        }
      } else {
        const insertQty = Math.min(pendingQty.current.get(tempId) ?? addQty, MAX_QTY);
        const newId = await dbInsertCart(ownerId, item, insertQty);
        tempIdMap.current.set(tempId, newId);
        setCartItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: newId } : i)),
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
      const { error } = await dbSetFlavor(userIdRef.current, realId, flavor);
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
      // mode-filtro dentro de dbClearCart: no toca filas mayorista del mismo user
      await dbClearCart(userIdRef.current);
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
