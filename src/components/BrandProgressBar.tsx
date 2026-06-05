import { type CSSProperties } from "react";
import { useBrandCollection } from "@/hooks/useBrandCollection";

interface Props {
  brandSlug: string;
  /** Show "Meta: $X" and collected amount labels around the bar. */
  showLabels?: boolean;
  /** Bar height class (default h-2.5). */
  heightClass?: string;
}

const formatARS = (n: number) =>
  `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)}`;

export const useBrandProgress = (brandSlug: string) => {
  // Общий кэш всех марок (один запрос/канал на приложение) + optimistic-дельта
  const { collectedRaw, target } = useBrandCollection(brandSlug);
  const reached = target > 0 && collectedRaw >= target;
  const collectedCapped = target > 0 ? Math.min(collectedRaw, target) : collectedRaw;
  const pct = target > 0 ? Math.min(100, Math.max(0, (collectedCapped / target) * 100)) : 0;
  return { collected: collectedCapped, target, pct, reached };
};

export const BrandProgressBar = ({
  brandSlug,
  showLabels = true,
  heightClass = "h-4",
}: Props) => {
  const { collected, target, pct, reached } = useBrandProgress(brandSlug);

  const fillStyle: CSSProperties = {
    width: `${pct}%`,
    background:
      "linear-gradient(90deg, hsl(36 100% 50%), hsl(var(--group-buy-accent)), hsl(48 100% 60%))",
  };

  // Position the moving collected label so it tracks the fill end but stays
  // visible at both extremes (clamp 6% .. 94%).
  const labelLeft = Math.min(94, Math.max(6, pct));

  return (
    <div className="w-full">
      {showLabels && (
        <div className="relative mb-1 text-xs font-bold min-h-[1rem]">
          {reached ? (
            <span className="block text-center text-primary">¡Meta alcanzada! 🎉</span>
          ) : (
            collected > 0 && (
              <span
                className="absolute -translate-x-1/2 text-foreground whitespace-nowrap transition-all duration-1000"
                style={{ left: `${labelLeft}%` }}
              >
                {formatARS(collected)}
              </span>
            )
          )}
        </div>
      )}
      <div
        className={`relative ${heightClass} bg-muted rounded-full overflow-hidden shadow-inner ${
          reached ? "ring-1 ring-primary/60" : ""
        }`}
      >
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000" style={fillStyle} />
      </div>
      {showLabels && target > 0 && !reached && (
        <div className="flex justify-end mt-1 text-xs font-bold">
          <span className="text-muted-foreground">Meta: {formatARS(target)}</span>
        </div>
      )}
    </div>
  );
};

export default BrandProgressBar;