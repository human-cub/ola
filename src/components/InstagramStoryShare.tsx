import * as amplitude from "@amplitude/analytics-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export const InstagramStoryShare = ({ refLink }: Props) => {
  const { data: brands = [] } = useBrands();

  const handleClick = async () => {
    amplitude.track("Referral Shared", { method: "instagram_story" });
    try {
      const brandNames = brands.filter((b) => b.is_active).map((b) => b.name);
      const blob = await drawStory(refLink, brandNames);
      const file = new File([blob], "ola-story.png", { type: "image/png" });
      // El enlace va al portapapeles para pegarlo como sticker en la historia
      await navigator.clipboard.writeText(refLink).catch(() => {});
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          toast.success("Enlace copiado — pegalo como sticker y etiquetá a @ola.unity");
          return;
        } catch {
          /* cancelado: cae al download */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ola-story.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Imagen descargada y enlace copiado — subila a tu historia y etiquetá a @ola.unity");
    } catch {
      toast.error("No pudimos generar la imagen");
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} className="w-full py-2.5">
      <img src={instagramIcon} alt="" className="h-4 w-4" />
      <span>Compartir historia en Instagram</span>
    </Button>
  );
};

export default InstagramStoryShare;
