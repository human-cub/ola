import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Share2, MessageCircle, FileText } from "lucide-react";
import { toast } from "sonner";
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

const SHARE_TEXT = 'Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/';

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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: SHARE_TEXT });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(SHARE_TEXT);
          toast.success("¡Texto copiado!");
        }
      }
    } else {
      navigator.clipboard.writeText(SHARE_TEXT);
      toast.success("¡Texto copiado!");
    }
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`, '_blank');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            ¡Pedido confirmado!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <p>Tu pedido ha sido registrado exitosamente</p>
            <p className="text-xl font-bold text-foreground">Pedido #{orderNumber}</p>
            <p className="text-sm">
              Nos pondremos en contacto en las próximas horas para confirmar los detalles.
            </p>

            <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Forma de pago:</span>
                <span className="capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Dirección:</span>
                <span className="text-right text-xs">{addressSummary}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="font-semibold mb-3">¡Comparte con tus amigos!</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={handleNativeShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Compartir
                </Button>
                <Button variant="outline" size="sm" onClick={handleWhatsAppShare}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 pt-4">
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
