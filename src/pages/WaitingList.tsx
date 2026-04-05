import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Timer, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { WaitingListProductItem } from "@/components/WaitingListProductItem";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useCollectiveCountdown } from "@/hooks/useCollectiveCountdown";
import { usePendingOrder } from "@/hooks/usePendingOrder";
import { useWaitingListPricing } from "@/hooks/useWaitingListPricing";
import { CountdownBanner } from "@/components/waiting-list/CountdownBanner";
import { WaitingListSummary } from "@/components/waiting-list/WaitingListSummary";
import { WaitingListActions } from "@/components/waiting-list/WaitingListActions";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";
import { usePromoCode } from "@/hooks/usePromoCode";
import type { PriceData } from "@/lib/types";

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
    isLoading,
    updateWaitingListItemQuantity,
    removeFromWaitingList,
    clearWaitingList,
    moveWaitingListToCart,
    syncPendingOrderPrices,
  } = useCart();
  const headerVisible = useScrollHeader();
  const [deleteGroup, setDeleteGroup] = useState<{ productName: string; itemIds: string[] } | null>(null);
  const [productData, setProductData] = useState<Record<string, ProductData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMovingToCart, setIsMovingToCart] = useState(false);
  const { appliedPromo, setAppliedPromo, removePromo } = usePromoCode();

  const { hasExistingOrder, profileCompleted, pendingOrderCreatedAt, collectiveCloseDate, frozenOrderData } =
    usePendingOrder(waitingListItems);

  const { timeLeft, isCollectionEnded } =
    useCollectiveCountdown(pendingOrderCreatedAt, collectiveCloseDate);

  const {
    getNextDiscountThreshold,
    getParticipantsCount,
    getCurrentPrice,
    getBuyNowTotal,
    subtotal,
    fullPrice,
    estimatedTotal,
    currentDiscount,
    estimatedDiscount,
  } = useWaitingListPricing({
    waitingListItems,
    productData,
    isCollectionEnded,
    hasExistingOrder,
    frozenOrderData,
    promoTierBonus: appliedPromo?.tier_bonus ?? 0,
  });

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

  const displayedProductCount = groupedWaitingListItems.length;
  const productIds = useMemo(
    () => [...new Set(waitingListItems.map((item) => item.product_id))],
    [waitingListItems]
  );
  const productIdsKey = useMemo(() => productIds.slice().sort().join(","), [productIds]);

  const fetchProductData = useCallback(async () => {
    if (productIds.length === 0) {
      setProductData({});
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("id, link, total_orders_count, prices")
      .in("id", productIds);

    if (data) {
      const prodDataMap: Record<string, ProductData> = {};

      data.forEach((p) => {
        prodDataMap[p.id] = {
          id: p.id,
          link: p.link || "",
          total_orders_count: p.total_orders_count || 0,
          prices: (p.prices as unknown as PriceData[]) || [],
        };
      });

      setProductData(prodDataMap);
    }
  }, [productIds]);

  // Fetch product data
  useEffect(() => {
    void fetchProductData();
  }, [fetchProductData, productIdsKey]);

  useEffect(() => {
    void syncPendingOrderPrices();

    return undefined;
  }, [syncPendingOrderPrices]);

  useEffect(() => {
    const channel = supabase
      .channel("products-price-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        () => {
          void fetchProductData();
          void syncPendingOrderPrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProductData, syncPendingOrderPrices]);

  const handleShare = (productId: string, productName: string) => {
    const prod = productData[productId];
    if (!prod) return;
    const link = `${window.location.origin}${prod.link}`;
    const text = `¡Sumate a la compra colectiva de ${productName}! Seamos más, pagamos menos. ${link}`;
    if (navigator.share) {
      navigator.share({ title: productName, text, url: link });
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
      navigate("/ingresar?redirect=/completar-datos-colectiva");
    } else {
      navigate("/completar-datos-colectiva");
    }
  };

  const handleContinueToCheckout = () => {
    navigate("/checkout-colectivo?from=waiting-list");
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
      navigate("/ingresar?redirect=/lista-espera");
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
              {displayedProductCount} {displayedProductCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          <CountdownBanner isCollectionEnded={isCollectionEnded} timeLeft={timeLeft} />

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
              <div className="space-y-0 mb-6">
                {groupedWaitingListItems.map((item, index) => {
                  const prod = productData[item.productId];
                  const participantCount = getParticipantsCount(item.productId, item.totalQuantity);
                  const nextThreshold = getNextDiscountThreshold(item.productId, item.totalQuantity);
                  const fallbackPrice = waitingListItems.find((waitingItem) => waitingItem.product_id === item.productId)?.current_price_per_unit || 0;
                  const dynamicPrice = getCurrentPrice(item.productId, item.totalQuantity) || fallbackPrice;
                  const maxParticipants = prod?.prices?.length ? prod.prices[prod.prices.length - 1].people : 100;

                  return (
                    <div key={item.productId}>
                      <WaitingListProductItem
                        id={item.productId}
                        productName={item.productName}
                        productImage={item.productImage}
                        pricePerUnit={dynamicPrice}
                        totalQuantity={item.totalQuantity}
                        flavorEntries={item.flavorEntries}
                        productLink={prod?.link || "#"}
                        participantCount={participantCount}
                        maxParticipants={maxParticipants}
                        nextThreshold={nextThreshold}
                        isCollectionEnded={isCollectionEnded}
                        onQuantityChange={handleQuantityChange}
                        onDelete={() => setDeleteGroup({ productName: item.productName, itemIds: item.itemIds })}
                        onShare={() => handleShare(item.productId, item.productName)}
                      />
                      {index < groupedWaitingListItems.length - 1 && <Separator />}
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

              <WaitingListSummary
                isCollectionEnded={isCollectionEnded}
                fullPrice={fullPrice}
                subtotal={subtotal}
                currentDiscount={currentDiscount}
                estimatedTotal={estimatedTotal}
                estimatedDiscount={estimatedDiscount}
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
          ? `¿Estás seguro de que querés eliminar ${deleteGroup.productName} de la lista de espera?`
          : "¿Estás seguro de que querés eliminar este producto de la lista de espera?"}
        onConfirm={handleDeleteConfirm}
      />

      <FloatingWhatsApp />
    </div>
  );
};

export default WaitingList;
