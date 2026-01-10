import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    isLoading,
    updateCartItemQuantity,
    updateCartItemFlavor,
    removeFromCart,
  } = useCart();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [productFlavors, setProductFlavors] = useState<Record<string, string[]>>({});

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

  // Fetch flavors for products
  useEffect(() => {
    const fetchFlavors = async () => {
      const productIds = [...new Set(cartItems.map(item => item.product_id))];
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

    fetchFlavors();
  }, [cartItems]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price_per_unit * item.quantity,
    0
  );

  // Assuming original price is 20% higher for discount display
  const originalPrice = subtotal * 1.2;
  const discount = originalPrice - subtotal;

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-AR')}`;
  };

  const handleQuantityChange = async (id: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty >= 1 && newQty <= 99) {
      await updateCartItemQuantity(id, newQty);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteItemId) {
      await removeFromCart(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleCheckout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-2xl">
            <p className="text-center text-muted-foreground">Cargando carrito...</p>
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

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Mi Carrito</h1>
              <p className="text-muted-foreground">
                {cartCount} {cartCount === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
              <p className="text-muted-foreground mb-4">
                Agregá productos para comenzar
              </p>
              <Button asChild>
                <Link to="/">Ir a comprar</Link>
              </Button>
            </Card>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold truncate pr-2">
                              {item.product_name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                              onClick={() => setDeleteItemId(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Flavor selector */}
                          {productFlavors[item.product_id]?.length > 0 && (
                            <Select
                              value={item.flavor || ""}
                              onValueChange={(value) =>
                                updateCartItemFlavor(item.id, value)
                              }
                            >
                              <SelectTrigger className="w-full mt-2 h-8 text-sm">
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
                            {/* Quantity */}
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
                              <span className="w-8 text-center font-medium">
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

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.price_per_unit)} c/u
                              </p>
                              <p className="font-semibold">
                                {formatPrice(item.price_per_unit * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary */}
              <Card className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="line-through text-muted-foreground">
                    {formatPrice(originalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-sm text-green-600 text-center font-medium">
                  ¡Ahorraste {formatPrice(discount)} pesos!
                </p>

                <Button
                  onClick={handleCheckout}
                  className="w-full gap-2"
                  size="lg"
                >
                  Continuar con la compra
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar este producto del carrito?
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

export default Cart;
