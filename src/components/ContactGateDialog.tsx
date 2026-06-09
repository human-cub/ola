import * as amplitude from "@amplitude/analytics-browser";
import { MessageCircle, Instagram, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const WA_NUMBER = "5491166650878";
const WA_TEXT = "¡Hola! Quiero acceder a los precios de grupo de Ola.";
const IG_URL = "https://www.instagram.com/ola.unity/";

/**
 * Shown when an anonymous visitor tries to join a group while the price curtain
 * is on. Instead of the waiting-list flow, we route them to our contacts:
 * they get access (we register them) when they reach out / follow us, or they
 * can enter through a member's referral link.
 */
export const ContactGateDialog = ({
  open,
  onOpenChange,
  productName = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName?: string | null;
}) => {
  const openWhatsApp = () => {
    amplitude.track("Contact Gate Clicked", { method: "whatsapp", product: productName });
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`, "_blank");
  };
  const openInstagram = () => {
    amplitude.track("Contact Gate Clicked", { method: "instagram", product: productName });
    window.open(IG_URL, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Sumate al grupo
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Los precios de grupo (Precio Garantizado y Súper-Precio) son exclusivos para miembros.
            Escribinos y te damos acceso — te registramos cuando nos seguís en redes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={openWhatsApp}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] transition active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            Escribinos por WhatsApp
          </button>
          <button
            onClick={openInstagram}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] transition active:scale-95"
          >
            <Instagram className="w-5 h-5" />
            Seguinos en Instagram
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-3">
          ¿Tenés el link de invitación de un miembro? Entrá con ese link y te sumás directo.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ContactGateDialog;
