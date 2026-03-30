import { Button } from "@/components/ui/button";
import * as amplitude from "@amplitude/analytics-browser";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Copy, Share2, MessageCircle } from "lucide-react";
import instagramIcon from "@/assets/instagram-icon-new.png";

interface OrderSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  waitForDiscount: boolean;
  orderNumber: number;
  peopleUntilNextDiscount: number;
  maxPrice: string;
}

export const OrderSuccessDialog = ({
  open,
  onOpenChange,
  productName,
  waitForDiscount,
  orderNumber,
  peopleUntilNextDiscount,
  maxPrice,
}: OrderSuccessDialogProps) => {
  const getShareText = () => {
    if (waitForDiscount) {
      const currentUrl = window.location.href;
      return `Che! Mirá esto - compra colectiva de ${productName} 🎉 Seamos más, pagamos menos. Elegí 'Esperar y pagar menos', sumate e invitá amigos!! ${currentUrl}`;
    }
    return `Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/`;
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
        toast.success("¡Compartido exitosamente!");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error("Error al compartir");
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("¡Texto copiado al portapapeles!");
    }
  };

  const handleWhatsAppShare = () => {
    amplitude.track('Whatsapp Opened', { source: 'order_success' });
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyInvitation = () => {
    navigator.clipboard.writeText(getShareText());
    toast.success("¡Invitación copiada!");
  };

  const copyProductLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("¡Enlace copiado!");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl">
            ¡Listo! 🎉
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base pt-1">
            <div className="space-y-2">
              <div>
                Tus datos fueron enviados. Te contactaremos pronto.
              </div>
              {waitForDiscount && (
                <>
                  <div className="text-2xl font-bold text-primary">
                    Sos participante #{orderNumber}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      👥 Faltan {peopleUntilNextDiscount} personas para siguiente descuento
                    </div>
                    <div className="text-muted-foreground">
                      Descuento máximo: {maxPrice} con 100 participantes
                    </div>
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <div className="text-sm font-semibold text-center">
            Invitá a tus amigos
          </div>

          <Button
            onClick={handleNativeShare}
            variant="default"
            className="w-full gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartir con amigos
          </Button>

          <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr] gap-2">
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              className="gap-1 text-[10px] px-1.5"
            >
              <MessageCircle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">WhatsApp</span>
            </Button>

            <Button
              onClick={copyInvitation}
              variant="outline"
              className="gap-1 text-[11px] px-2"
            >
              <Copy className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Copiar invitación</span>
            </Button>

            <Button
              onClick={copyProductLink}
              variant="outline"
              className="gap-1 text-[10px] px-1.5"
            >
              <Copy className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Copiar enlace</span>
            </Button>
          </div>

          <div className="border-t pt-2 mt-1" />

          <a
            href="https://www.instagram.com/ola.unity/"
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-border flex items-center justify-center gap-2 w-full rounded-md py-2.5 px-4 text-sm font-medium"
          >
            <img src={instagramIcon} alt="Instagram" className="h-5 w-5 flex-shrink-0" />
            <span>Seguinos en Instagram</span>
          </a>

          <div className="text-xs text-center text-muted-foreground -mt-1">
            para ofertas, descuentos y novedades
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full mt-2"
          >
            Cerrar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
