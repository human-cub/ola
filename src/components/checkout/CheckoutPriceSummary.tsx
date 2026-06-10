import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatting";

interface CheckoutPriceSummaryProps {
  fullPrice: number;
  discount: number;
  subtotal: number;
  deliveryCost: number;
  total: number;
  /** Descuento por redondeo de pago en efectivo, ya restado de `total`. */
  cashDiscount?: number;
}

export const CheckoutPriceSummary = ({
  fullPrice,
  discount,
  subtotal,
  deliveryCost,
  total,
  cashDiscount = 0,
}: CheckoutPriceSummaryProps) => {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precio sin descuento:</span>
        <span className="line-through text-muted-foreground">{formatPrice(fullPrice)}</span>
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
      {cashDiscount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Redondeo por pago en efectivo:</span>
          <span>-{formatPrice(cashDiscount)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between text-xl font-bold pt-2">
        <span>TOTAL:</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
};
