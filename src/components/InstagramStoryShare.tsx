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
// servicio + logos de todas las marcas activas + lugar para el enlace.
const W = 1080;
const H = 1920;

const loadImage = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

interface StoryBrand {
  name: string;
  logo_url: string | null;
}

const drawStory = async (brands: StoryBrand[]): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // Logos en paralelo (los que fallan caen al nombre en texto)
  const logos = await Promise.all(
    brands.map((b) => (b.logo_url ? loadImage(b.logo_url) : Promise.resolve(null))),
  );

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
  ctx.fillText("Ola!", W / 2, 340);
  ctx.font = `700 72px ${sans}`;
  ctx.fillText("Compras Grupales", W / 2, 450);
  ctx.font = `600 52px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText("Seamos más pagamos menos", W / 2, 540);

  // Tarjeta con los logos de TODAS las marcas activas
  const cardX = 70;
  const cardY = 630;
  const cardW = W - 140;
  const cols = brands.length > 9 ? 4 : 3;
  const gap = 18;
  const tileW = (cardW - 56 - gap * (cols - 1)) / cols;
  const tileH = cols === 4 ? 118 : 150;
  const rows = Math.max(1, Math.ceil(brands.length / cols));
  const cardH = 120 + rows * (tileH + gap);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 48);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `700 40px ${sans}`;
  ctx.fillText("Suplementos de las mejores marcas", W / 2, cardY + 76);

  brands.forEach((b, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = cardX + 28 + col * (tileW + gap);
    const y = cardY + 112 + row * (tileH + gap);
    // Tile blanco para que cualquier logo sea legible
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x, y, tileW, tileH, 24);
    ctx.fill();
    const logo = logos[i];
    if (logo) {
      // object-contain con padding
      const pad = 16;
      const maxW = tileW - pad * 2;
      const maxH = tileH - pad * 2;
      const k = Math.min(maxW / logo.width, maxH / logo.height);
      const dw = logo.width * k;
      const dh = logo.height * k;
      ctx.drawImage(logo, x + (tileW - dw) / 2, y + (tileH - dh) / 2, dw, dh);
    } else {
      // Fallback: nombre centrado
      ctx.fillStyle = "hsl(200 60% 25%)";
      const size = b.name.length > 14 ? 28 : 34;
      ctx.font = `700 ${size}px ${sans}`;
      ctx.fillText(b.name, x + tileW / 2, y + tileH / 2 + size / 3, tileW - 24);
    }
  });

  // Píldora blanca: lugar para pegar el sticker de enlace
  const pillY = cardY + cardH + 110;
  const pillW = 560;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(W / 2 - pillW / 2, pillY, pillW, 104, 52);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.font = `600 42px ${sans}`;
  ctx.fillText("Agregá tu enlace", W / 2, pillY + 66);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `600 42px ${sans}`;
  ctx.fillText("Registrate con mi enlace y conseguí", W / 2, pillY + 200);
  ctx.fillText("el Súper-Precio en tu primer pedido", W / 2, pillY + 260);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"),
  );
};

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
      const active = brands
        .filter((b) => b.is_active)
        .map((b) => ({ name: b.name, logo_url: b.logo_url }));
      const blob = await drawStory(active);
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
        className="h-10 w-full max-w-[400px] mx-auto"
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
