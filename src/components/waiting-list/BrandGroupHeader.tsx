import { Link } from "react-router-dom";
import { useBrandProgress } from "@/components/BrandProgressBar";
import { ShareIconButtons } from "@/components/ShareIconButtons";
import { formatPrice } from "@/lib/formatting";

interface Props {
  brandSlug: string;
  brandName: string;
}

/**
 * Шапка бренд-блока: кликабельное имя марки + прогресс-бар в одну строку; ниже —
 * «Faltan $X. Compartí…» по центру всего бокса, кнопки шаринга прижаты вправо
 * (вне потока, чтобы не сбивать центровку текста).
 */
export const BrandGroupHeader = ({ brandSlug, brandName }: Props) => {
  const { collected, target, pct, reached } = useBrandProgress(brandSlug);
  const hasGoal = target > 0;
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 mb-1">
        <Link to={`/marcas/${brandSlug}`} className="min-w-0 flex-shrink-0">
          <h2 className="text-base font-bold uppercase tracking-wider text-primary whitespace-nowrap hover:underline">
            {brandName}
          </h2>
        </Link>
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
        <div className="relative">
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
          <ShareIconButtons
            source="mis_grupos_brand"
            className="absolute right-0 top-1/2 -translate-y-1/2 shrink-0"
          />
        </div>
      )}
    </div>
  );
};
