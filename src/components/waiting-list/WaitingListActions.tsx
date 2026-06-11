import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ShoppingCart, Check } from "lucide-react";
import { formatPrice } from "@/lib/formatting";
import { ShareBlock } from "@/components/ShareBlock";
import * as amplitude from "@amplitude/analytics-browser";

interface WaitingListActionsProps {
  isCollectionEnded: boolean;
  hasExistingOrder: boolean;
  profileCompleted: boolean;
  isSubmitting: boolean;
  isMovingToCart: boolean;
  buyNowTotal: number;
  onCompletarDatos: () => void;
  onBuyNow: () => void;
  onContinueToCheckout: () => void;
  onCancelOrder: () => void;
}

export const WaitingListActions = ({
  isCollectionEnded,
  hasExistingOrder,
  profileCompleted,
  isSubmitting,
  isMovingToCart,
  buyNowTotal,
  onCompletarDatos,
  onBuyNow,
  onContinueToCheckout,
  onCancelOrder,
}: WaitingListActionsProps) => {
  if (isCollectionEnded) {
    return (
      <div className="flex flex-col gap-3">
        <Button onClick={() => { amplitude.track('CTA Clicked', { button_label: 'Continuar con la compra', source: 'waiting_list' }); onContinueToCheckout(); }} className="w-full gap-2" size="lg">
          <ArrowRight className="w-4 h-4" />
          Continuar con la compra
        </Button>
        <Button
          onClick={onCancelOrder}
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Cancelando..." : "Cancelar el pedido"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={() => { amplitude.track('CTA Clicked', { button_label: 'Completar información', has_existing_order: hasExistingOrder, profile_completed: profileCompleted }); onCompletarDatos(); }}
        className={`w-full gap-2 ${hasExistingOrder && profileCompleted ? "bg-white text-primary hover:bg-white/90 border border-primary" : ""}`}
        size="lg"
        variant={hasExistingOrder && profileCompleted ? "outline" : "default"}
      >
        <Check className="w-4 h-4" />
        {hasExistingOrder && profileCompleted ? "¡Ya participás! 🎉 / Editar datos" : "Completar información"}
      </Button>

      <Button
        onClick={() => { amplitude.track('CTA Clicked', { button_label: 'Comprar ahora', source: 'waiting_list', total: buyNowTotal }); onBuyNow(); }}
        variant="outline"
        className="w-full gap-2"
        size="lg"
        disabled={isMovingToCart}
      >
        <ShoppingCart className="w-4 h-4" />
        {isMovingToCart ? "Moviendo al carrito..." : `Comprar ahora ${formatPrice(buyNowTotal)}`}
      </Button>

      <Separator className="my-4" />
      <ShareBlock />
    </div>
  );
};
