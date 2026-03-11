import { useState, useEffect } from "react";
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
    waitingListCount,
    isLoading,
    updateWaitingListItemQuantity,
    updateWaitingListItemFlavor,
    removeFromWaitingList,
    clearWaitingList,
    moveWaitingListToCart,
    syncPendingOrderPrices,
  } = useCart();
  const headerVisible = useScrollHeader();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [productFlavors, setProductFlavors] = useState<Record<string, string[]>>({});
  const [productData, setProductData] = useState<Record<string, ProductData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMovingToCart, setIsMovingToCart] = useState(false);

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
  });

  // Fetch flavors and product data
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
    void syncPendingOrderPrices();

    const channel = supabase
      .channel("products-price-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        () => {
          void fetchData();
          void syncPendingOrderPrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    syncPendingOrderPrices,
    waitingListItems.map((i) => `${i.id}:${i.quantity}`).join(","),
  ]);

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
              {waitingListCount} {waitingListCount === 1 ? "producto" : "productos"}
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
                      />
                      {index < waitingListItems.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />

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
        open={!!deleteItemId}
        onOpenChange={() => setDeleteItemId(null)}
        title="¿Eliminar producto?"
        description="¿Estás seguro de que querés eliminar este producto de la lista de espera?"
        onConfirm={handleDeleteConfirm}
      />

      <FloatingWhatsApp />
    </div>
  );
};

export default WaitingList;
