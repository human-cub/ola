import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ShoppingCart, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatting";
import instagramIcon from "@/assets/instagram-icon-new.png";

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
        <Button onClick={onContinueToCheckout} className="w-full gap-2" size="lg">
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
        onClick={onCompletarDatos}
        className={`w-full gap-2 ${hasExistingOrder && profileCompleted ? "bg-white text-primary hover:bg-white/90 border border-primary" : ""}`}
        size="lg"
        variant={hasExistingOrder && profileCompleted ? "outline" : "default"}
      >
        <Check className="w-4 h-4" />
        {hasExistingOrder && profileCompleted ? "¡Ya participás! 🎉 / Editar datos" : "Completar información"}
      </Button>

      <Button
        onClick={onBuyNow}
        variant="outline"
        className="w-full gap-2"
        size="lg"
        disabled={isMovingToCart}
      >
        <ShoppingCart className="w-4 h-4" />
        {isMovingToCart ? "Moviendo al carrito..." : `Comprar ahora ${formatPrice(buyNowTotal)}`}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Tu lista se guardará hasta que se cierre la compra colectiva el domingo a las 23:59
      </p>

      <Separator className="my-4" />
      <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
        <p className="text-sm font-semibold text-primary text-center mb-1">
          ¡Seamos más pagamos menos!
        </p>
        <p className="text-sm text-center text-muted-foreground mb-4">
          Vamos a conseguir el mejor descuento — compartilo con tus amigos.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              const text = 'Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/';
              if (navigator.share) {
                navigator.share({ text }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text);
                toast.success("¡Texto copiado!");
              }
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <Share2 className="h-4 w-4 flex-shrink-0" />
            <span>Compartir con amigos</span>
          </button>

          <button
            onClick={() => {
              const text = encodeURIComponent('Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/');
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/>
            </svg>
            <span>Compartir por WhatsApp</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText('Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/');
              toast.success("¡Invitación copiada!");
            }}
            className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copiar invitación</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText('https://alaola.com.ar/');
              toast.success("¡Enlace copiado!");
            }}
            className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copiar enlace</span>
          </button>

          <div className="border-t border-border/50 pt-2 mt-2" />

          <a
            href="https://www.instagram.com/ola.unity/"
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-border flex items-center justify-center gap-2 w-full rounded-md py-2.5 px-4 text-sm font-medium"
          >
            <img src={instagramIcon} alt="Instagram" className="h-5 w-5 flex-shrink-0" />
            <span>Seguinos en Instagram</span>
          </a>

          <p className="text-xs text-center text-muted-foreground">
            para ofertas, descuentos y novedades
          </p>
        </div>
      </div>
    </div>
  );
};
