import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useBrands } from "@/hooks/useBrands";
import { BrandProgressBar, useBrandProgress } from "@/components/BrandProgressBar";

export const BrandCollectiveCarousel = () => {
  const { data: brands = [] } = useBrands();
  const scrollRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...brands].sort((a, b) => a.sort_order - b.sort_order),
    [brands],
  );
  // lista duplicada para loop continuo
  const loop = useMemo(() => [...sorted, ...sorted], [sorted]);

  // Auto-desplazamiento por JS (no CSS): así el contenedor sigue siendo
  // scrolleable de forma nativa y el usuario puede arrastrar con el dedo.
  // El auto-avance se pausa al interactuar (touch / mouse / scroll manual).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || sorted.length === 0) return;

    let raf = 0;
    let pausedUntil = 0; // timestamp hasta el cual el auto-avance está pausado
    const SPEED = 0.4; // px por frame (~24px/s a 60fps)

    const half = () => el.scrollWidth / 2; // ancho de UNA copia de la lista

    const tick = () => {
      const h = half();
      if (h > 0 && performance.now() >= pausedUntil) {
        el.scrollLeft += SPEED;
        if (el.scrollLeft >= h) el.scrollLeft -= h;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Loop sin costuras también para el arrastre manual
    const onScroll = () => {
      const h = half();
      if (h <= 0) return;
      if (el.scrollLeft >= h) el.scrollLeft -= h;
      else if (el.scrollLeft <= 0) el.scrollLeft += h;
    };

    // Pausa breve tras cada interacción para que el dedo mande
    const pause = () => {
      pausedUntil = performance.now() + 1500;
    };
    const pauseHover = () => {
      pausedUntil = Number.MAX_SAFE_INTEGER;
    };
    const resumeHover = () => {
      pausedUntil = 0;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchmove", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("mouseenter", pauseHover);
    el.addEventListener("mouseleave", resumeHover);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchmove", pause);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("mouseenter", pauseHover);
      el.removeEventListener("mouseleave", resumeHover);
    };
  }, [sorted.length, loop.length]);

  if (brands.length === 0) return null;

  return (
    <section className="py-8" id="colectas-semana">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Colectas de la semana
        </h2>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4" />
      </div>
      <div className="relative py-3">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-1 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch] [touch-action:pan-x]"
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
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-16 bg-gradient-to-l from-background to-transparent z-10" />
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
