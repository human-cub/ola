import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import wheyProteinMain from "@/assets/whey-protein-main.png";
import pumpV8Main from "@/assets/pump-v8-main.png";
import useEmblaCarousel from 'embla-carousel-react';

export const MainProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    duration: 30 // Slower transitions
  });

  const products = [
    {
      id: "protein",
      name: "TrueMade Whey Protein",
      description: "Proteína de suero premium",
      weight: "930g",
      link: "/ena-whey-930",
      image: "/truemade-protein-main.webp",
      originalPrice: "$64.000",
      discountPrice: "$36.200"
    },
    {
      id: "creatine",
      name: "Creatina Monohidrato Star Nutrition",
      description: "Creatina monohidrato micronizada",
      weight: "500g",
      link: "/sn-creatina-500",
      image: "https://www.demusculos.com/web/wp-content/uploads/2024/11/creatina-500-grs-star-1.jpg",
      originalPrice: "$52.900",
      discountPrice: "$34.000"
    },
    {
      id: "whey-protein",
      name: "Whey Protein Doypack 2 Lb",
      description: "Proteína en práctico doypack",
      weight: "900g",
      link: "/sn-whey-908",
      image: wheyProteinMain,
      originalPrice: "$41.900",
      discountPrice: "$23.000"
    },
    {
      id: "pump-v8",
      name: "Star Nutrition Pump V8",
      description: "Pre-entreno de máximo rendimiento",
      weight: "285g",
      link: "/sn-pumpv8-285",
      image: pumpV8Main,
      originalPrice: "$36.500",
      discountPrice: "$20.500"
    },
    {
      id: "gainer",
      name: "Gold Nutrition Gainer Gold",
      description: "Ganador de masa muscular premium",
      weight: "5 lbs",
      link: "/gn-gainer-2267",
      image: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-cbc507a865b208583517254733035648-1024-1024.png",
      originalPrice: "$66.400",
      discountPrice: "$35.100"
    }
  ];

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || !emblaApi) return;
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000); // Slower auto-scroll - every 6 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, emblaApi]);

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
      // Resume auto-play after 15 seconds
      setTimeout(() => setIsAutoPlaying(true), 15000);
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      setIsAutoPlaying(false);
      emblaApi.scrollNext();
      // Resume auto-play after 15 seconds
      setTimeout(() => setIsAutoPlaying(true), 15000);
    }
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      setIsAutoPlaying(false);
      emblaApi.scrollTo(index);
      // Resume auto-play after 15 seconds
      setTimeout(() => setIsAutoPlaying(true), 15000);
    }
  }, [emblaApi]);

  const handleProductClick = (productLink: string) => {
    sessionStorage.setItem('scrollTarget', 'product-photos');
    window.location.href = productLink;
  };

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Nuestros Productos
          </h2>
          <p className="text-muted-foreground">
            Suplementos premium al mejor precio
          </p>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4"></div>
        </div>

        <div className="relative">
          {/* Embla Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {products.map((product, index) => (
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
                        
                        <p className="text-muted-foreground text-sm mb-2">
                          {product.description}
                        </p>
                        
                        <p className="text-primary font-semibold mb-4">
                          Masa neto: {product.weight}
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
                            Precio por 100 pedidos
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

          {/* Navigation Buttons - Positioned outside content area */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white border-border/50 shadow-elegant z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white border-border/50 shadow-elegant z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Indicators */}
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

        {/* Auto-play indicator */}
        {isAutoPlaying && (
          <div className="flex justify-center mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              Auto-navegación activa
            </div>
          </div>
        )}
      </div>
    </section>
  );
};