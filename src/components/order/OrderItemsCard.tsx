import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/formatting";

interface OrderItem {
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
}

interface OrderItemsCardProps {
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  deliveryCost: number;
  totalAmount: number;
  isPromo: boolean;
}

export const OrderItemsCard = ({
  items,
  subtotal,
  discountAmount,
  deliveryCost,
  totalAmount,
  isPromo,
}: OrderItemsCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Productos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4">
            {item.product_image && (
              <img
                src={item.product_image}
                alt={item.product_name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{item.product_name}</p>
              {item.flavor && <p className="text-sm text-muted-foreground">{item.flavor}</p>}
              <div className="flex justify-between mt-1">
                <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                <span className="font-medium">{formatPrice(item.price_per_unit * item.quantity)}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="border-t pt-4 space-y-2">
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio sin descuento:</span>
              <span className="line-through text-muted-foreground">{formatPrice(subtotal + discountAmount)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{isPromo ? 'Descuento (PROMO):' : 'Descuento:'}</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío:</span>
            <span>{deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
