import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CartItem } from "@/contexts/CartContext";

export const useCartItems = (
  currentUserId: string | null,
  getSessionId: () => string
) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const insertData: any = {
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
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

      // Check if same product+flavor exists
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

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, 99);
        await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert(insertData);
      }

      const cart = await fetchCartItems(session?.user?.id || null);
      setCartItems(cart);
      toast.success('Producto agregado al carrito');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  const updateCartItemQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity < 1 || quantity > 99) return;

      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);

      const cart = await fetchCartItems(currentUserId);
      setCartItems(cart);
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Error al actualizar cantidad');
    }
  };

  const updateCartItemFlavor = async (id: string, flavor: string) => {
    try {
      await supabase
        .from('cart_items')
        .update({ flavor })
        .eq('id', id);

      const cart = await fetchCartItems(currentUserId);
      setCartItems(cart);
    } catch (error) {
      console.error('Error updating cart item flavor:', error);
      toast.error('Error al actualizar sabor');
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      await supabase.from('cart_items').delete().eq('id', id);
      const cart = await fetchCartItems(currentUserId);
      setCartItems(cart);
      toast.success('Producto eliminado del carrito');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Error al eliminar del carrito');
    }
  };

  const clearCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      let query = supabase.from('cart_items').delete();

      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      await query;
      setCartItems([]);
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
