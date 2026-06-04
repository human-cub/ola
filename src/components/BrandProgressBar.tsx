import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [stats, setStats] = useState<{ collected: number; target: number }>({
    collected: 0,
    target: 0,
  });

  useEffect(() => {
    if (!brandSlug) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("brand_collection_public" as any)
        .select("collected_total, target_amount")
        .eq("slug", brandSlug)
        .maybeSingle();
      if (cancelled) return;
      setStats({
        collected: Number((data as any)?.collected_total ?? 0),
        target: Number((data as any)?.target_amount ?? 0),
      });
    };
    load();
    const channel = supabase
      .channel(`brand-progress-${brandSlug}-${Math.random().toString(36).slice(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_overrides", filter: `slug=eq.${brandSlug}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [brandSlug]);

  const { collected: rawCollected, target } = stats;
  const reached = target > 0 && rawCollected >= target;
  const collectedCapped = target > 0 ? Math.min(rawCollected, target) : rawCollected;
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