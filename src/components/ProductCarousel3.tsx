import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProductCarousel3 = () => {
  const images = [
    {
      src: "/src/assets/whey-protein-main.png",
      alt: "Whey Protein Doypack 2 Lb Star Nutrition - Vista principal"
    },
    {
      src: "/src/assets/whey-protein-info.png", 
      alt: "Whey Protein Doypack 2 Lb Star Nutrition - Información nutricional"
    }
  ];

  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="px-4 py-6">
      <div className="container mx-auto max-w-md">
        <div className="relative bg-gradient-card rounded-2xl p-6 shadow-soft">
          {/* Main Image */}
          <div className="relative mb-6 group">
            <img
              src={images[currentImage].src}
              alt={images[currentImage].alt}
              className="w-full h-80 object-cover rounded-xl shadow-soft transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-soft"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-soft"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnail Indicators */}
          <div className="flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentImage ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};