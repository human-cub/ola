import { useMemo, useState } from "react";
import { useDeliveryEstimate } from "@/hooks/useDeliveryEstimate";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { ProductLineItem } from "@/components/ProductLineItem";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { CartSummary } from "@/components/cart/CartSummary";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";
import { useCheckoutPricing } from "@/hooks/useCheckoutPricing";
import { usePromoCode } from "@/hooks/usePromoCode";
import { useCatalogPricing } from "@/hooks/useCatalogPricing";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    isLoading,
    updateCartItemQuantity,
    removeFromCart,
  } = useCart();
  const headerVisible = useScrollHeader();
  const [deleteGroup, setDeleteGroup] = useState<{ productName: string; itemIds: string[] } | null>(null);
  const { appliedPromo, setAppliedPromo, removePromo } = usePromoCode();

  const { priceMap } = useCatalogPricing();

  const { costFor } = useDeliveryEstimate();
  const { subtotal, fullPrice, discount, getUnitPrice } = useCheckoutPricing(
    cartItems,
    "caba",
    appliedPromo?.tier_bonus ?? 0,
    false,
  );

  // Agrupar los sabores del mismo producto en una sola tarjeta (igual que Mis grupos).
  const groupedCartItems = useMemo(() => {
    const grouped = new Map<string, {
      productId: string;
      productName: string;
      productImage: string | null;
      itemIds: string[];
      totalQuantity: number;
      flavorEntries: Array<{ id: string; flavor: string | null; quantity: number }>;
    }>();
    cartItems.forEach((item) => {
      const groupKey = priceMap.get(item.product_id)?.urlSlug ?? item.product_id;
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.itemIds.push(item.id);
        existing.totalQuantity += item.quantity;
        existing.flavorEntries.push({ id: item.id, flavor: item.flavor, quantity: item.quantity });
        return;
      }
      grouped.set(groupKey, {
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        itemIds: [item.id],
        totalQuantity: item.quantity,
        flavorEntries: [{ id: item.id, flavor: item.flavor, quantity: item.quantity }],
      });
    });
    return Array.from(grouped.values());
  }, [cartItems, priceMap]);

  const handleQuantityChange = async (id: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeFromCart(id);
    } else if (newQty <= 99) {
      await updateCartItemQuantity(id, newQty);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteGroup) {
      for (const itemId of deleteGroup.itemIds) {
        await removeFromCart(itemId);
      }
      setDeleteGroup(null);
    }
  };

  const handleCheckout = async () => {
    // Guests can check out; the account is created at finalize.
    navigate("/finalizar-compra");
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
              <div className="rounded-xl border border-primary bg-card px-4 sm:px-5 py-4 mb-6">
                {groupedCartItems.map((group, index) => {
                  const info = priceMap.get(group.productId);
                  const firstItem = cartItems.find((i) => i.id === group.itemIds[0]);
                  const unit = firstItem ? getUnitPrice(firstItem) : 0;
                  return (
                    <div key={group.productId}>
                      <ProductLineItem
                        id={group.productId}
                        productName={group.productName}
                        productImage={group.productImage}
                        productSize={info?.size ?? null}
                        pricePerUnit={unit}
                        retailPerUnit={info?.retail ?? 0}
                        totalQuantity={group.totalQuantity}
                        flavorEntries={group.flavorEntries}
                        productLink={info ? `/productos/${info.urlSlug}` : "#"}
                        onQuantityChange={handleQuantityChange}
                        onDelete={() => setDeleteGroup({ productName: group.productName, itemIds: group.itemIds })}
                      />
                      {index < groupedCartItems.length - 1 && <Separator />}
                    </div>
                  );
                })}
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
                deliveryCost={costFor(subtotal)}
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
        open={!!deleteGroup}
        onOpenChange={() => setDeleteGroup(null)}
        title="¿Eliminar producto?"
        description={deleteGroup
          ? `¿Estás seguro de que querés eliminar ${deleteGroup.productName} del carrito?`
          : ""}
        onConfirm={handleDeleteConfirm}
      />

      <Footer />

      <FloatingWhatsApp />
    </div>
  );
};

export default Cart;
