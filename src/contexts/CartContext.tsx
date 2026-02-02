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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get or create session ID for guest users - stable function
  const getSessionId = useCallback((): string => {
    let storedSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, storedSessionId);
    }
    return storedSessionId;
  }, []);

  // Fetch cart items - uses passed userId or sessionId
  const fetchCartItemsInternal = async (userId: string | null): Promise<CartItem[]> => {
    try {
      let query = supabase.from('cart_items').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        const sid = getSessionId();
        query = query.eq('session_id', sid);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: Number(item.price_per_unit),
        product_image: item.product_image,
      }));
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [];
    }
  };

  // Fetch waiting list items - uses passed userId or sessionId
  const fetchWaitingListItemsInternal = async (userId: string | null): Promise<WaitingListItem[]> => {
    try {
      let query = supabase.from('waiting_list_items').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        const sid = getSessionId();
        query = query.eq('session_id', sid);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        current_price_per_unit: Number(item.current_price_per_unit),
        product_image: item.product_image,
      }));
    } catch (error) {
      console.error('Error fetching waiting list:', error);
      return [];
    }
  };

  // Refresh all data
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    const [cart, waiting] = await Promise.all([
      fetchCartItemsInternal(currentUserId),
      fetchWaitingListItemsInternal(currentUserId)
    ]);
    setCartItems(cart);
    setWaitingListItems(waiting);
    setIsLoading(false);
  }, [currentUserId, getSessionId]);

  // Migrate guest cart to user cart - IMPORTANT: Must be done before fetching user items
  const migrateGuestCart = async (newUserId: string) => {
    // Disabled by request: no guest cart migration on auth.
    void newUserId;
    return;
  };

  const formatPrice = (price: number) => `$${Math.round(price).toLocaleString('es-AR')}`;

  const computeNextSundayCloseIso = (): string => {
    const now = new Date();
    const nextSunday = new Date(now);
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (currentDay === 0) {
      // It's Sunday
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour < 23 || (currentHour === 23 && currentMinute < 59)) {
        // Before 23:59 - target is today at 23:59
        nextSunday.setHours(23, 59, 59, 999);
      } else {
        // After 23:59 - target is next Sunday
        nextSunday.setDate(now.getDate() + 7);
        nextSunday.setHours(23, 59, 59, 999);
      }
    } else {
      // Not Sunday - calculate days until next Sunday
      const daysUntilSunday = 7 - currentDay;
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(23, 59, 59, 999);
    }
    return nextSunday.toISOString();
  };

  const ensurePendingCollectiveOrder = async (userId: string) => {
    // If order already exists, sync items only.
    const { data: existingOrder } = await supabase
      .from("user_orders")
      .select("id, order_number")
      .eq("user_id", userId)
      .eq("order_type", "collective")
      .eq("status", "pending")
      .maybeSingle();

    if (existingOrder) {
      await syncWaitingListOrder(userId);
      return;
    }

    // Create new pending order from current waiting list items
    const { data: waitingListData } = await supabase
      .from("waiting_list_items")
      .select("*")
      .eq("user_id", userId);

    if (!waitingListData || waitingListData.length === 0) return;

    // Get product prices for full price calculation
    const productIds = [...new Set(waitingListData.map(i => i.product_id))];
    const { data: productsData } = await supabase
      .from("products")
      .select("id, prices")
      .in("id", productIds);

    const productPricesMap = new Map<string, any[]>();
    productsData?.forEach(p => {
      productPricesMap.set(p.id, (p.prices as any[]) || []);
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, address")
      .eq("user_id", userId)
      .maybeSingle();

    const customerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Cliente";
    const phone = profile?.phone || "";

    // delivery_address expects jsonb; keep null if not available or not parseable
    let deliveryAddress: any = null;
    if (profile?.address) {
      try {
        deliveryAddress = JSON.parse(profile.address);
      } catch {
        deliveryAddress = null;
      }
    }

    const orderItems = waitingListData.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      flavor: item.flavor,
      quantity: item.quantity,
      price_per_unit: item.current_price_per_unit,
      product_image: item.product_image,
    }));

    // Calculate subtotal (current tiered prices)
    const subtotal = waitingListData.reduce(
      (sum, item) => sum + Number(item.current_price_per_unit) * item.quantity,
      0
    );

    // Calculate full price (first tier = highest price) for discount
    let fullPrice = 0;
    waitingListData.forEach(item => {
      const prices = productPricesMap.get(item.product_id);
      if (prices && prices.length > 0) {
        // Sort by people ascending, first tier is the highest price
        const sortedPrices = [...prices].sort((a, b) => (a.people || 0) - (b.people || 0));
        const firstTierPrice = sortedPrices[0]?.price || item.current_price_per_unit;
        fullPrice += firstTierPrice * item.quantity;
      } else {
        fullPrice += Number(item.current_price_per_unit) * item.quantity;
      }
    });

    // Discount = full price - current subtotal
    const discountAmount = fullPrice - subtotal;

    const orderNumber = `OLA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const { data: newOrder, error: insertError } = await supabase
      .from("user_orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        order_type: "collective",
        items: orderItems,
        subtotal,
        total_amount: subtotal,
        discount_amount: discountAmount,
        delivery_address: deliveryAddress,
        status: "pending",
        collective_close_date: computeNextSundayCloseIso(),
        notes: phone || null,
      })
      .select("id, order_number")
      .single();

    if (insertError) throw insertError;

    // Notify only for NEW orders
    const orderUrl = `${window.location.origin}/mi-cuenta/pedidos/${newOrder.id}`;
    await supabase.functions.invoke("notify-telegram", {
      body: {
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        order_type: "Compra Colectiva",
        customer_name: customerName,
        phone,
        total: formatPrice(subtotal),
        order_url: orderUrl,
        waiting_for_discount: true,
      },
    });
  };

  // Listen to auth changes (IMPORTANT: keep callback synchronous to avoid auth deadlocks)
  useEffect(() => {
    let mounted = true;

    const loadData = async (userId: string | null) => {
      if (!mounted) return;
      setIsLoading(true);
      try {
        const [cart, waiting] = await Promise.all([
          fetchCartItemsInternal(userId),
          fetchWaitingListItemsInternal(userId),
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

      // Defer any Supabase calls outside the auth callback
      setTimeout(() => {
        void handleAuthChange(event, newUserId).catch((err) => {
          console.error("Auth change handling failed:", err);
        });
      }, 0);
    });

    // Initial load (after listener is attached)
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
  }, [getSessionId]);

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
      
      // Refresh cart data
      const cart = await fetchCartItemsInternal(session?.user?.id || null);
      setCartItems(cart);
      toast.success('Producto agregado al carrito');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  // Sync waiting list with pending collective order
  const syncWaitingListOrder = async (userId: string) => {
    try {
      // Fetch current waiting list items
      const { data: waitingListData } = await supabase
        .from("waiting_list_items")
        .select("*")
        .eq("user_id", userId);

      // Check if pending collective order exists
      const { data: existingOrder } = await supabase
        .from("user_orders")
        .select("id")
        .eq("user_id", userId)
        .eq("order_type", "collective")
        .eq("status", "pending")
        .maybeSingle();

      if (!existingOrder) {
        // No order yet - nothing to sync
        return;
      }

      if (!waitingListData || waitingListData.length === 0) {
        // No items left - delete the order
        await supabase
          .from("user_orders")
          .delete()
          .eq("id", existingOrder.id);
        return;
      }

      // Get product prices for full price calculation
      const productIds = [...new Set(waitingListData.map(i => i.product_id))];
      const { data: productsData } = await supabase
        .from("products")
        .select("id, prices")
        .in("id", productIds);

      const productPricesMap = new Map<string, any[]>();
      productsData?.forEach(p => {
        productPricesMap.set(p.id, (p.prices as any[]) || []);
      });

      // Prepare order items
      const orderItems = waitingListData.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: item.current_price_per_unit,
        product_image: item.product_image,
      }));

      // Calculate subtotal (current tiered prices)
      const subtotal = waitingListData.reduce(
        (sum, item) => sum + Number(item.current_price_per_unit) * item.quantity,
        0
      );

      // Calculate full price (first tier = highest price) for discount
      let fullPrice = 0;
      waitingListData.forEach(item => {
        const prices = productPricesMap.get(item.product_id);
        if (prices && prices.length > 0) {
          // Sort by people ascending, first tier is the highest price
          const sortedPrices = [...prices].sort((a, b) => (a.people || 0) - (b.people || 0));
          const firstTierPrice = sortedPrices[0]?.price || item.current_price_per_unit;
          fullPrice += firstTierPrice * item.quantity;
        } else {
          fullPrice += Number(item.current_price_per_unit) * item.quantity;
        }
      });

      // Discount = full price - current subtotal
      const discountAmount = fullPrice - subtotal;

      // Update existing order
      await supabase
        .from("user_orders")
        .update({
          items: orderItems,
          subtotal,
          total_amount: subtotal,
          discount_amount: discountAmount,
          collective_close_date: computeNextSundayCloseIso(),
        })
        .eq("id", existingOrder.id);
    } catch (error) {
      console.error("Error syncing waiting list order:", error);
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
      
      
      const waiting = await fetchWaitingListItemsInternal(session?.user?.id || null);
      setWaitingListItems(waiting);
      
      // For authenticated users: ensure pending collective order exists (and sync items)
      if (session?.user) {
        await ensurePendingCollectiveOrder(session.user.id);
      }
      
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
      
      const cart = await fetchCartItemsInternal(currentUserId);
      setCartItems(cart);
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Error al actualizar cantidad');
    }
  };

  // Update waiting list item quantity with price recalculation based on tiers
  // IMPORTANT: Only sync to DB counters if user already has a pending order
  // Before order creation, changes are LOCAL ONLY (personal preview)
  const updateWaitingListItemQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity < 1 || quantity > 99) return;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      // Get the item to find product_id
      const item = waitingListItems.find(i => i.id === id);
      if (!item) return;

      // Optimistic local update first for responsiveness
      setWaitingListItems(prev => 
        prev.map(i => i.id === id ? { ...i, quantity } : i)
      );

      // Update quantity in DB
      await supabase.from("waiting_list_items").update({ quantity }).eq("id", id);

      // Check for existing order + get product data in parallel
      const [orderResult, productResult, userItemsResult] = await Promise.all([
        userId 
          ? supabase
              .from("user_orders")
              .select("id")
              .eq("user_id", userId)
              .eq("order_type", "collective")
              .eq("status", "pending")
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("products")
          .select("prices, total_orders_count")
          .eq("id", item.product_id)
          .maybeSingle(),
        userId 
          ? supabase
              .from("waiting_list_items")
              .select("quantity")
              .eq("user_id", userId)
              .eq("product_id", item.product_id)
          : Promise.resolve({ data: null })
      ]);

      const hasExistingOrder = !!orderResult.data;
      const product = productResult.data;
      const userTotalQty = (userItemsResult.data || []).reduce(
        (sum, i) => sum + (i.quantity || 0), 0
      );

      // Calculate effective participants for price tier
      const baseParticipants = Number(product?.total_orders_count ?? 0);
      const effectiveParticipants = hasExistingOrder 
        ? baseParticipants 
        : baseParticipants + userTotalQty;

      // Calculate new price from tiers
      let newPrice: number | null = null;
      if (product?.prices && Array.isArray(product.prices)) {
        const normalized = (product.prices as any[])
          .map((p) => ({
            people: Number((p as any)?.people),
            price: Number((p as any)?.price),
          }))
          .filter((p) => Number.isFinite(p.people) && Number.isFinite(p.price))
          .sort((a, b) => a.people - b.people);

        if (normalized.length > 0) {
          newPrice = normalized[0].price;
          for (let i = normalized.length - 1; i >= 0; i--) {
            if (effectiveParticipants >= normalized[i].people) {
              newPrice = normalized[i].price;
              break;
            }
          }
        }
      }

      // Update price + sync order (if needed)
      if (newPrice !== null) {
        await supabase
          .from("waiting_list_items")
          .update({ current_price_per_unit: newPrice })
          .eq("id", id);
        // Update local state with new price
        setWaitingListItems(prev => 
          prev.map(i => i.id === id ? { ...i, current_price_per_unit: newPrice! } : i)
        );
      }

      if (userId && hasExistingOrder) {
        await syncWaitingListOrder(userId);
      }

    } catch (error) {
      console.error("Error updating waiting list item:", error);
      toast.error("Error al actualizar cantidad");
      // Refresh to restore correct state on error
      const waiting = await fetchWaitingListItemsInternal(currentUserId);
      setWaitingListItems(waiting);
    }
  };

  // Update cart item flavor
  const updateCartItemFlavor = async (id: string, flavor: string) => {
    try {
      await supabase
        .from('cart_items')
        .update({ flavor })
        .eq('id', id);
      
      const cart = await fetchCartItemsInternal(currentUserId);
      setCartItems(cart);
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
      
      const waiting = await fetchWaitingListItemsInternal(currentUserId);
      setWaitingListItems(waiting);
      
      // Sync order if user is authenticated
      if (currentUserId) {
        await syncWaitingListOrder(currentUserId);
      }
    } catch (error) {
      console.error('Error updating waiting list item flavor:', error);
      toast.error('Error al actualizar sabor');
    }
  };

  // Remove from cart
  const removeFromCart = async (id: string) => {
    try {
      await supabase.from('cart_items').delete().eq('id', id);
      const cart = await fetchCartItemsInternal(currentUserId);
      setCartItems(cart);
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
      
      const waiting = await fetchWaitingListItemsInternal(currentUserId);
      setWaitingListItems(waiting);
      
      // Sync order if user is authenticated
      if (currentUserId) {
        await syncWaitingListOrder(currentUserId);
      }
      
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

  // Move waiting list items to cart (copy items, don't clear waiting list)
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
      
      // Note: We do NOT clear waiting list or delete pending order here
      // That will happen when the cart order is finalized in checkout
      
      toast.success('Productos movidos al carrito');
    } catch (error) {
      console.error('Error moving to cart:', error);
      toast.error('Error al mover productos');
    }
  };

  // Show number of unique items (positions), not total quantities
  const cartCount = cartItems.length;
  const waitingListCount = waitingListItems.length;

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
