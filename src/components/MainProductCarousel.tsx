import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from 'embla-carousel-react';
import { useProducts } from "@/hooks/useProducts";

export const MainProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { data: products = [], isLoading } = useProducts();
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    duration: 30
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

  if (isLoading) {
    return (
      <section className="px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Nuestros Productos
            </h2>
            <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4"></div>
          </div>
          <div className="flex justify-center">
            <div className="w-80 h-80 bg-muted/50 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Nuestros Productos
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4"></div>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {products.map((product) => (
                <div key={product.id} className="flex-[0_0_100%] min-w-0 pl-4">
                  <div className="flex justify-center">
                    <Card 
                      className="p-6 shadow-elegant border-2 border-primary/20 bg-gradient-card w-80 cursor-pointer hover:shadow-glow transition-all duration-700 ease-out"
                      onClick={() => handleProductClick(product.link)}
                    >
                      <div className="text-center">
                        <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="w-32 h-32 bg-primary/20 rounded-xl"></div>';
                            }}
                          />
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {product.name}
                        </h3>
                        
                        <p className="text-primary font-semibold mb-4">
                          Peso neto: {product.weight}
                        </p>

                        <div className="mb-6 space-y-2">
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

                        <Button 
                          className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 rounded-full shadow-elegant transition-all duration-300 hover:shadow-glow w-full"
                        >
                          Ver Producto
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute -left-6 md:-left-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-border/50 shadow-elegant z-20"
          >
            <ChevronLeft className="w-6 h-6 text-blue-500" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute -right-6 md:-right-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-border/50 shadow-elegant z-20"
          >
            <ChevronRight className="w-6 h-6 text-blue-500" />
          </Button>
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
      </div>
    </section>
  );
};
