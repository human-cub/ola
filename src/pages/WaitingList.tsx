import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Timer, ArrowLeft, ArrowRight, ShoppingCart, Clock, Check, Share2, AlertTriangle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { WaitingListProductItem } from "@/components/WaitingListProductItem";

interface PriceData {
  people: number;
  price: number;
}

interface ProductData {
  id: string;
  link: string;
  total_orders_count: number;
  prices: PriceData[];
}

const WaitingList = () => {
  const navigate = useNavigate();
  const {
    waitingListItems,
    waitingListCount,
    isLoading,
    updateWaitingListItemQuantity,
    updateWaitingListItemFlavor,
    removeFromWaitingList,
    clearWaitingList,
    moveWaitingListToCart,
  } = useCart();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [productFlavors, setProductFlavors] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [productData, setProductData] = useState<Record<string, ProductData>>({});
  const [isCollectionEnded, setIsCollectionEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationDeadline, setConfirmationDeadline] = useState<Date | null>(null);
  const [isMovingToCart, setIsMovingToCart] = useState(false);
  const [pendingOrderCreatedAt, setPendingOrderCreatedAt] = useState<Date | null>(null);
  const [frozenOrderData, setFrozenOrderData] = useState<{
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      price_per_unit: number;
      flavor: string | null;
      product_image: string | null;
      participants_count?: number; // per-product frozen count
    }>;
    subtotal: number;
    participants_count: number; // Frozen participant count from order (legacy/max)
  } | null>(null);

  // Check if user has pending collective order and get its creation date + profile status
  useEffect(() => {
    const checkExistingOrder = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasExistingOrder(false);
        setPendingOrderCreatedAt(null);
        setFrozenOrderData(null);
        setProfileCompleted(false);
        return;
      }

      // Fetch order and profile in parallel
      const [orderResult, profileResult] = await Promise.all([
        supabase
          .from("user_orders")
          .select("id, created_at, items, subtotal, participants_count")
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending")
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("profile_completed, first_name, phone")
          .eq("user_id", session.user.id)
          .maybeSingle()
      ]);

      const data = orderResult.data;
      const profile = profileResult.data;

      setHasExistingOrder(!!data);
      setPendingOrderCreatedAt(data ? new Date(data.created_at) : null);
      
      // Check if profile is truly completed (has name and phone)
      const isComplete = profile?.profile_completed === true && 
                         !!profile?.first_name?.trim() && 
                         !!profile?.phone?.trim();
      setProfileCompleted(isComplete);
      
      // If order exists, store frozen snapshot from the order itself
      // The order's participants_count and items.price_per_unit are frozen at cycle close
      if (data) {
        const items = data.items as any[];
        
        setFrozenOrderData({
          items,
          subtotal: data.subtotal || 0,
          participants_count: data.participants_count || 1,
        });
      } else {
        setFrozenOrderData(null);
      }
    };

    checkExistingOrder();
  }, [waitingListItems]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Countdown timer to Sunday 23:59 and check if collection ended
  // Collection is ONLY ended if there's a pending order that was created BEFORE the last Sunday close
  useEffect(() => {
    const getLastSundayClose = () => {
      const now = new Date();
      const lastSunday = new Date(now);
      const daysSinceSunday = now.getDay();
      
      if (daysSinceSunday === 0) {
        // It's Sunday - check if before or after 23:59
        if (now.getHours() < 23 || (now.getHours() === 23 && now.getMinutes() < 59)) {
          // Before close - last close was previous Sunday
          lastSunday.setDate(now.getDate() - 7);
        }
      } else {
        lastSunday.setDate(now.getDate() - daysSinceSunday);
      }
      lastSunday.setHours(23, 59, 59, 999);
      return lastSunday;
    };

    const getNextSunday = () => {
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
      return nextSunday;
    };

    const calculateTimeLeft = () => {
      const now = new Date();
      const lastClose = getLastSundayClose();
      const nextSunday = getNextSunday();
      
      // Calculate confirmation deadline (1 week after last close)
      const deadline = new Date(lastClose);
      deadline.setDate(deadline.getDate() + 7);
      setConfirmationDeadline(deadline);
      
      // Collection is ONLY ended if:
      // 1. There's a pending order that was created BEFORE the last Sunday close
      // 2. We're currently within the confirmation period (after last close, before deadline)
      const hasPendingOrderFromPreviousCycle = 
        pendingOrderCreatedAt && 
        pendingOrderCreatedAt < lastClose &&
        now > lastClose && 
        now < deadline;
      
      if (hasPendingOrderFromPreviousCycle) {
        setIsCollectionEnded(true);
        // Calculate time left until deadline
        const diff = deadline.getTime() - now.getTime();
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
        return;
      }
      
      // Otherwise, collection is active - show countdown to next Sunday
      setIsCollectionEnded(false);
      
      const difference = nextSunday.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [pendingOrderCreatedAt]);

  // Fetch flavors and product data - use total_orders_count
  useEffect(() => {
    const fetchData = async () => {
      const productIds = [...new Set(waitingListItems.map((item) => item.product_id))];
      if (productIds.length === 0) return;

      const { data } = await supabase
        .from("products")
        .select("id, flavors, link, total_orders_count, prices")
        .in("id", productIds);

      if (data) {
        const flavorsMap: Record<string, string[]> = {};
        const prodDataMap: Record<string, ProductData> = {};

        data.forEach((p) => {
          flavorsMap[p.id] = (p.flavors as string[]) || [];
          prodDataMap[p.id] = {
            id: p.id,
            link: p.link || "",
            total_orders_count: p.total_orders_count || 0,
            prices: (p.prices as unknown as PriceData[]) || [],
          };
        });

        setProductFlavors(flavorsMap);
        setProductData(prodDataMap);
      }
    };

    void fetchData();

    // Subscribe to realtime updates on products table
    const channel = supabase
      .channel("products-price-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
        },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    // Re-fetch if items/quantities change (covers cases where realtime isn't available)
    waitingListItems.map((i) => `${i.id}:${i.quantity}`).join(","),
  ]);

  // Helper functions for price calculations
  const getFullPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;
    return prod.prices[0].price; // First tier = highest price
  };

  const getMaxDiscountPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;
    return prod.prices[prod.prices.length - 1].price; // Last tier = lowest price (100 participants)
  };

  const getNextDiscountThreshold = (productId: string, userQty: number): { people: number; price: number } | null => {
    // If collection ended, no next threshold
    if (isCollectionEnded) {
      return null;
    }
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return null;
    
    // Only show "Faltan..." after reaching 2nd tier threshold
    const secondTierThreshold = prod.prices.length > 1 ? prod.prices[1].people : 0;
    
    // If user already has an order, their quantity is ALREADY included in total_orders_count
    const current = hasExistingOrder ? prod.total_orders_count : prod.total_orders_count + userQty;
    
    // Don't show next threshold if we haven't reached 2nd tier yet
    if (current < secondTierThreshold) {
      return null;
    }
    
    for (const tier of prod.prices) {
      if (tier.people > current) {
        return tier;
      }
    }
    return null;
  };

  const getParticipantsCount = (productId: string, userQty: number): number => {
    // If collection ended, use per-product frozen count from order items, fallback to order-level
    if (isCollectionEnded && frozenOrderData) {
      const frozenItem = frozenOrderData.items.find(i => i.product_id === productId);
      if (frozenItem?.participants_count != null && frozenItem.participants_count > 0) {
        return frozenItem.participants_count;
      }
      return frozenOrderData.participants_count;
    }
    const prod = productData[productId];
    if (!prod) return userQty;
    // If user already has an order, their quantity is ALREADY included in total_orders_count
    // via waiting_for_discount_count, so don't add it again
    if (hasExistingOrder) {
      return prod.total_orders_count;
    }
    return prod.total_orders_count + userQty;
  };

  // Get current price based on participants count
  // If no order exists, add user's personal quantity (preview mode)
  // Before 2nd tier, use 2nd tier price (buy now price)
  const getCurrentPrice = (productId: string, userQty: number): number => {
    // If collection ended and we have frozen data, use the frozen price
    if (isCollectionEnded && frozenOrderData) {
      const frozenItem = frozenOrderData.items.find(i => i.product_id === productId);
      if (frozenItem) {
        return frozenItem.price_per_unit;
      }
    }
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;
    
    const secondTierThreshold = prod.prices.length > 1 ? prod.prices[1].people : 0;
    const secondTierPrice = prod.prices.length > 1 ? prod.prices[1].price : prod.prices[0].price;
    
    // If user already has an order, their qty is included in total_orders_count
    // If not, we show a "preview" of what price would be with their qty
    const totalParticipants = hasExistingOrder 
      ? prod.total_orders_count 
      : prod.total_orders_count + userQty;
    
    // Before 2nd tier, use 2nd tier price (don't charge higher)
    if (totalParticipants < secondTierThreshold) {
      return secondTierPrice;
    }
    
    // After 2nd tier, find the matching tier price
    let currentPrice = secondTierPrice;
    for (let i = prod.prices.length - 1; i >= 0; i--) {
      if (totalParticipants >= prod.prices[i].people) {
        currentPrice = prod.prices[i].price;
        break;
      }
    }
    
    return currentPrice;
  };

  // Calculate user's total quantity per product for pricing
  const getUserQtyForProduct = (productId: string): number => {
    return waitingListItems
      .filter(i => i.product_id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  // Helper to find frozen item with fallback (product_id + flavor, then product_id only)
  const findFrozenItem = (item: typeof waitingListItems[0]) => {
    if (!frozenOrderData) return null;
    return frozenOrderData.items.find(i => i.product_id === item.product_id && i.flavor === item.flavor)
      || frozenOrderData.items.find(i => i.product_id === item.product_id);
  };

  // Current subtotal with dynamically calculated prices
  const subtotal = waitingListItems.reduce((sum, item) => {
    // If collection ended, use frozen prices
    if (isCollectionEnded && frozenOrderData) {
      const frozenItem = findFrozenItem(item);
      if (frozenItem) {
        return sum + frozenItem.price_per_unit * item.quantity;
      }
    }
    const userQty = getUserQtyForProduct(item.product_id);
    const dynamicPrice = getCurrentPrice(item.product_id, userQty) || item.current_price_per_unit;
    return sum + dynamicPrice * item.quantity;
  }, 0);

  // Full price (without any discount) - always tier 1
  const fullPrice = waitingListItems.reduce((sum, item) => {
    const price = getFullPrice(item.product_id);
    return sum + price * item.quantity;
  }, 0);

  // Estimated total at 100 participants
  const estimatedTotal = waitingListItems.reduce((sum, item) => {
    // If collection ended, don't show estimated (use actual)
    if (isCollectionEnded) {
      return sum;
    }
    const price = getMaxDiscountPrice(item.product_id);
    return sum + price * item.quantity;
  }, 0);

  const currentDiscount = fullPrice - subtotal;
  const estimatedDiscount = fullPrice - estimatedTotal;

  // Get second tier price for "Comprar ahora" button (Buy Now)
  const getSecondTierPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length < 2) return 0;
    return prod.prices[1].price; // Second tier = Buy Now price
  };

  // Calculate Buy Now total using second tier prices
  const getBuyNowTotal = (): number => {
    return waitingListItems.reduce((sum, item) => {
      const secondTierPrice = getSecondTierPrice(item.product_id) || item.current_price_per_unit;
      return sum + secondTierPrice * item.quantity;
    }, 0);
  };

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-AR')}`;
  };

  const handleShare = (item: typeof waitingListItems[0]) => {
    const prod = productData[item.product_id];
    if (!prod) return;
    const link = `${window.location.origin}${prod.link}`;
    const text = `¡Sumate a la compra colectiva de ${item.product_name}! Seamos más, pagamos menos. ${link}`;
    if (navigator.share) {
      navigator.share({ title: item.product_name, text, url: link });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  const handleQuantityChange = async (id: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty >= 1 && newQty <= 99) {
      await updateWaitingListItemQuantity(id, newQty);
      // Only refetch if user has existing order (counters changed in DB)
      if (hasExistingOrder) {
        const productIds = [...new Set(waitingListItems.map((item) => item.product_id))];
        if (productIds.length > 0) {
          const { data } = await supabase
            .from("products")
            .select("id, link, total_orders_count, prices")
            .in("id", productIds);

          if (data) {
            setProductData(prev => {
              const updated = { ...prev };
              data.forEach((p) => {
                updated[p.id] = {
                  ...updated[p.id],
                  total_orders_count: p.total_orders_count || 0,
                  prices: (p.prices as unknown as PriceData[]) || [],
                };
              });
              return updated;
            });
          }
        }
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteItemId) {
      await removeFromWaitingList(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleCompletarDatos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/completar-datos-colectiva");
    } else {
      navigate("/completar-datos-colectiva");
    }
  };

  // Handle continue to checkout (when collection has ended)
  const handleContinueToCheckout = () => {
    navigate("/checkout-colectivo?from=waiting-list");
  };

  // Handle "Comprar ahora" - copy items to cart (keep in waiting list) and navigate
  const handleBuyNow = async () => {
    setIsMovingToCart(true);
    try {
      // Move items to cart but don't clear waiting list
      await moveWaitingListToCart();
      // Note: waiting list items will be cleared when order is finalized in cart checkout
      navigate("/carrito");
    } catch (error) {
      console.error("Error moving to cart:", error);
      toast.error("Error al mover productos al carrito");
    } finally {
      setIsMovingToCart(false);
    }
  };

  // Handle finalize order (confirms the collective order)
  // Handle cancel order (deletes the pending collective order)
  const handleCancelOrder = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/lista-espera");
      return;
    }

    setIsSubmitting(true);

    try {
      // Delete the pending collective order
      const { error: deleteError } = await supabase
        .from("user_orders")
        .delete()
        .eq("user_id", session.user.id)
        .eq("order_type", "collective")
        .eq("status", "pending");

      if (deleteError) throw deleteError;

      // Clear waiting list items
      await clearWaitingList();

      toast.success("Pedido cancelado.");
      navigate("/");
    } catch (error) {
      console.error("Error canceling order:", error);
      toast.error("Error al cancelar el pedido. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeOrder = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/lista-espera");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the pending collective order to confirmed status
      const { data: orderData, error: updateError } = await supabase
        .from("user_orders")
        .update({ status: "confirmed" })
        .eq("user_id", session.user.id)
        .eq("order_type", "collective")
        .eq("status", "pending")
        .select("id")
        .single();

      if (updateError) throw updateError;

      // Clear waiting list items
      await clearWaitingList();

      toast.success("¡Pedido confirmado! Lo verás en tu cuenta.");
      navigate("/mi-cuenta");
    } catch (error) {
      console.error("Error finalizing order:", error);
      toast.error("Error al confirmar el pedido. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
          <div className="container mx-auto max-w-2xl">
            <p className="text-center text-muted-foreground">Cargando lista de espera...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
              <Timer className="w-6 h-6 text-primary" />
              Lista de Espera
              {hasExistingOrder && profileCompleted && !isCollectionEnded && (
                <span className="text-primary text-lg font-medium">— ¡Ya participás! 🎉</span>
              )}
            </h1>
            <p className="text-muted-foreground">
              {waitingListCount} {waitingListCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          {/* Timer or Collection Ended Notice */}
          {isCollectionEnded ? (
            <div className="mb-6 bg-amber-500 text-white rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">¡Compra colectiva cerrada!</span>
              </div>
              <p className="text-center text-sm opacity-90 mb-2">
                Tenés hasta el domingo para confirmar tu pedido
              </p>
              <div className="flex justify-center gap-3 text-center text-sm">
                <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m restantes</span>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-gradient-primary text-white rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Cierre en:</span>
              </div>
              <div className="flex justify-center gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{timeLeft.days}</div>
                  <div className="text-xs opacity-80">días</div>
                </div>
                <div className="text-3xl font-bold">:</div>
                <div>
                  <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-xs opacity-80">horas</div>
                </div>
                <div className="text-3xl font-bold">:</div>
                <div>
                  <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-xs opacity-80">min</div>
                </div>
                <div className="text-3xl font-bold">:</div>
                <div>
                  <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-xs opacity-80">seg</div>
                </div>
              </div>
              <p className="text-center text-sm mt-2 opacity-90">
                El pedido se cerrará el domingo a las 23:59
              </p>
            </div>
          )}

          {waitingListItems.length === 0 ? (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tu lista de espera está vacía</h2>
              <p className="text-muted-foreground mb-4">
                Agregá productos y esperá para pagar menos
              </p>
              <Button asChild>
                <Link to="/">Explorar productos</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Waiting List Items - No Card wrapper */}
              <div className="space-y-0 mb-6">
                {waitingListItems.map((item, index) => {
                  const prod = productData[item.product_id];
                  const participantCount = getParticipantsCount(item.product_id, item.quantity);
                  const nextThreshold = getNextDiscountThreshold(item.product_id, item.quantity);
                  const dynamicPrice = getCurrentPrice(item.product_id, item.quantity) || item.current_price_per_unit;

                  return (
                    <div key={item.id}>
                      <WaitingListProductItem
                        id={item.id}
                        productId={item.product_id}
                        productName={item.product_name}
                        productImage={item.product_image}
                        pricePerUnit={dynamicPrice}
                        quantity={item.quantity}
                        flavor={item.flavor}
                        flavors={productFlavors[item.product_id] || []}
                        productLink={prod?.link || "#"}
                        participantCount={participantCount}
                        nextThreshold={nextThreshold}
                        isCollectionEnded={isCollectionEnded}
                        onQuantityChange={handleQuantityChange}
                        onFlavorChange={updateWaitingListItemFlavor}
                        onDelete={(id) => setDeleteItemId(id)}
                        onShare={() => handleShare(item)}
                        formatPrice={formatPrice}
                      />
                      {index < waitingListItems.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />

              {/* Summary - Different format based on collection state */}
              {isCollectionEnded ? (
                // Collection ended - show cart-like summary
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio sin descuento:</span>
                    <span className="line-through text-muted-foreground">{formatPrice(fullPrice)}</span>
                  </div>
                  {currentDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento:</span>
                      <span>-{formatPrice(currentDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
              ) : (
                // Collection active - show estimated prices
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio sin descuento:</span>
                    <span className="line-through text-muted-foreground">
                      {formatPrice(fullPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento actual:</span>
                    <span>-{formatPrice(currentDiscount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span>Descuento estimado:</span>
                    <span>-{formatPrice(estimatedDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span className="text-primary">Total estimado:</span>
                    <span className="text-primary">{formatPrice(estimatedTotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    El precio final se calculará al cerrar la compra colectiva el domingo 23:59
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {isCollectionEnded ? (
                  // Collection ended - show checkout flow
                  <>
                    <Button
                      onClick={handleContinueToCheckout}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Continuar con la compra
                    </Button>
                    <Button
                      onClick={handleCancelOrder}
                      variant="outline"
                      className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Cancelando..." : "Cancelar el pedido"}
                    </Button>
                  </>
                ) : (
                  // Collection active - show waiting list flow
                  <>
                    {/* Completar información / Editar datos button - PRIMARY */}
                    <Button
                      onClick={handleCompletarDatos}
                      className={`w-full gap-2 ${hasExistingOrder && profileCompleted ? "bg-white text-primary hover:bg-white/90 border border-primary" : ""}`}
                      size="lg"
                      variant={hasExistingOrder && profileCompleted ? "outline" : "default"}
                    >
                      <Check className="w-4 h-4" />
                      {hasExistingOrder && profileCompleted ? "¡Ya participás! 🎉 / Editar datos" : "Completar información"}
                    </Button>

                    {/* Comprar ahora button - moves items to cart with second tier price */}
                    <Button
                      onClick={handleBuyNow}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                      disabled={isMovingToCart}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isMovingToCart ? "Moviendo al carrito..." : `Comprar ahora ${formatPrice(getBuyNowTotal())}`}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                      Tu lista se guardará hasta que se cierre la compra colectiva el domingo a las 23:59
                    </p>

                    {/* Share Block - Same as ServiceDescription */}
                    <Separator className="my-4" />
                    <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
                      <p className="text-sm font-semibold text-primary text-center mb-1">
                        ¡Seamos más pagamos menos!
                      </p>
                      <p className="text-sm text-center text-muted-foreground mb-4">
                        Vamos a conseguir el mejor descuento — compartilo con tus amigos.
                      </p>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            const text = 'Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/';
                            if (navigator.share) {
                              navigator.share({ text }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(text);
                              toast.success("¡Texto copiado!");
                            }
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <Share2 className="h-4 w-4 flex-shrink-0" />
                          <span>Compartir con amigos</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            const text = encodeURIComponent('Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/');
                            window.open(`https://wa.me/?text=${text}`, '_blank');
                          }}
                          className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/>
                          </svg>
                          <span>Compartir por WhatsApp</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/');
                            toast.success("¡Invitación copiada!");
                          }}
                          className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copiar invitación</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://alaola.com.ar/');
                            toast.success("¡Enlace copiado!");
                          }}
                          className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copiar enlace</span>
                        </button>
                        
                        <div className="border-t border-border/50 pt-2 mt-2" />
                        
                        <div className="relative w-full p-[2px] rounded-md bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                          <a
                            href="https://www.instagram.com/ola.unity/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-background hover:bg-accent rounded-md py-2.5 px-4 transition-colors text-sm"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="url(#instagram-gradient-wl)">
                              <defs>
                                <linearGradient id="instagram-gradient-wl" x1="0%" y1="100%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#f09433"/>
                                  <stop offset="25%" stopColor="#e6683c"/>
                                  <stop offset="50%" stopColor="#dc2743"/>
                                  <stop offset="75%" stopColor="#cc2366"/>
                                  <stop offset="100%" stopColor="#bc1888"/>
                                </linearGradient>
                              </defs>
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            <span>Seguinos en Instagram</span>
                          </a>
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          para ofertas, descuentos y novedades
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar este producto de la lista de espera?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingWhatsApp />
    </div>
  );
};

export default WaitingList;
