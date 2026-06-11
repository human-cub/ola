import * as amplitude from "@amplitude/analytics-browser";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { InstagramStoryShare } from "@/components/InstagramStoryShare";
import { useReferralLink, FALLBACK_LINK } from "@/hooks/useReferralLink";

interface ShareButtonsProps {
  /** Etiqueta de origen para analytics (Referral Shared → source). */
  source: string;
  /** Mensaje a compartir. Si se omite, se arma con el enlace de referido. */
  shareText?: string;
  /** Enlace de referido explícito. Si se omite, usa el del usuario logueado. */
  refLink?: string;
  className?: string;
}

const defaultText = (link: string) =>
  `Ola! Compras Grupales. Sumate a una compra grupal con mi enlace y conseguí el Súper-Precio. ${link}`;

/**
 * Bloque reutilizable de botones para compartir / referir. Mismo set en todos
 * lados: inicio, Mi cuenta, Mis grupos, detalle de pedido y popups de éxito.
 * Para usuarios logueados usa su enlace de referido automáticamente.
 */
export const ShareButtons = ({ source, shareText, refLink, className }: ShareButtonsProps) => {
  const { data: ownLink } = useReferralLink();
  const shareLink = refLink ?? ownLink ?? FALLBACK_LINK;
  const text = shareText ?? defaultText(shareLink);

  const handleNativeShare = () => {
    amplitude.track("Referral Shared", { method: "native", source });
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("¡Texto copiado!");
    }
  };

  const handleWhatsApp = () => {
    amplitude.track("Referral Shared", { method: "whatsapp", source });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyInvitation = () => {
    amplitude.track("Referral Shared", { method: "copy_invitation", source });
    navigator.clipboard.writeText(text);
    toast.success("¡Invitación copiada!");
  };

  const handleCopyLink = () => {
    amplitude.track("Referral Shared", { method: "copy_link", source });
    navigator.clipboard.writeText(shareLink);
    toast.success("¡Enlace copiado!");
  };

  return (
    <div className={`flex flex-col gap-2${className ? ` ${className}` : ""}`}>
      <Button onClick={handleNativeShare} className="w-full py-2.5">
        <ShareIcon className="h-5 w-5 shrink-0" />
        <span>Compartir con amigos</span>
      </Button>

      <InstagramStoryShare refLink={shareLink} />

      <Button
        variant="outline"
        onClick={handleWhatsApp}
        className="w-full py-2.5 border-2 border-[#25D366] hover:bg-[#25D366]/10"
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0 text-[#25D366]" />
        <span>Compartir por WhatsApp</span>
      </Button>

      <Button variant="outline" onClick={handleCopyInvitation} className="w-full py-2.5">
        <Copy className="h-5 w-5 shrink-0" />
        <span>Copiar invitación</span>
      </Button>

      <Button variant="outline" onClick={handleCopyLink} className="w-full py-2.5">
        <Copy className="h-5 w-5 shrink-0" />
        <span>Copiar enlace</span>
      </Button>
    </div>
  );
};

export default ShareButtons;
