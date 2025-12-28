import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import platinumMain from "@/assets/platinum-protein-main.png";
import platinumInfo from "@/assets/platinum-protein-info.png";
import platinumUsage from "@/assets/platinum-protein-usage.png";

const images = [
  { src: platinumMain, alt: "Star Nutrition Platinum Protein - Producto principal" },
  { src: platinumInfo, alt: "Star Nutrition Platinum Protein - Información nutricional" },
  { src: platinumUsage, alt: "Star Nutrition Platinum Protein - Modo de uso" },
];

export const ProductCarousel6 = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section id="product-photos" className="py-6">
      <div className="w-full">
        <div className="relative">
          {/* Main Image - Responsive Height */}
          <div className="relative h-[50vh] md:h-[75vh] lg:h-[80vh] max-h-[700px] overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="w-full h-full block cursor-zoom-in">
                  <img
                    src={images[currentImage].src}
                    alt={images[currentImage].alt}
                    className="w-full h-full object-contain transition-all duration-300 hover:scale-105"
                  />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-full h-full max-h-[90vh] p-0 bg-black/95 border-0">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={images[currentImage].src}
                    alt={images[currentImage].alt}
                    className="max-w-full max-h-full object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Navigation Buttons - No Background, Blue Arrows Only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent text-primary hover:text-primary/80 border-0 w-12 h-12"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent text-primary hover:text-primary/80 border-0 w-12 h-12"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentImage + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Dots */}
          <div className="flex justify-center gap-3 mt-4 px-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  index === currentImage
                    ? "bg-primary scale-110 shadow-lg"
                    : "bg-muted hover:bg-muted-foreground/50 hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
