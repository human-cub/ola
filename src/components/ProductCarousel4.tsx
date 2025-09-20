import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import pumpMain from "@/assets/pump-v8-main.png";
import pumpAcai from "@/assets/pump-v8-acai.png";
import pumpGrape from "@/assets/pump-v8-grape.png";
import pumpInfo from "@/assets/pump-v8-info.jpg";

const images = [
  { src: pumpMain, alt: "Star Nutrition Pump V8 - Watermelon" },
  { src: pumpAcai, alt: "Star Nutrition Pump V8 - Açai Power" },
  { src: pumpGrape, alt: "Star Nutrition Pump V8 - Grape Attack" },
  { src: pumpInfo, alt: "Star Nutrition Pump V8 - Información Nutricional" },
];

export const ProductCarousel4 = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Main Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-elegant overflow-hidden">
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                className="w-full h-full object-contain p-4"
              />
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-2 justify-center">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? "border-primary shadow-glow" 
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-contain bg-white p-1"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Star Nutrition Pump V8
              </h1>
              <p className="text-lg text-muted-foreground">
                Pre-entreno con 8 ingredientes activos - 285g
              </p>
            </div>

            {/* Key Benefits */}
            <div className="bg-card rounded-xl p-6 border shadow-soft">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Beneficios Principales</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Ayuda a entrenar con mayor fuerza y explosividad</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maximiza el flujo sanguíneo para un pump sin precedentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Reduce la fatiga muscular y facilita la recuperación</span>
                </li>
              </ul>
            </div>

            {/* Flavors */}
            <div className="bg-card rounded-xl p-6 border shadow-soft">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Sabores Disponibles</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Watermelon
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Açai Power
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Grape Attack
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Citrus Slush
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};