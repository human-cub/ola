import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import proteinMain from "@/assets/protein-main.jpg";
import proteinSide from "@/assets/protein-side.jpg";
import proteinBack from "@/assets/protein-back.jpg";
import proteinOpen from "@/assets/protein-open.jpg";
import proteinShake from "@/assets/protein-shake.jpg";

const images = [
  { src: proteinMain, alt: "TrueMade Whey Protein - Vista principal" },
  { src: proteinSide, alt: "TrueMade Whey Protein - Vista lateral" },
  { src: proteinBack, alt: "TrueMade Whey Protein - Vista posterior" },
  { src: proteinOpen, alt: "TrueMade Whey Protein - Vista abierta" },
  { src: proteinShake, alt: "TrueMade Whey Protein - Con batido" },
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
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="relative bg-gradient-card rounded-2xl p-6 shadow-floating">
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 shadow-soft"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 shadow-soft"
            >
              <ChevronRight className="w-4 h-4" />
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