import { Link } from "react-router-dom";
import { useBrands } from "@/hooks/useBrands";
import { BrandProgressBar } from "@/components/BrandProgressBar";

export const BrandCollectiveCarousel = () => {
  const { data: brands = [] } = useBrands();

  if (brands.length === 0) return null;

  const sorted = [...brands].sort((a, b) => a.sort_order - b.sort_order);
  // duplicate list for seamless loop
  const loop = [...sorted, ...sorted];

  return (
    <section className="py-8" id="colectas-semana">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Colectas de la semana
        </h2>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4" />
      </div>
      <div className="relative overflow-hidden group">
        <div className="flex w-max gap-4 animate-marquee group-hover:[animation-play-state:paused]">
          {loop.map((b, i) => (
            <Link
              key={`${b.slug}-${i}`}
              to={`/v2/marcas/${b.slug}`}
              className="shrink-0 w-[260px] bg-card rounded-xl border p-4 hover:shadow-lg transition-all duration-300 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 h-14">
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={`Logo ${b.name}`}
                    className="h-10 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-2xl">{b.emoji || "🏷️"}</span>
                )}
                <span className="font-semibold text-foreground truncate">{b.name}</span>
              </div>
              <BrandProgressBar brandSlug={b.slug} heightClass="h-2" />
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-16 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
    </section>
  );
};

export default BrandCollectiveCarousel;