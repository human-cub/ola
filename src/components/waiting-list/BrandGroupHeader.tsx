import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrandProgress } from "@/components/BrandProgressBar";
import { formatPrice } from "@/lib/formatting";

interface Props {
  brandSlug: string;
  brandName: string;
  onShare: () => void;
}

/**
 * Шапка бренд-блока в листе ожидания: имя марки + кнопка шаринга колекты
 * + общий прогресс-бар сбора с «Faltan $X para Súper-Precio».
 */
export const BrandGroupHeader = ({ brandSlug, brandName, onShare }: Props) => {
  const { collected, target, pct, reached } = useBrandProgress(brandSlug);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-base font-bold uppercase tracking-wider text-primary">{brandName}</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
      {target > 0 && (
        <div>
          <div className="relative h-3.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, hsl(36 100% 50%), hsl(var(--group-buy-accent)), hsl(48 100% 60%))",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {reached ? (
              <span className="font-semibold text-primary">¡Meta alcanzada! Súper-Precio activo</span>
            ) : (
              <>
                Faltan <span className="font-semibold text-primary">{formatPrice(target - collected)}</span> para Súper-Precio
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
