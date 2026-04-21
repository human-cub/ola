import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { CartProductItem } from "@/components/CartProductItem";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { CartSummary } from "@/components/cart/CartSummary";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";
import { useCheckoutPricing } from "@/hooks/useCheckoutPricing";
import { usePromoCode } from "@/hooks/usePromoCode";
import { useUserRole } from "@/hooks/useUserRole";

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
  const headerVisible = useScrollHeader();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [productFlavors, setProductFlavors] = useState<Record<string, string[]>>({});
  const [productLinks, setProductLinks] = useState<Record<string, string>>({});
  const [productFirstPrices, setProductFirstPrices] = useState<Record<string, number>>({});
  const { appliedPromo, setAppliedPromo, removePromo } = usePromoCode();

  useEffect(() => {
    const fetchProductData = async () => {
      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      if (productIds.length === 0) return;

      const { data } = await supabase
        .from("products")
        .select("id, flavors, link, prices")
        .in("id", productIds);

      if (data) {
        const flavorsMap: Record<string, string[]> = {};
        const linksMap: Record<string, string> = {};
        const firstPricesMap: Record<string, number> = {};
        data.forEach((p) => {
          flavorsMap[p.id] = (p.flavors as string[]) || [];
          linksMap[p.id] = p.link || "";
          const prices = (p.prices as any[]) || [];
          firstPricesMap[p.id] = prices.length > 0 ? prices[0].price : 0;
        });
        setProductFlavors(flavorsMap);
        setProductLinks(linksMap);
        setProductFirstPrices(firstPricesMap);
      }
    };

    fetchProductData();
  }, [cartItems]);

  const { subtotal, fullPrice, discount } = useCheckoutPricing(
    cartItems,
    "caba",
    appliedPromo?.tier_bonus ?? 0,
    false,
  );

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
        <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
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

      <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
        <div className="container mx-auto max-w-2xl flex flex-col">
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
                    />
                    {index < cartItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <PromoCodeInput
                appliedPromo={appliedPromo}
                onApply={setAppliedPromo}
                onRemove={removePromo}
              />

              <CartSummary
                fullPrice={fullPrice}
                discount={discount}
                subtotal={subtotal}
              />

              <Button
                onClick={handleCheckout}
                className="w-full gap-2 mx-auto"
                size="lg"
              >
                Continuar con la compra
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </main>

      <ConfirmDeleteDialog
        open={!!deleteItemId}
        onOpenChange={() => setDeleteItemId(null)}
        title="¿Eliminar producto?"
        description="¿Estás seguro de que querés eliminar este producto del carrito?"
        onConfirm={handleDeleteConfirm}
      />

      <Footer />

      <FloatingWhatsApp />
    </div>
  );
};

export default Cart;
