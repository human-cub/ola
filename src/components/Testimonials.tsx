import { useState, useEffect, useCallback, useRef } from "react";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CarouselArrowButton } from "@/components/ui/carousel-arrow-button";

type Testimonial = {
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Gustavo",
    quote:
      "Súper recomendables buen precio calidad",
    avatar: "/testimonial-gustavo.png",
  },
  {
    name: "Julieta",
    quote:
      "El sistema de venta es genial y practico, tienen muy buenos precios. Angelina es super amable",
    avatar: "/testimonial-julieta.png",
  },
  {
    name: "Eduardo",
    quote:
      "Muy buenos los productos. Buen precio y gran servicio de entrega hasta el domicilio. Cliente muy conforme",
    avatar: "/testimonial-eduardo.png",
  },
  {
    name: "Tomás",
    quote:
      "Muchas gracias!! Muy buen servicio. La aplicación es fácil e intuitiva para usar. Es realmente muy buena la idea y siempre tienen los mejores precios para una gran variedad de suplementos! La atención es genial y siempre muestran una gran predisposición! Realmente un gran servicio que sin dudas seguiré usando 💪🏼💪🏼💪🏼💪🏼",
    avatar: "/testimonial-tomas.webp",
  },
  {
    name: "Javier",
    quote:
      "Todo de 10. Volvería a comprar. Me contacté, me lo dejaron en la puerta de casa, en el día",
    avatar: "/testimonial-javier.webp",
  },
  {
    name: "Felipe",
    quote:
      "Buenisimo la verdad, llega al toque y precio muchisimo mas barato que en otros lugares como mercado libre, ni te digo en farmacias!! Muy seguro",
  },
  {
    name: "Alfredo",
    quote:
      "Muy buenos descuentos. Son muy puntuales y amables. Les deseo muchos éxitos!!!!",
    avatar: "/testimonial-alfredo.webp",
  },
];

const AUTOPLAY_INTERVAL = 5000;

export const Testimonials = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [canScroll, setCanScroll] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(false);

  const syncState = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    setCanScroll(api.canScrollNext() || api.canScrollPrev());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    syncState();
    api.on("select", syncState);
    api.on("reInit", syncState);
    return () => {
      api.off("select", syncState);
      api.off("reInit", syncState);
    };
  }, [api, syncState]);

  const scheduleNext = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!api || pausedRef.current || !canScroll) return;

    timerRef.current = setTimeout(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
      scheduleNext();
    }, AUTOPLAY_INTERVAL);
  }, [api, canScroll]);

  useEffect(() => {
    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, [scheduleNext]);

  const handleMouseEnter = () => {
    pausedRef.current = true;
    clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    scheduleNext();
  };

  return (
    <section className="py-12 bg-foreground/[0.03] overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <Carousel
          opts={{ loop: true, align: "start" }}
          setApi={setApi}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <CarouselContent className="-ml-5 pt-12 pb-3">
            {testimonials.map((t, i) => (
              <CarouselItem
                key={i}
                className="pl-5 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <div className="relative flex flex-col bg-background rounded-2xl shadow-floating">
                  {/* Avatar */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-20 h-20 rounded-full border-4 border-background shadow-soft overflow-hidden bg-background">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          loading="eager"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-primary text-primary-foreground text-2xl font-bold">
                          {t.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quote grows so every card matches the tallest review */}
                  <div className="h-[256px] overflow-hidden bg-muted/40 rounded-t-2xl px-6 pt-12 pb-5 flex flex-col justify-center">
                    <Quote className="w-7 h-7 text-primary/40 mb-3 -scale-x-100 shrink-0" />
                    <p className={`text-foreground leading-relaxed italic ${t.quote.length > 220 ? "text-xs" : "text-sm"}`}>
                      {t.quote}
                    </p>
                  </div>

                  {/* Name */}
                  <div className="px-6 py-4 text-center">
                    <h3 className="text-lg font-bold text-foreground">
                      {t.name}
                    </h3>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {canScroll && (
            <>
              <CarouselArrowButton direction="prev" onClick={() => api?.scrollPrev()} className="-left-2 sm:-left-4" />
              <CarouselArrowButton direction="next" onClick={() => api?.scrollNext()} className="-right-2 sm:-right-4" />
            </>
          )}
        </Carousel>

        {canScroll && (
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-primary"
                    : "w-2 bg-primary/25 hover:bg-primary/40"
                }`}
                onClick={() => api?.scrollTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
