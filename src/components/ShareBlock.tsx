import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import * as amplitude from "@amplitude/analytics-browser";
import instagramIcon from '../assets/instagram-icon-new.png';
import { ShareIcon } from './icons/ShareIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Button } from './ui/button';
import { GradientBorderButton } from './ui/gradient-border-button';

const SHARE_TEXT = 'Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://alaola.com.ar/';
const SHARE_URL = 'https://alaola.com.ar/';

interface ShareBlockProps {
  showQR?: boolean;
}

export const ShareBlock = ({ showQR = false }: ShareBlockProps) => {
  const handleShare = () => {
    amplitude.track('Referral Shared', { method: 'native' });
    if (navigator.share) {
      navigator.share({ text: SHARE_TEXT }).catch(() => {});
    } else {
      navigator.clipboard.writeText(SHARE_TEXT);
      toast.success("¡Texto copiado!");
    }
  };

  const handleWhatsApp = () => {
    amplitude.track('Referral Shared', { method: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`, '_blank');
  };

  const handleCopyInvitation = () => {
    amplitude.track('Referral Shared', { method: 'copy_invitation' });
    navigator.clipboard.writeText(SHARE_TEXT);
    toast.success("¡Invitación copiada!");
  };

  const handleCopyLink = () => {
    amplitude.track('Share', { method: 'copy_link' });
    navigator.clipboard.writeText(SHARE_URL);
    toast.success("¡Enlace copiado!");
  };

  return (
    <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
      <p className="text-sm font-semibold text-primary text-center mb-1">
        ¡Seamos más pagamos menos!
      </p>
      <p className="text-sm text-center text-muted-foreground mb-4">
        Vamos a conseguir el mejor descuento — compartilo con tus amigos.
      </p>

      <div className="flex flex-col gap-2">
        <Button onClick={handleShare} className="w-full py-2.5">
          <ShareIcon className="size-5" />
          <span>Compartir con amigos</span>
        </Button>

        <Button variant="outline" onClick={handleWhatsApp} className="w-full py-2.5">
          <WhatsAppIcon className="size-5" />
          <span>Compartir por WhatsApp</span>
        </Button>

        <Button variant="outline" onClick={handleCopyInvitation} className="w-full py-2.5">
          <Copy className="size-5" />
          <span>Copiar invitación</span>
        </Button>

        <Button variant="outline" onClick={handleCopyLink} className="w-full py-2.5">
          <Copy className="size-5" />
          <span>Copiar enlace</span>
        </Button>

        <div className="border-t border-border/50 pt-2 mt-2" />

        <GradientBorderButton
          asChild
          gradient="linear-gradient(to right, #f09433, #dc2743, #bc1888)"
          glowColor="rgba(189, 23, 136, 0.5)"
          className="h-10 w-full max-w-[400px] mx-auto"
        >
          <a
            href="https://www.instagram.com/ola.unity/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={instagramIcon}
              alt="Instagram"
              className="h-5 w-5 flex-shrink-0"
            />
            <span className="whitespace-nowrap">Seguinos en Instagram</span>
          </a>
        </GradientBorderButton>

        <p className="text-xs text-center text-muted-foreground mb-2">
          para ofertas, descuentos y novedades
        </p>

        {showQR && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-[180px] h-[180px] aspect-square flex items-center justify-center">
              <img
                src="/qr-code-v2.png"
                alt="QR Code"
                className="w-full h-full object-contain hover:opacity-90 transition-opacity rounded-lg border-2 border-primary/30 hover:border-primary/50"
              />
            </div>
            <p className="text-sm font-semibold text-primary">
              Sumáte{' '}
              <a
                href="https://alaola.com.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline transition-colors"
              >
                alaola.com.ar
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
