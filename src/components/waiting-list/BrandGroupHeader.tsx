import { useBrandProgress } from "@/components/BrandProgressBar";
import { ShareIconButtons } from "@/components/ShareIconButtons";
import { formatPrice } from "@/lib/formatting";

interface Props {
  brandSlug: string;
  brandName: string;
}

/**
 * Шапка бренд-блока: имя марки + прогресс-бар сбора в одну строку; ниже —
 * «Faltan $X para Súper-Precio. Compartí…» с кнопками шаринга справа.
 * Если у марки нет цели сбора — кнопки шаринга всё равно показываем (справа от имени).
 */
export const BrandGroupHeader = ({ brandSlug, brandName }: Props) => {
  const { collected, target, pct, reached } = useBrandProgress(brandSlug);
  const hasGoal = target > 0;
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-base font-bold uppercase tracking-wider text-primary whitespace-nowrap">
          {brandName}
        </h2>
        {hasGoal ? (
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
        ) : (
          <ShareIconButtons source="mis_grupos_brand" className="shrink-0 ml-auto" />
        )}
      </div>
      {hasGoal && (
        <div className="flex items-center justify-between gap-2">
          {reached ? (
            <p className="text-sm font-bold text-primary leading-snug">
              ¡Meta alcanzada! Súper-Precio activo
            </p>
          ) : (
            <p className="text-sm leading-snug">
              <span className="font-semibold text-foreground">
                Faltan{" "}
                <span className="font-extrabold" style={{ color: "hsl(34 100% 47%)" }}>
                  {formatPrice(target - collected)}
                </span>{" "}
                para Súper-Precio.
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
                Compartí y llevate un descuento
              </span>
            </p>
          )}
          <ShareIconButtons source="mis_grupos_brand" className="shrink-0" />
        </div>
      )}
    </div>
  );
};
