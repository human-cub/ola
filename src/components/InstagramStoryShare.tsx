import { useEffect, useState } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GradientBorderButton } from "@/components/ui/gradient-border-button";
import instagramIcon from "../assets/instagram-icon-new.png";
import { useBrands } from "@/hooks/useBrands";

// Plantilla de historia de Instagram (1080x1920) generada en canvas:
// servicio + marcas + enlace de referido (los clics se trackean al abrirlo
// con ?ref=) + recordatorio de etiquetar @ola.unity.
const W = 1080;
const H = 1920;

const drawStory = (refLink: string, brandNames: string[]): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("canvas"));

    // Fondo: gradiente primario del sitio
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "hsl(190 100% 45%)");
    bg.addColorStop(1, "hsl(210 100% 60%)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Burbujas decorativas suaves
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    [[140, 260, 180], [950, 480, 140], [120, 1500, 160], [980, 1680, 200]].forEach(
      ([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      },
    );

    ctx.textAlign = "center";
    const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    // Marca del servicio
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 170px ${sans}`;
    ctx.fillText("Ola!", W / 2, 360);
    ctx.font = `700 72px ${sans}`;
    ctx.fillText("Compras Grupales", W / 2, 470);
    ctx.font = `600 52px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText("Seamos más pagamos menos", W / 2, 560);

    // Tarjeta de marcas
    const cardX = 90;
    const cardY = 660;
    const cardW = W - 180;
    const names = brandNames.slice(0, 8);
    const rows = Math.ceil(names.length / 2);
    const cardH = 150 + rows * 86;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 48);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 40px ${sans}`;
    ctx.fillText("Suplementos de las mejores marcas", W / 2, cardY + 86);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 44px ${sans}`;
    names.forEach((n, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? W / 2 - 230 : W / 2 + 230;
      ctx.fillText(n, x, cardY + 170 + row * 86);
    });

    // Enlace de referido en una píldora blanca
    const linkLabel = refLink.replace(/^https?:\/\//, "");
    const pillY = cardY + cardH + 130;
    ctx.font = `700 46px ${sans}`;
    const tw = ctx.measureText(linkLabel).width;
    const pillW = Math.min(W - 140, tw + 120);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(W / 2 - pillW / 2, pillY, pillW, 104, 52);
    ctx.fill();
    ctx.fillStyle = "hsl(200 100% 35%)";
    ctx.fillText(linkLabel, W / 2, pillY + 68);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `600 42px ${sans}`;
    ctx.fillText("Registrate con mi enlace y conseguí", W / 2, pillY + 200);
    ctx.fillText("el Súper-Precio en tu primer pedido", W / 2, pillY + 260);

    // Pie: etiquetar la cuenta
    ctx.font = `700 52px ${sans}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Etiquetanos  👉  @ola.unity", W / 2, H - 170);

    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png");
  });

interface Props {
  refLink: string;
}

const IG_GRADIENT = "linear-gradient(to right, #f09433, #dc2743, #bc1888)";
const IG_GLOW = "rgba(189, 23, 136, 0.5)";

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
      {n}
    </span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export const InstagramStoryShare = ({ refLink }: Props) => {
  const { data: brands = [] } = useBrands();
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  // liberar el object URL al cerrar
  useEffect(() => {
    if (!open && imgUrl) {
      const t = setTimeout(() => {
        URL.revokeObjectURL(imgUrl);
        setImgUrl(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, imgUrl]);

  const handleOpen = async () => {
    amplitude.track("Referral Shared", { method: "instagram_story" });
    try {
      const brandNames = brands.filter((b) => b.is_active).map((b) => b.name);
      const blob = await drawStory(refLink, brandNames);
      setImgUrl(URL.createObjectURL(blob));
      setOpen(true);
    } catch {
      toast.error("No pudimos generar la imagen");
    }
  };

  const handleDownload = () => {
    if (!imgUrl) return;
    amplitude.track("Referral Shared", { method: "instagram_story_download" });
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "ola-story.png";
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("¡Enlace copiado!");
  };

  return (
    <>
      <GradientBorderButton
        gradient={IG_GRADIENT}
        glowColor={IG_GLOW}
        className="h-10 w-full"
        onClick={handleOpen}
      >
        <img src={instagramIcon} alt="" className="h-5 w-5 flex-shrink-0" />
        <span className="whitespace-nowrap">Compartir en Instagram</span>
      </GradientBorderButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={instagramIcon} alt="" className="h-5 w-5" />
              Compartir en Instagram
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 items-start">
            {/* Vista previa de la plantilla */}
            {imgUrl && (
              <img
                src={imgUrl}
                alt="Plantilla de historia"
                className="w-28 sm:w-32 rounded-xl border border-border shadow-md shrink-0"
              />
            )}

            <div className="flex-1 min-w-0 space-y-4 pt-1">
              <Step n={1}>
                <GradientBorderButton
                  gradient={IG_GRADIENT}
                  glowColor={IG_GLOW}
                  className="h-9 w-full text-sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Descargar plantilla</span>
                </GradientBorderButton>
              </Step>

              <Step n={2}>
                <p className="text-sm leading-snug pt-1">
                  Subila a tu historia y etiquetá a{" "}
                  <a
                    href="https://www.instagram.com/ola.unity/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary"
                  >
                    @ola.unity
                  </a>
                </p>
              </Step>

              <Step n={3}>
                <p className="text-sm leading-snug mb-1.5">Agregá tu enlace:</p>
                <div className="flex items-center gap-1.5 bg-muted rounded-lg border border-border pl-2.5 pr-1 py-1">
                  <span className="text-xs text-foreground/80 truncate flex-1 font-mono">
                    {refLink.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    type="button"
                    aria-label="Copiar enlace"
                    onClick={handleCopyLink}
                    className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center text-muted-foreground shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Step>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstagramStoryShare;
