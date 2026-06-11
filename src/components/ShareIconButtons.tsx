import * as amplitude from "@amplitude/analytics-browser";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { InstagramStoryShare } from "@/components/InstagramStoryShare";
import { useReferralLink, FALLBACK_LINK } from "@/hooks/useReferralLink";
import instagramIcon from "@/assets/instagram-icon-new.png";

interface ShareIconButtonsProps {
  /** Etiqueta de origen para analytics (Referral Shared → source). */
  source: string;
  /** Mensaje a compartir. Si se omite, se arma con el enlace de referido. */
  shareText?: string;
  /** Enlace de referido explícito. Si se omite, usa el del usuario logueado. */
  refLink?: string;
  /** Muestra además un botón para copiar el enlace de referido. */
  showCopyLink?: boolean;
  className?: string;
}

const defaultText = (link: string) =>
  `Mirá estos descuentos de suplementos 🎉 Sumate a mi grupo en Ola y pagamos todos menos 🤑 ${link}`;

/**
 * Versión compacta (solo íconos) del set de compartir/referir: Instagram story,
 * WhatsApp y compartir nativo. Mismo enlace de referido y analítica que ShareButtons,
 * pensada para ir alineada a la derecha de una línea (p. ej. la barra de marca).
 */
export const ShareIconButtons = ({ source, shareText, refLink, showCopyLink = false, className }: ShareIconButtonsProps) => {
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

  const handleCopyLink = () => {
    amplitude.track("Referral Shared", { method: "copy_link", source });
    navigator.clipboard.writeText(shareLink);
    toast.success("¡Enlace copiado!");
  };

  return (
    <div className={`inline-flex items-center gap-0.5${className ? ` ${className}` : ""}`}>
      <InstagramStoryShare
        refLink={shareLink}
        renderTrigger={(open) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={open}
            aria-label="Compartir en Instagram"
          >
            <img src={instagramIcon} alt="" className="h-[18px] w-[18px]" />
          </Button>
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleWhatsApp}
        aria-label="Compartir por WhatsApp"
      >
        <WhatsAppIcon className="h-[18px] w-[18px] text-[#25D366]" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleNativeShare}
        aria-label="Compartir"
      >
        <ShareIcon className="h-[18px] w-[18px] text-primary" />
      </Button>
      {showCopyLink && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={handleCopyLink}
          aria-label="Copiar enlace"
        >
          <Copy className="h-[18px] w-[18px] text-primary" />
        </Button>
      )}
    </div>
  );
};

export default ShareIconButtons;
