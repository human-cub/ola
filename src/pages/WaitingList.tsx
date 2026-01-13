import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Minus, Trash2, Timer, ArrowLeft, ArrowRight, ShoppingCart, Clock, Check, Share2, AlertTriangle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
  const [productData, setProductData] = useState<Record<string, ProductData>>({});
  const [isCollectionEnded, setIsCollectionEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationDeadline, setConfirmationDeadline] = useState<Date | null>(null);
  const [isMovingToCart, setIsMovingToCart] = useState(false);
  const [pendingOrderCreatedAt, setPendingOrderCreatedAt] = useState<Date | null>(null);

  // Check if user has pending collective order and get its creation date
  useEffect(() => {
    const checkExistingOrder = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasExistingOrder(false);
        setPendingOrderCreatedAt(null);
        return;
      }

      const { data } = await supabase
        .from("user_orders")
        .select("id, created_at")
        .eq("user_id", session.user.id)
        .eq("order_type", "collective")
        .eq("status", "pending")
        .maybeSingle();

      setHasExistingOrder(!!data);
      setPendingOrderCreatedAt(data ? new Date(data.created_at) : null);
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
      const daysUntilSunday = (7 - now.getDay()) % 7;
      
      if (daysUntilSunday === 0) {
        // It's Sunday
        if (now.getHours() < 23 || (now.getHours() === 23 && now.getMinutes() < 59)) {
          // Before 23:59 - target is today
          nextSunday.setHours(23, 59, 59, 999);
        } else {
          // After 23:59 - target is next Sunday
          nextSunday.setDate(now.getDate() + 7);
          nextSunday.setHours(23, 59, 59, 999);
        }
      } else {
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
  // Also update prices dynamically based on current participant count
  useEffect(() => {
    const fetchDataAndUpdatePrices = async () => {
      const productIds = [...new Set(waitingListItems.map(item => item.product_id))];
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

        // Update waiting list item prices based on current total_orders_count
        for (const item of waitingListItems) {
          const prod = prodDataMap[item.product_id];
          if (!prod || !prod.prices.length) continue;

          const totalParticipants = prod.total_orders_count;
          let newPrice = prod.prices[0].price; // Default to first tier

          // Find the correct tier based on total participants
          for (let i = prod.prices.length - 1; i >= 0; i--) {
            if (totalParticipants >= prod.prices[i].people) {
              newPrice = prod.prices[i].price;
              break;
            }
          }

          // Update price if different
          if (Math.abs(item.current_price_per_unit - newPrice) > 0.01) {
            await supabase
              .from("waiting_list_items")
              .update({ current_price_per_unit: newPrice })
              .eq("id", item.id);
          }
        }
      }
    };

    fetchDataAndUpdatePrices();

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
          fetchDataAndUpdatePrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [waitingListItems.map(i => i.id).join(",")]);

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
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return null;
    const current = prod.total_orders_count + userQty;
    for (const tier of prod.prices) {
      if (tier.people > current) {
        return tier;
      }
    }
    return null;
  };

  const getParticipantsCount = (productId: string, userQty: number): number => {
    const prod = productData[productId];
    if (!prod) return userQty;
    return prod.total_orders_count + userQty;
  };

  // Get current price based on total_orders_count
  const getCurrentPrice = (productId: string): number => {
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return 0;
    
    const totalParticipants = prod.total_orders_count;
    let currentPrice = prod.prices[0].price; // Default to first tier (highest price)
    
    for (let i = prod.prices.length - 1; i >= 0; i--) {
      if (totalParticipants >= prod.prices[i].people) {
        currentPrice = prod.prices[i].price;
        break;
      }
    }
    
    return currentPrice;
  };

  // Current subtotal with dynamically calculated prices
  const subtotal = waitingListItems.reduce((sum, item) => {
    const dynamicPrice = getCurrentPrice(item.product_id) || item.current_price_per_unit;
    return sum + dynamicPrice * item.quantity;
  }, 0);

  // Full price (without any discount)
  const fullPrice = waitingListItems.reduce((sum, item) => {
    const price = getFullPrice(item.product_id);
    return sum + price * item.quantity;
  }, 0);

  // Estimated total at 100 participants
  const estimatedTotal = waitingListItems.reduce((sum, item) => {
    const price = getMaxDiscountPrice(item.product_id);
    return sum + price * item.quantity;
  }, 0);

  const currentDiscount = fullPrice - subtotal;
  const estimatedDiscount = fullPrice - estimatedTotal;

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
    navigate("/checkout?from=waiting-list");
  };

  // Handle "Comprar ahora" - move all items to cart and navigate
  const handleBuyNow = async () => {
    setIsMovingToCart(true);
    try {
      await moveWaitingListToCart();
      await clearWaitingList();
      navigate("/carrito");
    } catch (error) {
      console.error("Error moving to cart:", error);
      toast.error("Error al mover productos al carrito");
    } finally {
      setIsMovingToCart(false);
    }
  };

  // Handle finalize order (confirms the collective order)
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
        <main className="pt-20 pb-8 px-4">
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

      <main className="pt-20 pb-8 px-4">
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
              {hasExistingOrder && !isCollectionEnded && (
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
              <div className="space-y-4 mb-6">
                {waitingListItems.map((item, index) => {
                  const prod = productData[item.product_id];
                  const participantCount = getParticipantsCount(item.product_id, item.quantity);
                  const nextThreshold = getNextDiscountThreshold(item.product_id, item.quantity);
                  const dynamicPrice = getCurrentPrice(item.product_id) || item.current_price_per_unit;

                  return (
                    <div key={item.id}>
                      <div className="flex gap-4 py-4">
                        <Link to={prod?.link || "#"} className="flex-shrink-0">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <Link to={prod?.link || "#"} className="hover:underline">
                              <h3 className="font-semibold text-sm leading-tight">
                                {item.product_name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleShare(item)}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                onClick={() => setDeleteItemId(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Participant indicator - use total_orders_count + user quantity */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-primary">
                              {participantCount}/100
                            </span>
                            {nextThreshold && nextThreshold.people > participantCount && (
                              <span className="text-xs text-muted-foreground">
                                · Faltan {nextThreshold.people - participantCount} para {formatPrice(nextThreshold.price)}
                              </span>
                            )}
                          </div>

                          {productFlavors[item.product_id]?.length > 0 && (
                            <Select
                              value={item.flavor || ""}
                              onValueChange={(value) =>
                                updateWaitingListItemFlavor(item.id, value)
                              }
                            >
                              <SelectTrigger className="w-full mt-2 h-8 text-xs">
                                <SelectValue placeholder="Seleccionar sabor" />
                              </SelectTrigger>
                              <SelectContent>
                                {productFlavors[item.product_id].map((flavor) => (
                                  <SelectItem key={flavor} value={flavor}>
                                    {flavor}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleQuantityChange(item.id, -1, item.quantity)
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-medium text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleQuantityChange(item.id, 1, item.quantity)
                                }
                                disabled={item.quantity >= 99}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(dynamicPrice)} c/u
                              </p>
                              <p className="font-semibold">
                                {formatPrice(dynamicPrice * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {currentDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento:</span>
                      <span>-{formatPrice(currentDiscount)}</span>
                    </div>
                  )}
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
                    {hasExistingOrder && (
                      <Button
                        onClick={handleFinalizeOrder}
                        variant="outline"
                        className="w-full gap-2"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        <Check className="w-4 h-4" />
                        {isSubmitting ? "Finalizando..." : "Finalizar pedido"}
                      </Button>
                    )}
                  </>
                ) : (
                  // Collection active - show waiting list flow
                  <>
                    {/* Comprar ahora button - moves items to cart */}
                    <Button
                      onClick={handleBuyNow}
                      className="w-full gap-2"
                      size="lg"
                      disabled={isMovingToCart}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isMovingToCart ? "Moviendo al carrito..." : "Comprar ahora"}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                      Tu lista se guardará hasta que se cierre la compra colectiva el domingo a las 23:59
                    </p>
                    
                    <Button
                      onClick={handleCompletarDatos}
                      className={`w-full gap-2 ${hasExistingOrder ? "bg-white text-primary hover:bg-white/90 border border-primary" : ""}`}
                      size="lg"
                      variant={hasExistingOrder ? "outline" : "default"}
                    >
                      <Check className="w-4 h-4" />
                      {hasExistingOrder ? "¡Ya participás! 🎉 / Editar datos" : "Entrar en lista de espera"}
                    </Button>

                    {/* Share Block */}
                    <Separator className="my-4" />
                    <div className="text-center space-y-4">
                      <h3 className="font-semibold text-lg">Invitá a tus amigos</h3>
                      <Button
                        className="w-full gap-2 bg-primary hover:bg-primary/90"
                        size="lg"
                        onClick={() => {
                          const text = `¡Sumate a la compra colectiva en OlaProteína! Seamos más, pagamos menos. ${window.location.origin}`;
                          if (navigator.share) {
                            navigator.share({ title: "OlaProteína", text, url: window.location.origin });
                          } else {
                            navigator.clipboard.writeText(text);
                            toast.success("Enlace copiado al portapapeles");
                          }
                        }}
                      >
                        <Share2 className="w-5 h-5" />
                        Compartir con amigos
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => {
                            const text = `¡Sumate a la compra colectiva en OlaProteína! Seamos más, pagamos menos. ${window.location.origin}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => {
                            const text = `¡Sumate a la compra colectiva en OlaProteína! Seamos más, pagamos menos. ${window.location.origin}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Invitación copiada al portapapeles");
                          }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Copiar invitación
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            toast.success("Enlace copiado al portapapeles");
                          }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                          Copiar enlace
                        </Button>
                      </div>

                      <Separator className="my-4" />

                      {/* Instagram button with gradient border */}
                      <a
                        href="https://instagram.com/olaproteina"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="relative p-[2px] rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888]">
                          <Button
                            variant="ghost"
                            className="w-full gap-2 bg-white hover:bg-gray-50 rounded-[10px] h-12"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                              <defs>
                                <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#f09433"/>
                                  <stop offset="25%" stopColor="#e6683c"/>
                                  <stop offset="50%" stopColor="#dc2743"/>
                                  <stop offset="75%" stopColor="#cc2366"/>
                                  <stop offset="100%" stopColor="#bc1888"/>
                                </linearGradient>
                              </defs>
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Seguinos en Instagram
                          </Button>
                        </div>
                      </a>
                      <p className="text-xs text-muted-foreground">
                        para ofertas, descuentos y novedades
                      </p>
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
