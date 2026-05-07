import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { syncWaitingListOrder } from "@/services/orderService";
import { useCartItems } from "@/hooks/useCartItems";
import { useWaitingListItems } from "@/hooks/useWaitingListItems";

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
  syncPendingOrderPrices: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SESSION_ID_KEY = 'ola_session_id';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getSessionId = useCallback((): string => {
    let storedSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, storedSessionId);
    }
    return storedSessionId;
  }, []);

  const {
    cartItems, setCartItems, fetchCartItems,
    addToCart, updateCartItemQuantity, updateCartItemFlavor,
    removeFromCart, clearCart,
  } = useCartItems(currentUserId, getSessionId);

  const {
    waitingListItems, setWaitingListItems, fetchWaitingListItems,
    addToWaitingList, updateWaitingListItemQuantity: rawUpdateWLQuantity,
    updateWaitingListItemFlavor, removeFromWaitingList, clearWaitingList,
  } = useWaitingListItems(currentUserId, getSessionId);

  // Wrap updateWaitingListItemQuantity to inject current items
  const updateWaitingListItemQuantity = useCallback(
    (id: string, quantity: number) => rawUpdateWLQuantity(id, quantity, waitingListItems),
    [rawUpdateWLQuantity, waitingListItems]
  );

  // Refresh all data
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    const [cart, waiting] = await Promise.all([
      fetchCartItems(currentUserId),
      fetchWaitingListItems(currentUserId)
    ]);
    setCartItems(cart);
    setWaitingListItems(waiting);
    setIsLoading(false);
  }, [currentUserId, fetchCartItems, fetchWaitingListItems, setCartItems, setWaitingListItems]);

  const migrateGuestCart = async (newUserId: string) => {
    void newUserId;
    return;
  };

  // Listen to auth changes
  useEffect(() => {
    let mounted = true;

    const loadData = async (userId: string | null) => {
      if (!mounted) return;
      setIsLoading(true);
      try {
        const [cart, waiting] = await Promise.all([
          fetchCartItems(userId),
          fetchWaitingListItems(userId),
        ]);

        if (!mounted) return;
        setCartItems(cart);
        setWaitingListItems(waiting);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const handleAuthChange = async (event: string, userId: string | null) => {
      if (event === "SIGNED_IN" && userId) {
        await migrateGuestCart(userId);
      }
      await loadData(userId);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;
      if (mounted) setCurrentUserId(newUserId);

      setTimeout(() => {
        void handleAuthChange(event, newUserId).catch((err) => {
          console.error("Auth change handling failed:", err);
        });
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id ?? null;
      if (mounted) setCurrentUserId(userId);

      setTimeout(() => {
        void handleAuthChange("INITIAL_SESSION", userId).catch((err) => {
          console.error("Initial session load failed:", err);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getSessionId, fetchCartItems, fetchWaitingListItems, setCartItems, setWaitingListItems]);
  // Move waiting list items to cart
  const moveWaitingListToCart = async () => {
    try {
      // Fetch buy-now (tier 1) prices for all products in the waiting list
      // so items move to cart at the "Comprar ahora" price, not at the
      // collective tier price they have currently reached.
      const productIds = [...new Set(waitingListItems.map(i => i.product_id))];
      const buyNowPriceMap = new Map<string, number>();
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, prices')
          .in('id', productIds);
        products?.forEach((p) => {
          const tiers = (p.prices as unknown as Array<{ people: number; price: number }>) || [];
          if (tiers.length > 1) {
            buyNowPriceMap.set(p.id, tiers[1].price);
          } else if (tiers.length === 1) {
            buyNowPriceMap.set(p.id, tiers[0].price);
          }
        });
      }

      for (const item of waitingListItems) {
        const buyNowPrice = buyNowPriceMap.get(item.product_id) ?? item.current_price_per_unit;
        await addToCart({
          product_id: item.product_id,
          product_name: item.product_name,
          flavor: item.flavor,
          quantity: item.quantity,
          price_per_unit: buyNowPrice,
          product_image: item.product_image,
        });
      }

      toast.success('Productos movidos al carrito');
    } catch (error) {
      console.error('Error moving to cart:', error);
      toast.error('Error al mover productos');
    }
  };

  const cartCount = cartItems.length;
  const waitingListCount = waitingListItems.length;

  const syncPendingOrderPrices = useCallback(async () => {
    let userId = currentUserId;

    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }

    if (!userId) return;

    await syncWaitingListOrder(userId);
    const waiting = await fetchWaitingListItems(userId);
    setWaitingListItems(waiting);
  }, [currentUserId, fetchWaitingListItems, setWaitingListItems]);

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
        syncPendingOrderPrices,
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
