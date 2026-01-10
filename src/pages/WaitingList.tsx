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
import { Plus, Minus, Trash2, Timer, ArrowLeft, ArrowRight, ShoppingCart, Clock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";

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

  // Fetch flavors
  useEffect(() => {
    const fetchData = async () => {
      const productIds = [...new Set(waitingListItems.map(item => item.product_id))];
      if (productIds.length === 0) return;

      const { data } = await supabase
        .from("products")
        .select("id, flavors")
        .in("id", productIds);

      if (data) {
        const flavorsMap: Record<string, string[]> = {};
        data.forEach((p) => {
          flavorsMap[p.id] = (p.flavors as string[]) || [];
        });
        setProductFlavors(flavorsMap);
      }
    };

    fetchData();
  }, [waitingListItems]);

  const subtotal = waitingListItems.reduce(
    (sum, item) => sum + item.current_price_per_unit * item.quantity,
    0
  );

  const originalPrice = subtotal * 1.3;
  const discount = originalPrice - subtotal;
  const discountPercent = Math.round((discount / originalPrice) * 100);

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-AR')}`;
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

  const handleCheckout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/checkout-colectivo");
    } else {
      navigate("/checkout-colectivo");
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
                {waitingListItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-4 py-4">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-sm leading-tight">
                            {item.product_name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 w-8"
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                ))}
              </div>

              <Separator className="my-6" />

              {/* Summary - No Card wrapper */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio sin descuento:</span>
                  <span className="line-through text-muted-foreground">
                    {formatPrice(originalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento actual ({discountPercent}%):</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total estimado:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-sm text-green-600 text-center font-medium">
                  ¡Ahorro estimado: {formatPrice(discount)} pesos!
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  El precio final se calculará al cerrar la compra colectiva
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCheckout}
                  className="w-full gap-2"
                  size="lg"
                >
                  Confirmar pedido
                  <ArrowRight className="w-4 h-4" />
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