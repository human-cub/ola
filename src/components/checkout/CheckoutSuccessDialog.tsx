import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, FileText } from "lucide-react";
import { ShareIconButtons } from "@/components/ShareIconButtons";
import { formatPrice } from "@/lib/formatting";

interface CheckoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  orderId: string;
  total: number;
  paymentMethod: string;
  addressSummary: string;
}

export const CheckoutSuccessDialog = ({
  open,
  onOpenChange,
  orderNumber,
  orderId,
  total,
  paymentMethod,
  addressSummary,
}: CheckoutSuccessDialogProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            ¡Pedido confirmado!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <span className="block">Tu pedido ha sido registrado exitosamente</span>
            <span className="block text-xl font-bold text-foreground">Pedido #{orderNumber}</span>
            <span className="block text-sm">
              Nos pondremos en contacto en las próximas horas para confirmar los detalles.
            </span>

            <span className="block bg-muted rounded-lg p-4 text-left text-sm space-y-1">
              <span className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </span>
              <span className="flex justify-between">
                <span>Forma de pago:</span>
                <span className="capitalize">{paymentMethod}</span>
              </span>
              <span className="flex justify-between">
                <span>Dirección:</span>
                <span className="text-right text-xs">{addressSummary}</span>
              </span>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Compartir / referir: set completo, igual que en el resto del sitio */}
        <div className="rounded-xl bg-gradient-primary/10 border border-primary/20 p-4">
          <p className="text-sm font-semibold text-primary text-center mb-1">
            ¡Seguí ahorrando!
          </p>
          <p className="text-sm text-center text-muted-foreground mb-3">
            Compartí Ola con tus amigos y obtené un descuento en tu próximo pedido 🎉
          </p>
          <div className="flex justify-center">
            <ShareIconButtons source="checkout_success" showCopyLink />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => navigate(`/mi-cuenta/pedidos/${orderId}`)} className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Ver comprobante
          </Button>
          <Button variant="outline" onClick={() => navigate("/mi-cuenta")} className="w-full">
            Ir a Mis Pedidos
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
