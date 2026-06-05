import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatting";

interface CartSummaryProps {
  fullPrice: number;
  discount: number;
  subtotal: number;
  /** Оценка доставки по адресу кабинета (0 = Gratis) */
  deliveryCost?: number;
}

export const CartSummary = ({ fullPrice, discount, subtotal, deliveryCost = 0 }: CartSummaryProps) => {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precio sin descuento:</span>
        <span className="line-through text-muted-foreground">
          {formatPrice(fullPrice)}
        </span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Descuento:</span>
          <span>-{formatPrice(discount)}</span>
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
      {discount > 0 && (
        <p className="text-sm text-green-600 text-center font-medium">
          ¡Ahorraste {formatPrice(discount)} pesos!
        </p>
      )}
    </div>
  );
};
