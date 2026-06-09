import * as amplitude from "@amplitude/analytics-browser";
import { MessageCircle, Instagram, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WA_NUMBER = "5491166650878";
const WA_TEXT = "¡Hola! Quiero acceder a los precios de grupo de Ola.";
const IG_URL = "https://www.instagram.com/ola.unity/";

/**
 * Access-gate body (reused inline on the auth page and inside the dialog).
 * Anonymous visitors get access via our contacts (we register them when they
 * follow us) or through a member's referral link.
 */
export const ContactGateBody = ({ productName = null }: { productName?: string | null }) => {
  const openWhatsApp = () => {
    amplitude.track("Contact Gate Clicked", { method: "whatsapp", product: productName });
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`, "_blank");
  };
  const openInstagram = () => {
    amplitude.track("Contact Gate Clicked", { method: "instagram", product: productName });
    window.open(IG_URL, "_blank");
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground text-left">
        Los precios de grupo (Precio Garantizado y Súper-Precio) son exclusivos para miembros.
        Escribinos y te damos acceso — te registramos cuando nos seguís en redes.
      </p>
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
      <p className="text-xs text-muted-foreground text-center pt-2">
        ¿Tenés el link de invitación de un miembro? Entrá con ese link y te sumás directo.
      </p>
    </div>
  );
};

/** Shown when an anonymous visitor tries to join a group while the curtain is on. */
export const ContactGateDialog = ({
  open,
  onOpenChange,
  productName = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName?: string | null;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Sumate al grupo
          </DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <ContactGateBody productName={productName} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactGateDialog;
