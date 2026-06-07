import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  product_link?: string | null;
}

export interface WaitingListItem {
  id: string;
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  current_price_per_unit: number;
  product_image: string | null;
  brand_slug?: string | null;
  retail_price_per_unit?: number | null;
  guaranteed_price_per_unit?: number | null;
  super_price_per_unit?: number | null;
  product_link?: string | null;
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

// localStorage-кэш корзины и листа ожидания: мгновенные цифры на иконках и
// контент страниц при перезагрузке (фоновый фетч потом заменяет данные).
// Ключ привязан к владельцу (uid или session id) — чужой кэш не показываем.
const CART_CACHE_PREFIX = 'ola:cart:v1:';
const WAITING_CACHE_PREFIX = 'ola:waiting:v1:';

const readOwnerCache = <T,>(key: string): T[] | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? (parsed.items as T[]) : null;
  } catch {
    return null;
  }
};

const writeOwnerCache = (key: string, items: Array<{ id: string }>) => {
  try {
    // tmp-строки (insert ещё в полёте) в кэш не пишем: после перезагрузки
    // их id бессмысленны
    localStorage.setItem(
      key,
      JSON.stringify({ at: Date.now(), items: items.filter((i) => !String(i.id).startsWith('tmp-')) }),
    );
  } catch { /* quota — ignorar */ }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Ключ владельца, для которого реально загружены данные: кэш пишем только
  // под него (страхует от записи гостевых строк в кэш юзера при логине)
  const loadedOwnerKeyRef = React.useRef<string | null>(null);
  const navigate = useNavigate();

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

  // Кэш владельца обновляется при каждом изменении (optimistic-операции тоже)
  useEffect(() => {
    const ownerKey = loadedOwnerKeyRef.current;
    if (ownerKey) writeOwnerCache(CART_CACHE_PREFIX + ownerKey, cartItems);
  }, [cartItems]);

  useEffect(() => {
    const ownerKey = loadedOwnerKeyRef.current;
    if (ownerKey) writeOwnerCache(WAITING_CACHE_PREFIX + ownerKey, waitingListItems);
  }, [waitingListItems]);

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

  // Captura silenciosa de contrasena para usuarios migrados (sin password
  // tras la migracion de BD): si la sesion tiene user_metadata.password_set
  // === false lo enviamos a /establecer-clave. Punto central que cubre todos
  // los metodos de login (password / magic-link / Google) via onAuthStateChange
  // y la carga inicial de pagina via getSession. Solo dispara con === false
  // (undefined de usuarios nuevos y true de los ya confirmados no se tocan).
  useEffect(() => {
    const gate = (session: import("@supabase/supabase-js").Session | null) => {
      if (
        session?.user?.user_metadata?.password_set === false &&
        window.location.pathname !== "/establecer-clave"
      ) {
        navigate("/establecer-clave");
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => gate(session));
    supabase.auth.getSession().then(({ data: { session } }) => gate(session));
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Listen to auth changes
  useEffect(() => {
    let mounted = true;
    // Supabase emite SIGNED_IN / TOKEN_REFRESHED en cada focus de pestaña y
    // duplica INITIAL_SESSION+SIGNED_IN al arrancar: cargamos solo cuando el
    // usuario realmente cambió (evita refetches que pisan el estado optimista).
    let lastLoadedKey: string | undefined;

    const loadData = async (userId: string | null) => {
      if (!mounted) return;
      const ownerKey = userId ?? `s:${getSessionId()}`;
      // Мгновенный рендер из кэша владельца; сервер ревалидирует в фоне
      const cachedCart = readOwnerCache<CartItem>(CART_CACHE_PREFIX + ownerKey);
      const cachedWaiting = readOwnerCache<WaitingListItem>(WAITING_CACHE_PREFIX + ownerKey);
      if (cachedCart) setCartItems(cachedCart);
      if (cachedWaiting) setWaitingListItems(cachedWaiting);
      const hasCache = !!(cachedCart || cachedWaiting);
      if (!hasCache) setIsLoading(true);
      else setIsLoading(false);
      try {
        const [cart, waiting] = await Promise.all([
          fetchCartItems(userId),
          fetchWaitingListItems(userId),
        ]);

        if (!mounted) return;
        setCartItems(cart);
        setWaitingListItems(waiting);
        writeOwnerCache(CART_CACHE_PREFIX + ownerKey, cart);
        writeOwnerCache(WAITING_CACHE_PREFIX + ownerKey, waiting);
        loadedOwnerKeyRef.current = ownerKey;
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const handleAuthChange = async (event: string, userId: string | null) => {
      const key = userId ?? "guest";
      if (key === lastLoadedKey) return;
      lastLoadedKey = key;
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
      // Цена строки при переносе — сохранённая текущая; корзина и чекаут всё равно
      // пересчитывают «Comprar ahora» (t1) из каталога (useCheckoutPricing.getUnitPrice),
      // так что легаси-тиры из таблицы products здесь больше не читаем.
      for (const item of waitingListItems) {
        const buyNowPrice = item.current_price_per_unit;
        await addToCart({
          product_id: item.product_id,
          product_name: item.product_name,
          flavor: item.flavor,
          quantity: item.quantity,
          price_per_unit: buyNowPrice,
          product_image: item.product_image,
          product_link: item.product_link,
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
