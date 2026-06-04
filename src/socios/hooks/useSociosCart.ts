import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SociosCartItem {
  id: string;
  external_sku: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
}

const MAX_QTY = 999;
const WRITE_DEBOUNCE_MS = 300;

export const useSociosCart = () => {
  const [items, setItems] = useState<SociosCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Refs para que callbacks y timers diferidos lean siempre el estado actual
  const itemsRef = useRef<SociosCartItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Optimistic UI: la interfaz cambia al instante y el servidor se sincroniza
  // en segundo plano con un debounce por línea.
  // - pendingQty: última cantidad deseada por línea (0 = borrar)
  // - writeTimers: debounce por línea
  // - tempIdMap: id optimista (tmp-...) -> id real cuando el INSERT termina
  // - writeChain: serializa las escrituras de una misma línea (orden garantizado)
  const pendingQty = useRef(new Map<string, number>());
  const writeTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const tempIdMap = useRef(new Map<string, string>());
  const writeChain = useRef(new Map<string, Promise<void>>());

  const fetchItems = useCallback(async (uid: string | null) => {
    if (!uid) {
      setItems([]);
      return;
    }
    const { data, error } = await (supabase
      .from("cart_items") as any)
      .select("*")
      .eq("user_id", uid)
      .eq("mode", "mayorista")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("socios cart fetch failed", error);
      return;
    }
    setItems(
      (data || []).map((row: any) => ({
        id: row.id,
        external_sku: row.external_sku ?? "",
        product_name: row.product_name,
        flavor: row.flavor,
        quantity: row.quantity,
        price_per_unit: Number(row.price_per_unit),
        product_image: row.product_image,
      })),
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async (uid: string | null) => {
      if (!mounted) return;
      setLoading(true);
      await fetchItems(uid);
      if (mounted) setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      if (mounted) setUserId(uid);
      void load(uid);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      // Supabase emite SIGNED_IN / TOKEN_REFRESHED en cada focus de pestaña:
      // si el usuario no cambió, no hace falta recargar (evita parpadeos y
      // no pisa el estado optimista con datos viejos).
      if (uid === userIdRef.current) return;
      if (mounted) setUserId(uid);
      void load(uid);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchItems]);

  const refresh = useCallback(async () => {
    await fetchItems(userIdRef.current);
  }, [fetchItems]);

  const failSync = useCallback(
    async (msg: string) => {
      toast.error(msg);
      await fetchItems(userIdRef.current);
    },
    [fetchItems],
  );

  // Persiste (debounced) la última cantidad deseada de una línea.
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
              ? await (supabase.from("cart_items") as any).delete().eq("id", realId)
              : await (supabase.from("cart_items") as any)
                  .update({ quantity: Math.min(qty, MAX_QTY) })
                  .eq("id", realId);
          if (error) {
            console.error("socios cart write failed", error);
            await failSync("No se pudo actualizar el carrito");
            return;
          }
          // Si nadie pidió otra cantidad mientras escribíamos, limpiamos el intent
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

  // Cambia la cantidad al instante en la UI; el servidor se entera después.
  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      const q = Math.min(Math.max(quantity, 0), MAX_QTY);
      pendingQty.current.set(id, q);
      setItems((prev) =>
        q <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, quantity: q } : i)),
      );
      scheduleWrite(id);
    },
    [scheduleWrite],
  );

  const removeItem = useCallback(
    (id: string) => {
      setQuantity(id, 0);
    },
    [setQuantity],
  );

  const addItem = useCallback(
    async (input: {
      external_sku: string;
      product_name: string;
      flavor: string | null;
      price_per_unit: number;
      product_image: string | null;
      quantity?: number;
    }) => {
      const uid = userIdRef.current;
      if (!uid) {
        toast.error("Iniciá sesión para agregar productos");
        return;
      }
      const qty = Math.max(1, input.quantity ?? 1);

      // Si la línea ya existe localmente, es un incremento
      const existingLocal = itemsRef.current.find(
        (i) => i.external_sku === input.external_sku,
      );
      if (existingLocal) {
        setQuantity(existingLocal.id, existingLocal.quantity + qty);
        return;
      }

      // Optimista: la línea aparece ya mismo con un id temporal
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [
        ...prev,
        {
          id: tempId,
          external_sku: input.external_sku,
          product_name: input.product_name,
          flavor: input.flavor,
          quantity: qty,
          price_per_unit: input.price_per_unit,
          product_image: input.product_image,
        },
      ]);

      // Persistencia en segundo plano
      try {
        // ¿Ya había una fila en el servidor (otra sesión / otro dispositivo)?
        const { data: existing, error: selErr } = await (supabase
          .from("cart_items") as any)
          .select("id, quantity")
          .eq("user_id", uid)
          .eq("mode", "mayorista")
          .eq("external_sku", input.external_sku)
          .maybeSingle();
        if (selErr) throw selErr;

        if (existing) {
          tempIdMap.current.set(tempId, existing.id);
          setItems((prev) =>
            prev.map((i) => (i.id === tempId ? { ...i, id: existing.id } : i)),
          );
          const finalQty = pendingQty.current.get(tempId) ?? qty;
          const { error } = await (supabase.from("cart_items") as any)
            .update({
              quantity: Math.min(finalQty, MAX_QTY),
              price_per_unit: input.price_per_unit,
            })
            .eq("id", existing.id);
          if (error) throw error;
          if (
            pendingQty.current.get(tempId) === finalQty &&
            !writeTimers.current.has(tempId)
          ) {
            pendingQty.current.delete(tempId);
          }
        } else {
          const insertQty = pendingQty.current.get(tempId) ?? qty;
          const { data: created, error } = await (supabase
            .from("cart_items") as any)
            .insert({
              user_id: uid,
              mode: "mayorista",
              external_sku: input.external_sku,
              product_name: input.product_name,
              flavor: input.flavor,
              quantity: Math.min(insertQty, MAX_QTY),
              price_per_unit: input.price_per_unit,
              product_image: input.product_image,
            })
            .select("id")
            .single();
          if (error || !created) throw error ?? new Error("insert failed");
          tempIdMap.current.set(tempId, created.id);
          setItems((prev) =>
            prev.map((i) => (i.id === tempId ? { ...i, id: created.id } : i)),
          );
          if (
            pendingQty.current.get(tempId) === insertQty &&
            !writeTimers.current.has(tempId)
          ) {
            pendingQty.current.delete(tempId);
          }
        }
      } catch (e) {
        console.error("socios cart add failed", e);
        await failSync("No se pudo agregar el producto");
      }
    },
    [setQuantity, failSync],
  );

  const clear = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    for (const t of writeTimers.current.values()) clearTimeout(t);
    writeTimers.current.clear();
    pendingQty.current.clear();
    setItems([]);
    const { error } = await (supabase.from("cart_items") as any)
      .delete()
      .eq("user_id", uid)
      .eq("mode", "mayorista");
    if (error) {
      console.error("socios cart clear failed", error);
      await failSync("No se pudo vaciar el carrito");
    }
  }, [failSync]);

  const subtotal = items.reduce((s, i) => s + i.price_per_unit * i.quantity, 0);
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  // Helper to get quantity of a (product_id, flavor) combo currently in cart
  const getLineQuantity = useCallback(
    (sku: string): number => {
      const line = items.find((i) => i.external_sku === sku);
      return line?.quantity ?? 0;
    },
    [items],
  );

  const findLine = useCallback(
    (sku: string): SociosCartItem | undefined =>
      items.find((i) => i.external_sku === sku),
    [items],
  );

  return {
    items,
    loading,
    userId,
    subtotal,
    totalUnits,
    addItem,
    setQuantity,
    removeItem,
    clear,
    refresh,
    getLineQuantity,
    findLine,
  };
};
