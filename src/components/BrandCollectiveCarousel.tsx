import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useBrands } from "@/hooks/useBrands";
import { BrandProgressBar, useBrandProgress } from "@/components/BrandProgressBar";
import { useCollectiveCountdown } from "@/hooks/useCollectiveCountdown";
import { Timer } from "lucide-react";

export const BrandCollectiveCarousel = () => {
  const { data: brands = [] } = useBrands();
  const { timeLeft } = useCollectiveCountdown(null, null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...brands].sort((a, b) => a.sort_order - b.sort_order),
    [brands],
  );
  const copyLen = sorted.length;
  // 3 copias para loop infinito en ambos sentidos (arrastre con el dedo)
  const loop = useMemo(() => [...sorted, ...sorted, ...sorted], [sorted]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || copyLen === 0) return;

    // Ancho EXACTO de una copia (incluye el gap) medido por la posición de la
    // primera tarjeta de la 2da copia. Evita el salto/parpadeo de usar
    // scrollWidth/2 (que no contempla bien el gap entre copias).
    let oneWidth = 0;
    const measure = () => {
      const kids = el.children;
      if (kids.length > copyLen) {
        oneWidth =
          (kids[copyLen] as HTMLElement).offsetLeft -
          (kids[0] as HTMLElement).offsetLeft;
      }
    };
    measure();
    // arrancar en la 2da copia para poder arrastrar hacia ambos lados
    if (oneWidth > 0) el.scrollLeft = oneWidth;

    // Mantener el scroll dentro de [oneWidth, 2*oneWidth): el salto cae sobre
    // contenido idéntico (copias), así que es invisible (sin parpadeo).
    const normalize = () => {
      if (oneWidth <= 0) return;
      if (el.scrollLeft >= 2 * oneWidth) el.scrollLeft -= oneWidth;
      else if (el.scrollLeft < oneWidth) el.scrollLeft += oneWidth;
    };

    let raf = 0;
    let pausedUntil = 0;
    let hoverPaused = false;
    const SPEED = 0.4; // px/frame, derecha -> izquierda

    const tick = () => {
      if (!hoverPaused && performance.now() >= pausedUntil && oneWidth > 0) {
        el.scrollLeft += SPEED;
        normalize();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onScroll = () => normalize();
    // Pausa breve tras tocar/arrastrar para que mande el dedo
    const pauseTouch = () => {
      pausedUntil = performance.now() + 2000;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", pauseTouch, { passive: true });
    el.addEventListener("touchmove", pauseTouch, { passive: true });
    el.addEventListener("wheel", pauseTouch, { passive: true });

    // Hover-pausa SÓLO en dispositivos con mouse real (no en touch, donde
    // iOS dispara mouseenter falsos y dejaba el auto-avance pausado para siempre)
    const hoverCapable =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(hover: hover)").matches;
    const onEnter = () => {
      hoverPaused = true;
    };
    const onLeave = () => {
      hoverPaused = false;
    };
    if (hoverCapable) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    }

    const onResize = () => {
      const prev = oneWidth;
      measure();
      // re-centrar manteniendo posición relativa
      if (prev > 0 && oneWidth > 0) {
        const frac = (el.scrollLeft - prev) / prev;
        el.scrollLeft = oneWidth + frac * oneWidth;
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", pauseTouch);
      el.removeEventListener("touchmove", pauseTouch);
      el.removeEventListener("wheel", pauseTouch);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [copyLen, loop.length]);

  if (brands.length === 0) return null;

  return (
    <section className="py-8 overflow-hidden" id="colectas-semana">
      <div className="text-center mb-1">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          <Link to="/marcas" className="hover:opacity-80 transition-opacity">
            Grupos de la semana
          </Link>
        </h2>
      </div>
      <div className="relative">
        {/* py-3 deja aire para el ring/sombra de la tarjeta destacada
            (overflow-x:auto fuerza overflow-y:auto y si no recorta arriba/abajo) */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-3 [-webkit-overflow-scrolling:touch] [touch-action:pan-x]"
        >
          {loop.map((b, i) => (
            <BrandMarqueeCard
              key={`${b.slug}-${i}`}
              slug={b.slug}
              name={b.name}
              logoUrl={b.logo_url}
              emoji={b.emoji}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 md:w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 md:w-16 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
      <div className="mt-5 flex flex-col items-center gap-2">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold shadow-md"
          style={{ backgroundColor: "hsl(var(--group-buy-accent))" }}
        >
          <Timer className="w-4 h-4 shrink-0" />
          <span className="font-mono tabular-nums text-sm tracking-wide">
            {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m {String(timeLeft.seconds).padStart(2, "0")}s
          </span>
        </span>
        <span className="text-xs sm:text-sm text-muted-foreground">
          Cierran el domingo — sumate antes de que termine la semana
        </span>
      </div>
    </section>
  );
};

export default BrandCollectiveCarousel;

const BrandMarqueeCard = ({
  slug,
  name,
  logoUrl,
  emoji,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  emoji?: string | null;
}) => {
  const { reached } = useBrandProgress(slug);
  return (
    <Link
      to={`/marcas/${slug}`}
      className={`shrink-0 w-[260px] bg-card rounded-xl border p-4 hover:shadow-lg transition-all duration-300 flex flex-col gap-3 ${
        reached ? "ring-2 ring-primary border-primary shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-3 h-14">
        {logoUrl ? (
          <img src={logoUrl} alt={`Logo ${name}`} className="h-10 w-auto object-contain" loading="lazy" decoding="async" />
        ) : (
          <span className="text-2xl">{emoji || "🏷️"}</span>
        )}
        <span className="font-semibold text-foreground truncate">{name}</span>
      </div>
      <BrandProgressBar brandSlug={slug} heightClass="h-3.5" />
    </Link>
  );
};
