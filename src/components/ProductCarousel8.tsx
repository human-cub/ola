import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

import plantProteinMain from "@/assets/plant-protein-main.png";
import plantProteinInfo from "@/assets/plant-protein-info.png";
import plantProteinNutrition from "@/assets/plant-protein-nutrition.png";

export const ProductCarousel8 = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const productImages = [
    { src: plantProteinMain, alt: "Star Nutrition Just Plant Protein - Vista Principal" },
    { src: plantProteinInfo, alt: "Star Nutrition Just Plant Protein - Información" },
    { src: plantProteinNutrition, alt: "Star Nutrition Just Plant Protein - Tabla Nutricional" },
  ];

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollToSlide = (index: number) => {
    api?.scrollTo(index);
  };

  return (
    <section id="product-photos" className="px-4 py-6">
      <div className="container mx-auto max-w-md">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent>
            {productImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="flex items-center justify-center p-2">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-card shadow-soft">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {productImages.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                current === index 
                  ? "bg-primary w-6" 
                  : "bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
