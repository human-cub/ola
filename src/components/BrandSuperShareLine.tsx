import { useBrandProgress } from "@/components/BrandProgressBar";
import { ShareIconButtons } from "@/components/ShareIconButtons";
import { formatPrice } from "@/lib/formatting";

interface Props {
  brandSlug: string;
  source: string;
  className?: string;
}

/**
 * Línea «Faltan $X. Compartí y llevate el Súper-Precio» + botones de compartir
 * (Instagram / WhatsApp / compartir / copiar enlace), igual que en Mis grupos.
 * No renderiza nada si la marca no tiene meta de colecta.
 */
export const BrandSuperShareLine = ({ brandSlug, source, className = "" }: Props) => {
  const { collected, target, reached } = useBrandProgress(brandSlug);
  if (target <= 0) return null;
  return (
    <div className={className}>
      {reached ? (
        <p className="text-sm font-bold text-primary leading-snug text-center">
          ¡Meta alcanzada! Súper-Precio activo
        </p>
      ) : (
        <p className="text-sm leading-snug text-center">
          <span className="text-foreground">
            Faltan{" "}
            <span style={{ color: "hsl(var(--group-buy-accent))" }}>
              {formatPrice(target - collected)}
            </span>
            .
          </span>{" "}
          <span
            className="font-semibold animate-shimmer"
            style={{
              backgroundImage:
                "linear-gradient(90deg, hsl(42 100% 28%), hsl(45 95% 55%), hsl(42 100% 28%))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              animationDuration: "4s",
            }}
          >
            Compartí y llevate el Súper-Precio
          </span>
        </p>
      )}
      <div className="flex justify-center mt-1.5">
        <ShareIconButtons source={source} showCopyLink />
      </div>
    </div>
  );
};

export default BrandSuperShareLine;
