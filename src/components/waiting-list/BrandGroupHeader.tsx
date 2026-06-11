import { useBrandProgress } from "@/components/BrandProgressBar";
import { ShareIconButtons } from "@/components/ShareIconButtons";
import { formatPrice } from "@/lib/formatting";

interface Props {
  brandSlug: string;
  brandName: string;
}

/**
 * Шапка бренд-блока в листе ожидания: имя марки и прогресс-бар сбора на одной
 * строке; ниже — «Faltan $X para Súper-Precio. Compartí y llevate un descuento»
 * в одну строку с кнопками шаринга, прижатыми вправо.
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
      {target > 0 && (
        <div className="flex items-center justify-between gap-2">
          {reached ? (
            <p className="text-sm font-bold text-primary leading-snug">
              ¡Meta alcanzada! Súper-Precio activo
            </p>
          ) : (
            <p className="text-sm leading-snug">
              <span className="font-semibold text-foreground">
                Faltan{" "}
                <span className="font-extrabold text-primary">
                  {formatPrice(target - collected)}
                </span>{" "}
                para Súper-Precio.
              </span>{" "}
              <span
                className="font-semibold"
                style={{ color: "hsl(var(--group-buy-accent-foreground))" }}
              >
                Compartí y llevate un descuento
              </span>
            </p>
          )}
          <ShareIconButtons source="mis_grupos_brand" className="flex-shrink-0" />
        </div>
      )}
    </div>
  );
};
