import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
import { ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { CartProductItem } from "@/components/CartProductItem";

interface ProductLink {
  id: string;
  link: string;
}

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
  const [productLinks, setProductLinks] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const fetchProductData = async () => {
      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      if (productIds.length === 0) return;

      const { data } = await supabase
        .from("products")
        .select("id, flavors, link")
        .in("id", productIds);

      if (data) {
        const flavorsMap: Record<string, string[]> = {};
        const linksMap: Record<string, string> = {};
        data.forEach((p) => {
          flavorsMap[p.id] = (p.flavors as string[]) || [];
          linksMap[p.id] = p.link || "";
        });
        setProductFlavors(flavorsMap);
        setProductLinks(linksMap);
      }
    };

    fetchProductData();
  }, [cartItems]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price_per_unit * item.quantity,
    0
  );

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

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Mi Carrito</h1>
            <p className="text-muted-foreground">
              {cartCount} {cartCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
              <p className="text-muted-foreground mb-4">
                Agregá productos para comenzar
              </p>
              <Button asChild>
                <Link to="/">Ir a comprar</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items - No Card wrapper */}
              <div className="space-y-0 mb-6">
                {cartItems.map((item, index) => (
                  <div key={item.id}>
                    <CartProductItem
                      id={item.id}
                      productId={item.product_id}
                      productName={item.product_name}
                      productImage={item.product_image}
                      pricePerUnit={item.price_per_unit}
                      quantity={item.quantity}
                      flavor={item.flavor}
                      flavors={productFlavors[item.product_id] || []}
                      productLink={productLinks[item.product_id] || "#"}
                      onQuantityChange={handleQuantityChange}
                      onFlavorChange={updateCartItemFlavor}
                      onDelete={(id) => setDeleteItemId(id)}
                      formatPrice={formatPrice}
                    />
                    {index < cartItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Summary - No Card wrapper */}
              <div className="space-y-3 mb-6">
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
                <Separator />
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-sm text-green-600 text-center font-medium">
                  ¡Ahorraste {formatPrice(discount)} pesos!
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full gap-2"
                size="lg"
              >
                Continuar con la compra
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </main>

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

      <Footer showCategories />

      <FloatingWhatsApp />
    </div>
  );
};

export default Cart;