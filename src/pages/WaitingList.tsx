import { useState, useEffect, useMemo } from "react";
import { useDeliveryEstimate } from "@/hooks/useDeliveryEstimate";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ArrowLeft } from "lucide-react";
import { GroupIcon } from "@/components/icons/GroupIcon";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { WaitingListProductItem } from "@/components/WaitingListProductItem";
import { BrandGroupHeader } from "@/components/waiting-list/BrandGroupHeader";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useCollectiveCountdown } from "@/hooks/useCollectiveCountdown";
import { usePendingOrder } from "@/hooks/usePendingOrder";
import { useWaitingListPricing } from "@/hooks/useWaitingListPricing";
import { useCatalogPricing } from "@/hooks/useCatalogPricing";
import { CountdownBanner } from "@/components/waiting-list/CountdownBanner";
import { WaitingListSummary } from "@/components/waiting-list/WaitingListSummary";
import { WaitingListActions } from "@/components/waiting-list/WaitingListActions";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";
import { usePromoCode } from "@/hooks/usePromoCode";

const WaitingList = () => {
  const navigate = useNavigate();
  const {
    waitingListItems,
    isLoading,
    updateWaitingListItemQuantity,
    removeFromWaitingList,
    clearWaitingList,
    moveWaitingListToCart,
    syncPendingOrderPrices,
  } = useCart();
  const headerVisible = useScrollHeader();
  const [deleteGroup, setDeleteGroup] = useState<{ productName: string; itemIds: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMovingToCart, setIsMovingToCart] = useState(false);
  const { appliedPromo, setAppliedPromo, removePromo } = usePromoCode();

  const { hasExistingOrder, profileCompleted, pendingOrderCreatedAt, collectiveCloseDate, frozenOrderData } =
    usePendingOrder(waitingListItems);

  const { timeLeft, isCollectionEnded } =
    useCollectiveCountdown(pendingOrderCreatedAt, collectiveCloseDate);

  const { priceMap, brandReached } = useCatalogPricing();

  const {
    getCurrentPrice,
    getBuyNowTotal,
    subtotal,
    fullPrice,
    estimatedTotal,
    currentDiscount,
    estimatedDiscount,
  } = useWaitingListPricing({
    waitingListItems,
    isCollectionEnded,
    hasExistingOrder,
    frozenOrderData,
    promoTierBonus: appliedPromo?.tier_bonus ?? 0,
    priceMap,
    brandReached,
  });
  const { costFor } = useDeliveryEstimate();

  const groupedWaitingListItems = useMemo(() => {
    const grouped = new Map<string, {
      productId: string;
      productName: string;
      productImage: string | null;
      itemIds: string[];
      totalQuantity: number;
      flavorEntries: Array<{ id: string; flavor: string | null; quantity: number }>;
    }>();

    waitingListItems.forEach((item) => {
      const existing = grouped.get(item.product_id);

      if (existing) {
        existing.itemIds.push(item.id);
        existing.totalQuantity += item.quantity;
        existing.flavorEntries.push({
          id: item.id,
          flavor: item.flavor,
          quantity: item.quantity,
        });
        return;
      }

      grouped.set(item.product_id, {
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        itemIds: [item.id],
        totalQuantity: item.quantity,
        flavorEntries: [
          {
            id: item.id,
            flavor: item.flavor,
            quantity: item.quantity,
          },
        ],
      });
    });

    return Array.from(grouped.values());
  }, [waitingListItems]);

  const brandGroups = useMemo(() => {
    type Group = {
      key: string;
      brandSlug: string | null;
      brandName: string | null;
      items: typeof groupedWaitingListItems;
    };
    const groups: Group[] = [];
    const idx = new Map<string, number>();
    for (const item of groupedWaitingListItems) {
      const info = priceMap.get(item.productId);
      const slug = info?.brandSlug ?? null;
      const key = slug ?? "__sin_marca__";
      if (!idx.has(key)) {
        idx.set(key, groups.length);
        groups.push({ key, brandSlug: slug, brandName: info?.brandName ?? null, items: [] });
      }
      groups[idx.get(key)!].items.push(item);
    }
    return groups;
  }, [groupedWaitingListItems, priceMap]);

  const displayedProductCount = groupedWaitingListItems.length;
  useEffect(() => {
    void syncPendingOrderPrices();

    return undefined;
  }, [syncPendingOrderPrices]);

  const handleShare = (productId: string, productName: string) => {
    const info = priceMap.get(productId);
    const link = `${window.location.origin}${info ? `/productos/${info.urlSlug}` : ""}`;
    const text = `¡Sumate a la compra colectiva de ${productName}! Seamos más, pagamos menos. ${link}`;
    if (navigator.share) {
      navigator.share({ title: productName, text, url: link });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  const handleShareBrand = (slug: string, name: string) => {
    const link = `${window.location.origin}/marcas/${slug}`;
    const text = `¡Sumate a la colecta de ${name} en Ola! Cuanto más juntamos, más barato pagamos. ${link}`;
    if (navigator.share) {
      navigator.share({ title: name, text, url: link });
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
    if (deleteGroup) {
      for (const itemId of deleteGroup.itemIds) {
        await removeFromWaitingList(itemId);
      }
      setDeleteGroup(null);
    }
  };

  const handleCompletarDatos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/completar-datos-grupo");
    } else {
      navigate("/completar-datos-grupo");
    }
  };

  const handleContinueToCheckout = () => {
    navigate("/finalizar-compra-grupal?from=waiting-list");
  };

  const handleBuyNow = async () => {
    setIsMovingToCart(true);
    try {
      await moveWaitingListToCart();
      navigate("/carrito");
    } catch (error) {
      console.error("Error moving to cart:", error);
      toast.error("Error al mover productos al carrito");
    } finally {
      setIsMovingToCart(false);
    }
  };

  const handleCancelOrder = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/ingresar?redirect=/mis-grupos");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: deleteError } = await supabase
        .from("user_orders")
        .delete()
        .eq("user_id", session.user.id)
        .eq("order_type", "collective")
        .eq("status", "pending");

      if (deleteError) throw deleteError;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
          <div className="container mx-auto max-w-2xl">
            <p className="text-center text-muted-foreground">Cargando mis grupos...</p>
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
              <GroupIcon className="w-6 h-6 text-primary" />
              Mis grupos
              {hasExistingOrder && profileCompleted && !isCollectionEnded && (
                <span className="text-primary text-lg font-medium">— ¡Ya participás! 🎉</span>
              )}
            </h1>
            <p className="text-muted-foreground">
              {displayedProductCount} {displayedProductCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          <CountdownBanner isCollectionEnded={isCollectionEnded} timeLeft={timeLeft} />

          {waitingListItems.length === 0 ? (
            <div className="text-center py-12">
              <GroupIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Todavía no estás en ningún grupo</h2>
              <p className="text-muted-foreground mb-4">
                Agregá productos y esperá para pagar menos
              </p>
              <Button asChild>
                <Link to="/">Explorar productos</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 space-y-4">
                {brandGroups.map((group) => (
                  <div key={group.key} className="rounded-2xl border bg-card px-4 sm:px-5 py-4">
                    {group.brandSlug && (
                      <BrandGroupHeader
                        brandSlug={group.brandSlug}
                        brandName={group.brandName ?? group.brandSlug}
                        onShare={() => handleShareBrand(group.brandSlug!, group.brandName ?? group.brandSlug!)}
                      />
                    )}
                    {group.items.map((item, index) => {
                      const brandInfo = priceMap.get(item.productId);
                      const sourceItem = waitingListItems.find((waitingItem) => waitingItem.product_id === item.productId);
                      const fallbackPrice = sourceItem?.current_price_per_unit || 0;
                      const dynamicPrice = getCurrentPrice(item.productId) || fallbackPrice;
                      return (
                        <div key={item.productId}>
                          <WaitingListProductItem
                            id={item.productId}
                            productName={item.productName}
                            productImage={item.productImage}
                            pricePerUnit={dynamicPrice}
                            totalQuantity={item.totalQuantity}
                            flavorEntries={item.flavorEntries}
                            productLink={brandInfo ? `/productos/${brandInfo.urlSlug}` : ((sourceItem as any)?.product_link || "#")}
                            isCollectionEnded={isCollectionEnded}
                            onQuantityChange={handleQuantityChange}
                            onDelete={() => setDeleteGroup({ productName: item.productName, itemIds: item.itemIds })}
                            onShare={() => handleShare(item.productId, item.productName)}
                          />
                          {index < group.items.length - 1 && <Separator />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <PromoCodeInput
                appliedPromo={appliedPromo}
                onApply={(p) => { setAppliedPromo(p); void syncPendingOrderPrices(); }}
                onRemove={() => { removePromo(); void syncPendingOrderPrices(); }}
              />

              <WaitingListSummary
                isCollectionEnded={isCollectionEnded}
                fullPrice={fullPrice}
                subtotal={subtotal}
                currentDiscount={currentDiscount}
                estimatedTotal={estimatedTotal}
                estimatedDiscount={estimatedDiscount}
                deliveryCost={costFor(subtotal)}
              />

              <WaitingListActions
                isCollectionEnded={isCollectionEnded}
                hasExistingOrder={hasExistingOrder}
                profileCompleted={profileCompleted}
                isSubmitting={isSubmitting}
                isMovingToCart={isMovingToCart}
                buyNowTotal={getBuyNowTotal()}
                onCompletarDatos={handleCompletarDatos}
                onBuyNow={handleBuyNow}
                onContinueToCheckout={handleContinueToCheckout}
                onCancelOrder={handleCancelOrder}
              />
            </>
          )}
        </div>
      </main>

      <ConfirmDeleteDialog
        open={!!deleteGroup}
        onOpenChange={() => setDeleteGroup(null)}
        title="¿Eliminar producto?"
        description={deleteGroup
          ? `¿Estás seguro de que querés eliminar ${deleteGroup.productName} de mis grupos?`
          : "¿Estás seguro de que querés eliminar este producto de mis grupos?"}
        onConfirm={handleDeleteConfirm}
      />

      <FloatingWhatsApp />
    </div>
  );
};

export default WaitingList;
