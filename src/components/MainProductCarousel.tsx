import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from 'embla-carousel-react';
import { supabase } from "@/integrations/supabase/client";

interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  weight: string;
  link: string;
  image: string;
  originalPrice: string;
  discountPrice: string;
}

export const MainProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    duration: 30
  });

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, weight, link, images, prices')
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
        return;
      }

      const transformed = (data || []).map(product => {
        const images = product.images as string[] | null;
        const prices = product.prices as { people: number; price: number }[] | null;
        
        const firstPrice = prices?.[0]?.price || 0;
        const lastPrice = prices?.[prices.length - 1]?.price || 0;

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          weight: product.weight,
          link: product.link || `/${product.id}`,
          image: images?.[0] || '',
          originalPrice: `$${firstPrice.toLocaleString('es-AR')}`,
          discountPrice: `$${lastPrice.toLocaleString('es-AR')}`
        };
      });

      setProducts(transformed);
      setLoading(false);
    };

    fetchProducts();
  }, []);

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

  if (loading) {
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
            <div className="w-80 h-96 bg-muted/50 rounded-xl animate-pulse"></div>
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
          {/* Embla Carousel */}
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
                        
                        <p className="text-muted-foreground text-sm mb-2">
                          {product.description}
                        </p>
                        
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

          {/* Navigation Buttons - Positioned outside content area */}
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

      </div>
    </section>
  );
};