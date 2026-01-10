import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
}

export interface WaitingListItem {
  id: string;
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  current_price_per_unit: number;
  product_image: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  waitingListItems: WaitingListItem[];
  cartCount: number;
  waitingListCount: number;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  addToWaitingList: (item: Omit<WaitingListItem, 'id'>) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  updateWaitingListItemQuantity: (id: string, quantity: number) => Promise<void>;
  updateCartItemFlavor: (id: string, flavor: string) => Promise<void>;
  updateWaitingListItemFlavor: (id: string, flavor: string) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  removeFromWaitingList: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearWaitingList: () => Promise<void>;
  moveWaitingListToCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getSessionId: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SESSION_ID_KEY = 'ola_session_id';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [waitingListItems, setWaitingListItems] = useState<WaitingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Get or create session ID for guest users
  const getSessionId = useCallback(() => {
    if (sessionId) return sessionId;
    
    let storedSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, storedSessionId);
    }
    setSessionId(storedSessionId);
    return storedSessionId;
  }, [sessionId]);

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let query = supabase.from('cart_items').select('*');
      
      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      } else {
        const sid = getSessionId();
        query = query.eq('session_id', sid);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setCartItems(data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: Number(item.price_per_unit),
        product_image: item.product_image,
      })) || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }, [getSessionId]);

  // Fetch waiting list items
  const fetchWaitingListItems = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let query = supabase.from('waiting_list_items').select('*');
      
      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      } else {
        const sid = getSessionId();
        query = query.eq('session_id', sid);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setWaitingListItems(data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        current_price_per_unit: Number(item.current_price_per_unit),
        product_image: item.product_image,
      })) || []);
    } catch (error) {
      console.error('Error fetching waiting list:', error);
    }
  }, [getSessionId]);

  // Refresh all data
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCartItems(), fetchWaitingListItems()]);
    setIsLoading(false);
  }, [fetchCartItems, fetchWaitingListItems]);

  // Listen to auth changes and merge guest cart
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;
      
      if (event === 'SIGNED_IN' && newUserId && !userId) {
        // User just logged in - migrate guest cart to user cart
        const guestSessionId = localStorage.getItem(SESSION_ID_KEY);
        if (guestSessionId) {
          try {
            // Migrate cart items
            await supabase
              .from('cart_items')
              .update({ user_id: newUserId, session_id: null })
              .eq('session_id', guestSessionId);
            
            // Migrate waiting list items  
            await supabase
              .from('waiting_list_items')
              .update({ user_id: newUserId, session_id: null })
              .eq('session_id', guestSessionId);
          } catch (error) {
            console.error('Error migrating guest cart:', error);
          }
        }
      }
      
      setUserId(newUserId);
      await refreshCart();
    });

    // Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      refreshCart();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Add to cart
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
      };
      
      if (session?.user) {
        insertData.user_id = session.user.id;
      } else {
        insertData.session_id = getSessionId();
      }
      
      // Check if same product+flavor exists
      let existingQuery = supabase
        .from('cart_items')
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
        // Update quantity
        const newQty = Math.min(existing.quantity + item.quantity, 99);
        await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert(insertData);
      }
      
      await fetchCartItems();
      toast.success('Producto agregado al carrito');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  // Add to waiting list
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
        await supabase
          .from('waiting_list_items')
          .update({ quantity: newQty, current_price_per_unit: item.current_price_per_unit })
          .eq('id', existing.id);
      } else {
        await supabase.from('waiting_list_items').insert(insertData);
      }
      
      await fetchWaitingListItems();
      toast.success('Producto agregado a la lista de espera');
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      toast.error('Error al agregar a la lista de espera');
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity < 1 || quantity > 99) return;
      
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);
      
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Error al actualizar cantidad');
    }
  };

  // Update waiting list item quantity
  const updateWaitingListItemQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity < 1 || quantity > 99) return;
      
      await supabase
        .from('waiting_list_items')
        .update({ quantity })
        .eq('id', id);
      
      await fetchWaitingListItems();
    } catch (error) {
      console.error('Error updating waiting list item:', error);
      toast.error('Error al actualizar cantidad');
    }
  };

  // Update cart item flavor
  const updateCartItemFlavor = async (id: string, flavor: string) => {
    try {
      await supabase
        .from('cart_items')
        .update({ flavor })
        .eq('id', id);
      
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating cart item flavor:', error);
      toast.error('Error al actualizar sabor');
    }
  };

  // Update waiting list item flavor
  const updateWaitingListItemFlavor = async (id: string, flavor: string) => {
    try {
      await supabase
        .from('waiting_list_items')
        .update({ flavor })
        .eq('id', id);
      
      await fetchWaitingListItems();
    } catch (error) {
      console.error('Error updating waiting list item flavor:', error);
      toast.error('Error al actualizar sabor');
    }
  };

  // Remove from cart
  const removeFromCart = async (id: string) => {
    try {
      await supabase.from('cart_items').delete().eq('id', id);
      await fetchCartItems();
      toast.success('Producto eliminado del carrito');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Error al eliminar del carrito');
    }
  };

  // Remove from waiting list
  const removeFromWaitingList = async (id: string) => {
    try {
      await supabase.from('waiting_list_items').delete().eq('id', id);
      await fetchWaitingListItems();
      toast.success('Producto eliminado de la lista de espera');
    } catch (error) {
      console.error('Error removing from waiting list:', error);
      toast.error('Error al eliminar de la lista');
    }
  };

  // Clear cart
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

  // Clear waiting list
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

  // Move waiting list items to cart
  const moveWaitingListToCart = async () => {
    try {
      for (const item of waitingListItems) {
        await addToCart({
          product_id: item.product_id,
          product_name: item.product_name,
          flavor: item.flavor,
          quantity: item.quantity,
          price_per_unit: item.current_price_per_unit,
          product_image: item.product_image,
        });
      }
      toast.success('Productos movidos al carrito');
    } catch (error) {
      console.error('Error moving to cart:', error);
      toast.error('Error al mover productos');
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const waitingListCount = waitingListItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        waitingListItems,
        cartCount,
        waitingListCount,
        isLoading,
        addToCart,
        addToWaitingList,
        updateCartItemQuantity,
        updateWaitingListItemQuantity,
        updateCartItemFlavor,
        updateWaitingListItemFlavor,
        removeFromCart,
        removeFromWaitingList,
        clearCart,
        clearWaitingList,
        moveWaitingListToCart,
        refreshCart,
        getSessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
