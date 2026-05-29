import { useCallback, useEffect, useState } from "react";
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

export const useSociosCart = () => {
  const [items, setItems] = useState<SociosCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
      if (mounted) setUserId(uid);
      void load(uid);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchItems]);

  const refresh = useCallback(async () => {
    await fetchItems(userId);
  }, [fetchItems, userId]);

  const addItem = useCallback(
    async (input: {
      external_sku: string;
      product_name: string;
      flavor: string | null;
      price_per_unit: number;
      product_image: string | null;
      quantity?: number;
    }) => {
      if (!userId) {
        toast.error("Iniciá sesión para agregar productos");
        return;
      }
      const qty = Math.max(1, input.quantity ?? 1);
      const existingQ: any = (supabase.from("cart_items") as any)
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("mode", "mayorista")
        .eq("external_sku", input.external_sku);
      const { data: existing } = await existingQ.maybeSingle();

      if (existing) {
        const newQty = Math.min(existing.quantity + qty, 999);
        await (supabase.from("cart_items") as any)
          .update({ quantity: newQty, price_per_unit: input.price_per_unit })
          .eq("id", existing.id);
      } else {
        await (supabase.from("cart_items") as any).insert({
          user_id: userId,
          mode: "mayorista",
          external_sku: input.external_sku,
          product_name: input.product_name,
          flavor: input.flavor,
          quantity: qty,
          price_per_unit: input.price_per_unit,
          product_image: input.product_image,
        });
      }
      await fetchItems(userId);
    },
    [fetchItems, userId],
  );

  const setQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity <= 0) {
        await (supabase.from("cart_items") as any).delete().eq("id", id);
      } else {
        await (supabase.from("cart_items") as any)
          .update({ quantity: Math.min(quantity, 999) })
          .eq("id", id);
      }
      await fetchItems(userId);
    },
    [fetchItems, userId],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await (supabase.from("cart_items") as any).delete().eq("id", id);
      await fetchItems(userId);
    },
    [fetchItems, userId],
  );

  const clear = useCallback(async () => {
    if (!userId) return;
    await (supabase.from("cart_items") as any)
      .delete()
      .eq("user_id", userId)
      .eq("mode", "mayorista");
    setItems([]);
  }, [userId]);

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