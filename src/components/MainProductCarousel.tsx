import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import wheyProteinMain from "@/assets/whey-protein-main.png";
import pumpV8Main from "@/assets/pump-v8-main.png";

export const MainProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const nextProduct = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % products.length);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevProduct = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const selectProduct = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleProductClick = (productLink: string) => {
    sessionStorage.setItem('scrollTarget', 'product-photos');
    window.location.href = productLink;
  };

  // Get visible products (current, previous, and next)
  const getVisibleProducts = () => {
    const prevIndex = (currentIndex - 1 + products.length) % products.length;
    const nextIndex = (currentIndex + 1) % products.length;
    return [
      { ...products[prevIndex], position: 'prev' },
      { ...products[currentIndex], position: 'current' },
      { ...products[nextIndex], position: 'next' }
    ];
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

        <div className="relative overflow-hidden">
          {/* Carousel Container */}
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="relative flex items-center justify-center w-full">
              
              {/* Products Display */}
              <div className="flex items-center justify-center gap-4 w-full max-w-4xl">
                {getVisibleProducts().map((product, index) => {
                  const isCenter = product.position === 'current';
                  const productIndex = products.findIndex(p => p.id === product.id);
                  
                  return (
                    <div
                      key={`${product.id}-${index}`}
                      className={`transition-all duration-500 ease-in-out cursor-pointer ${
                        isCenter 
                          ? 'scale-110 z-10' 
                          : 'scale-90 opacity-60 hover:opacity-80 hover:scale-95'
                      }`}
                      onClick={() => isCenter ? handleProductClick(product.link) : selectProduct(productIndex)}
                    >
                      <Card className={`${
                        isCenter 
                          ? 'p-6 shadow-elegant border-2 border-primary/20 bg-gradient-card' 
                          : 'p-4 shadow-soft border border-border/30 bg-background/80'
                      } ${isCenter ? 'w-80' : 'w-64'} transition-all duration-500`}>
                        <div className="text-center">
                          <div className={`${
                            isCenter ? 'w-48 h-48' : 'w-32 h-32'
                          } mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden transition-all duration-500`}>
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-xl"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `<div class="${isCenter ? 'w-32 h-32' : 'w-20 h-20'} bg-primary/20 rounded-xl"></div>`;
                              }}
                            />
                          </div>

                          <h3 className={`${
                            isCenter ? 'text-xl' : 'text-lg'
                          } font-bold text-foreground mb-2 transition-all duration-500`}>
                            {product.name}
                          </h3>
                          
                          {isCenter && (
                            <div className="animate-fade-in">
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
                                onClick={() => handleProductClick(product.link)}
                                className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 rounded-full shadow-elegant transition-all duration-300 hover:shadow-glow w-full"
                              >
                                Ver Producto
                              </Button>
                            </div>
                          )}

                          {!isCenter && (
                            <div className="space-y-2">
                              <p className="text-primary font-semibold text-sm">
                                {product.weight}
                              </p>
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm text-muted-foreground line-through">
                                  {product.originalPrice}
                                </span>
                                <span className="text-lg font-bold text-primary">
                                  {product.discountPrice}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="icon"
                onClick={prevProduct}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-border/50 shadow-soft z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={nextProduct}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-border/50 shadow-soft z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => selectProduct(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
      </div>
    </section>
  );
};