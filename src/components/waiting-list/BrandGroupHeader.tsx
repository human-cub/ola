import { useBrandProgress } from "@/components/BrandProgressBar";
import { formatPrice } from "@/lib/formatting";

interface Props {
  brandSlug: string;
  brandName: string;
}

/**
 * Шапка бренд-блока в листе ожидания: имя марки и общий прогресс-бар сбора
 * на одной строке; ниже — «Faltan $X para Súper-Precio» + призыв поделиться.
 */
export const BrandGroupHeader = ({ brandSlug, brandName }: Props) => {
  const { collected, target, pct, reached } = useBrandProgress(brandSlug);
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-base font-bold uppercase tracking-wider text-primary whitespace-nowrap">
          {brandName}
        </h2>
        {target > 0 && (
          <div className="relative h-3.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, hsl(36 100% 50%), hsl(var(--group-buy-accent)), hsl(48 100% 60%))",
              }}
            />
          </div>
        )}
      </div>
      {target > 0 &&
        (reached ? (
          <p className="text-sm font-bold text-primary">
            ¡Meta alcanzada! Súper-Precio activo
          </p>
        ) : (
          <div className="leading-snug">
            <p className="text-sm font-semibold text-foreground">
              Faltan{" "}
              <span className="font-extrabold text-primary">
                {formatPrice(target - collected)}
              </span>{" "}
              para Súper-Precio
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "hsl(var(--group-buy-accent-foreground))" }}
            >
              Compartí y llevate un descuento
            </p>
          </div>
        ))}
    </div>
  );
};
