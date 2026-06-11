import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatting";

interface WaitingListSummaryProps {
  isCollectionEnded: boolean;
  fullPrice: number;
  subtotal: number;
  currentDiscount: number;
  estimatedTotal: number;
  estimatedDiscount: number;
  /** Оценка доставки по адресу кабинета (0 = Gratis) */
  deliveryCost?: number;
}

export const WaitingListSummary = ({
  isCollectionEnded,
  fullPrice,
  subtotal,
  currentDiscount,
  estimatedTotal,
  estimatedDiscount,
  deliveryCost = 0,
}: WaitingListSummaryProps) => {
  if (isCollectionEnded) {
    return (
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Precio sin descuento:</span>
          <span className="line-through text-muted-foreground">{formatPrice(fullPrice)}</span>
        </div>
        {currentDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento:</span>
            <span>-{formatPrice(currentDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Envío:</span>
          <span>{deliveryCost === 0 ? "Gratis" : formatPrice(deliveryCost)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold pt-2">
          <span>Total:</span>
          <span>{formatPrice(subtotal + deliveryCost)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precio sin descuento:</span>
        <span className="line-through text-muted-foreground">
          {formatPrice(fullPrice)}
        </span>
      </div>
      {currentDiscount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Descuento actual:</span>
          <span>-{formatPrice(currentDiscount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Envío:</span>
        <span>{deliveryCost === 0 ? "Gratis" : formatPrice(deliveryCost)}</span>
      </div>
      <Separator />
      <div className="flex justify-between text-lg font-bold pt-2">
        <span>Total actual:</span>
        <span>{formatPrice(subtotal + deliveryCost)}</span>
      </div>
      {estimatedTotal < subtotal && (
        <>
          <div className="flex justify-between text-sm text-primary font-medium pt-2">
            <span>Descuento estimado al cierre:</span>
            <span>-{formatPrice(estimatedDiscount)}</span>
          </div>
          <div className="flex justify-between text-sm text-primary font-medium">
            <span>Total estimado al cierre:</span>
            <span>{formatPrice(estimatedTotal)}</span>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground text-center">
        El precio final se calculará al cerrar la compra colectiva el domingo 23:59
      </p>
    </div>
  );
};
