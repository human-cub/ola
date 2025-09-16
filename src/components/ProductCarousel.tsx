import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const images = [
  { src: "/truemade-protein-main.webp", alt: "TrueMade Whey Protein - Producto principal" },
  { src: "/truemade-protein-nutrition.webp", alt: "TrueMade Whey Protein - Información nutricional" },
];

export const ProductCarousel = () => {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="px-2 py-4 sm:px-4">
      <div className="container mx-auto max-w-xs sm:max-w-lg">
        <div className="relative bg-gradient-card rounded-2xl p-4 sm:p-6 shadow-floating">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl mb-4">
            <img
              src={images[currentImage].src}
              alt={images[currentImage].alt}
              className="w-full h-full object-cover transition-all duration-300"
            />
            
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-soft w-8 h-8 sm:w-10 sm:h-10"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-soft w-8 h-8 sm:w-10 sm:h-10"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>

          {/* Thumbnail Dots */}
          <div className="flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentImage
                    ? "bg-primary scale-110"
                    : "bg-muted hover:bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};