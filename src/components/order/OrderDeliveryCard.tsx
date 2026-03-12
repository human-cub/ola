import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateNatural } from "@/lib/formatting";

interface OrderDeliveryCardProps {
  deliveryAddress: any;
  paymentMethod: string;
  orderType: 'immediate' | 'collective';
  discountPercentage: number;
  collectiveCloseDate: string | null;
}

export const OrderDeliveryCard = ({
  deliveryAddress,
  paymentMethod,
  orderType,
  discountPercentage,
  collectiveCloseDate,
}: OrderDeliveryCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Información de entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {deliveryAddress && (
          <div>
            <span className="text-muted-foreground">Dirección: </span>
            <span>
              {[
                deliveryAddress.street,
                deliveryAddress.number,
                deliveryAddress.floor,
                deliveryAddress.postalCode,
                deliveryAddress.city,
                deliveryAddress.province !== deliveryAddress.city ? deliveryAddress.province : null,
                deliveryAddress.references,
              ].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Forma de pago: </span>
          <span className="capitalize">{paymentMethod}</span>
        </div>
        {orderType === 'collective' && discountPercentage > 0 && (
          <div>
            <span className="text-muted-foreground">Descuento obtenido: </span>
            <span className="text-green-600 font-medium">{discountPercentage}%</span>
          </div>
        )}
        {collectiveCloseDate && (
          <div>
            <span className="text-muted-foreground">Fecha de cierre: </span>
            <span>{formatDateNatural(collectiveCloseDate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
