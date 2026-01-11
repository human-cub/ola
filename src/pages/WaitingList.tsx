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
import { Plus, Minus, Trash2, Timer, ArrowLeft, ArrowRight, ShoppingCart, Clock, Check, Share2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";

interface PriceData {
  people: number;
  price: number;
}

interface ProductData {
  id: string;
  link: string;
  waiting_for_discount_count: number;
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
    moveWaitingListToCart,
  } = useCart();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [productFlavors, setProductFlavors] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [productData, setProductData] = useState<Record<string, ProductData>>({});

  // Check if user has pending collective order
  useEffect(() => {
    const checkExistingOrder = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasExistingOrder(false);
        return;
      }

      const { data } = await supabase
        .from("user_orders")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("order_type", "collective")
        .eq("status", "pending")
        .maybeSingle();

      setHasExistingOrder(!!data);
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

  // Countdown timer to Sunday 23:59
  useEffect(() => {
    const getNextSunday = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7;
      
      if (daysUntilSunday === 0 && now.getHours() < 23) {
        nextSunday.setHours(23, 59, 59, 999);
      } else {
        nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
        nextSunday.setHours(23, 59, 59, 999);
      }
      return nextSunday;
    };

    const calculateTimeLeft = () => {
      const targetDate = getNextSunday();
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

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
  }, []);

  // Fetch flavors and product data
  useEffect(() => {
    const fetchData = async () => {
      const productIds = [...new Set(waitingListItems.map(item => item.product_id))];
      if (productIds.length === 0) return;

      const { data } = await supabase
        .from("products")
        .select("id, flavors, link, waiting_for_discount_count, prices")
        .in("id", productIds);

      if (data) {
        const flavorsMap: Record<string, string[]> = {};
        const prodDataMap: Record<string, ProductData> = {};
        data.forEach((p) => {
          flavorsMap[p.id] = (p.flavors as string[]) || [];
          prodDataMap[p.id] = {
            id: p.id,
            link: p.link || "",
            waiting_for_discount_count: p.waiting_for_discount_count || 0,
            prices: (p.prices as unknown as PriceData[]) || [],
          };
        });
        setProductFlavors(flavorsMap);
        setProductData(prodDataMap);
      }
    };

    fetchData();
  }, [waitingListItems]);

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

  const getNextDiscountThreshold = (productId: string): { people: number; price: number } | null => {
    const prod = productData[productId];
    if (!prod || prod.prices.length === 0) return null;
    const current = prod.waiting_for_discount_count;
    for (const tier of prod.prices) {
      if (tier.people > current) {
        return tier;
      }
    }
    return null;
  };

  const getParticipantsRemaining = (productId: string): number => {
    const prod = productData[productId];
    if (!prod) return 0;
    return Math.max(0, 100 - prod.waiting_for_discount_count);
  };

  // Current subtotal with current prices
  const subtotal = waitingListItems.reduce(
    (sum, item) => sum + item.current_price_per_unit * item.quantity,
    0
  );

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

  const handleBuyNow = async () => {
    await moveWaitingListToCart();
    navigate("/carrito");
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Timer className="w-6 h-6 text-primary" />
              Lista de Espera
            </h1>
            <p className="text-muted-foreground">
              {waitingListCount} {waitingListCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          {/* Timer */}
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
                  const participantCount = prod?.waiting_for_discount_count || 0;
                  const remaining = getParticipantsRemaining(item.product_id);
                  const nextThreshold = getNextDiscountThreshold(item.product_id);

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

                          {/* Participant indicator */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-primary">
                              {participantCount}/100
                            </span>
                            {nextThreshold && (
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
                                {formatPrice(item.current_price_per_unit)} c/u
                              </p>
                              <p className="font-semibold">
                                {formatPrice(item.current_price_per_unit * item.quantity)}
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

              {/* Summary - No Card wrapper */}
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal actual:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm text-primary">
                  <span>Descuento estimado (100 uds):</span>
                  <span>-{formatPrice(estimatedDiscount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total estimado (100 uds):</span>
                  <span className="text-primary">{formatPrice(estimatedTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  El precio final se calculará al cerrar la compra colectiva el domingo 23:59
                </p>
              </div>

              <div className="flex flex-col gap-3">
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
                <Button
                  variant="outline"
                  onClick={handleBuyNow}
                  className="w-full gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Comprar ahora ({formatPrice(subtotal)})
                </Button>
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