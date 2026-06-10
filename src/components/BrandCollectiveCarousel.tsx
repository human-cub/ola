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
    let dragging = false;
    const SPEED = 0.4; // px/frame, derecha -> izquierda

    const tick = () => {
      if (!dragging && performance.now() >= pausedUntil && oneWidth > 0) {
        el.scrollLeft += SPEED;
        normalize();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onScroll = () => normalize();
    // Pausa breve tras rueda/touch para que mande el usuario.
    const pauseBriefly = () => {
      pausedUntil = performance.now() + 1500;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", pauseBriefly, { passive: true });
    el.addEventListener("touchmove", pauseBriefly, { passive: true });
    el.addEventListener("wheel", pauseBriefly, { passive: true });

    // Arrastre con mouse manteniendo el botón izquierdo (el touch usa scroll nativo).
    let downX = 0;
    let lastX = 0;
    let moved = false;
    // Drag con listeners en window. SIN setPointerCapture: el pointer-capture
    // retargetea el evento `click` al contenedor y rompía la navegación al
    // hacer clic en una marca.
    const onWinPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (Math.abs(e.clientX - downX) > 4) moved = true;
      // Incremental: mover desde la posición ACTUAL para que normalize()
      // envuelva el loop infinito sin saltos ni topes.
      el.scrollLeft -= dx;
      normalize();
    };
    const onWinPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "grab";
      pausedUntil = performance.now() + 1200; // breve pausa tras soltar, luego sigue
      window.removeEventListener("pointermove", onWinPointerMove);
      window.removeEventListener("pointerup", onWinPointerUp);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      downX = e.clientX;
      lastX = e.clientX;
      el.style.cursor = "grabbing";
      window.addEventListener("pointermove", onWinPointerMove);
      window.addEventListener("pointerup", onWinPointerUp);
    };
    // Sólo bloquear el click si hubo arrastre real (un clic normal navega).
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClickCapture, true);
    // Cancelar el drag nativo (fantasma de la imagen/enlace) durante el arrastre.
    const onDragStart = (e: Event) => e.preventDefault();
    el.addEventListener("dragstart", onDragStart);

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
      el.removeEventListener("touchstart", pauseBriefly);
      el.removeEventListener("touchmove", pauseBriefly);
      el.removeEventListener("wheel", pauseBriefly);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("pointermove", onWinPointerMove);
      window.removeEventListener("pointerup", onWinPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, [copyLen, loop.length]);

  if (brands.length === 0) return null;

  return (
    <section className="py-8 overflow-hidden" id="colectas-semana">
      <div className="text-center mb-1 px-4">
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
          className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab select-none px-4 py-3 [-webkit-overflow-scrolling:touch] [touch-action:pan-x]"
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
      <div className="mt-5 flex flex-col items-center gap-2 px-4">
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
      draggable={false}
      className={`shrink-0 w-[260px] bg-card rounded-xl border p-4 hover:shadow-lg transition-all duration-300 flex flex-col gap-3 ${
        reached ? "ring-2 ring-primary border-primary shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-3 h-14">
        {logoUrl ? (
          <img src={logoUrl} alt={`Logo ${name}`} className="h-10 w-auto object-contain" loading="lazy" decoding="async" draggable={false} />
        ) : (
          <span className="text-2xl">{emoji || "🏷️"}</span>
        )}
        <span className="font-semibold text-foreground truncate">{name}</span>
      </div>
      <BrandProgressBar brandSlug={slug} heightClass="h-3.5" />
    </Link>
  );
};
