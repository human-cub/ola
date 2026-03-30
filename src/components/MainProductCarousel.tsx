import { useState, useEffect, useCallback, useMemo } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarouselArrowButton } from "@/components/ui/carousel-arrow-button";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from 'embla-carousel-react';
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

export const MainProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();
  const { data: allProducts = [], isLoading, isError, refetch } = useProducts();
  
  // Shuffle and limit to 10 random products
  const products = useMemo(() => {
    if (allProducts.length === 0) return [];
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [allProducts]);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
    duration: 30,
  });

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || !emblaApi || products.length === 0) return;
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, emblaApi, products.length]);

  // Update current index when carousel changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      setIsAutoPlaying(false);
      emblaApi.scrollPrev();
      setTimeout(() => setIsAutoPlaying(true), 15000);
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      setIsAutoPlaying(false);
      emblaApi.scrollNext();
      setTimeout(() => setIsAutoPlaying(true), 15000);
    }
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      setIsAutoPlaying(false);
      emblaApi.scrollTo(index);
      setTimeout(() => setIsAutoPlaying(true), 15000);
    }
  }, [emblaApi]);

  const handleProductClick = (productLink: string) => {
    sessionStorage.setItem('scrollTarget', 'product-photos');
    window.location.href = productLink;
  };

  if (!isLoading && !isError && products.length === 0) {
    return null;
  }

  const headerClassName = isError ? "text-center mb-6" : "text-center mb-8";
  const titleClassName = isError
    ? "text-2xl md:text-3xl font-bold mb-2"
    : "text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2";

  return (
    <section className="py-8 md:pt-0" id="products">
      <div className="mx-auto max-w-6xl">
        <div className={headerClassName}>
          
          <div className="lg:hidden">
            <h2 className={cn(titleClassName, "lg:hidden")}>Nuestros Productos</h2>
            <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4"></div>
          </div>

          {isError && (
            <p className="text-muted-foreground">No pudimos cargar los productos.</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="w-80 h-80 bg-muted/50 rounded-xl animate-pulse"></div>
          </div>
        ) : isError ? (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="overflow-hidden  md:py-10" ref={emblaRef}>
                <div className="flex [--slides:1] md:[--slides:3] lg:[--slides:4] min-[1920px]:[--slides:5]">
                  {products.map((product) => (
                    <div key={product.id} className="grow-0 shrink-0 basis-[calc(100%/var(--slides))]">
                      <div className="flex justify-center px-3 h-full">
                        <a href={product.link} onClick={() => amplitude.track('Product Viewed', { product_name: product.name, product_id: product.id, source: 'main_carousel' })}>
                          <Card
                            className={cn(
                              "p-6 shadow-soft border border-1 border-transparent bg-gradient-card w-full max-w-sm cursor-pointer transition-all duration-300 ease-out h-full min-w-[280px]",

                              "hover:shadow-elegant hover:border-primary/20 hover:animate-glow-pulse"
                            )}
                          >
                            <div className="text-center flex flex-col h-full">
                              <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-contain rounded-xl"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = '<div class="w-32 h-32 bg-primary/20 rounded-xl"></div>';
                                  }}
                                />
                              </div>

                              <h3 className="text-xl font-bold text-foreground mb-2 leading-[1.15]">
                                {product.name}
                              </h3>

                              <p className="text-primary font-semibold mb-4">
                                Peso neto: {product.weight}
                              </p>

                              <div className="space-y-2 mt-auto">
                                <div className="flex items-center justify-center gap-3">
                                  <span className="text-lg text-muted-foreground line-through">
                                    {product.originalPrice}
                                  </span>
                                  <span className="text-2xl font-bold text-primary">
                                    {product.discountPrice}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground italic">
                                  Precio mínimo
                                </p>
                              </div>
                            </div>
                          </Card>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-16 bg-gradient-to-r from-background to-transparent z-10 temp-1939" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-16 bg-gradient-to-l from-background to-transparent z-10 temp-1939" />

              <CarouselArrowButton direction="prev" onClick={scrollPrev} />
              <CarouselArrowButton direction="next" onClick={scrollNext} />
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => navigate('/catalogo')}
                className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 rounded-full shadow-elegant transition-all duration-300 hover:shadow-glow"
              >
                Ver catálogo
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
