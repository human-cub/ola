import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProductCarousel5 = () => {
  const [currentImage, setCurrentImage] = useState(0);
  
  const images = [
    {
      src: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-cbc507a865b208583517254733035648-1024-1024.png",
      alt: "Gold Nutrition Gainer Gold - Imagen principal"
    },
    {
      src: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-mercado-4-c3bb275bcbcf21e4f317254731858661-1024-1024.jpg",
      alt: "Gold Nutrition Gainer Gold - Vista lateral"
    },
    {
      src: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-mercado-5-abc3aa8fe5ce0e55fa17254731857054-1024-1024.jpg",
      alt: "Gold Nutrition Gainer Gold - Información nutricional"
    },
    {
      src: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-mercado-6-49f18791023ce3dab917254731859317-1024-1024.jpg",
      alt: "Gold Nutrition Gainer Gold - Vista posterior"
    }
  ];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="px-4 py-2">
      <div className="container mx-auto max-w-md">
        <div className="relative aspect-square bg-white rounded-2xl shadow-soft overflow-hidden mb-4">
          <img
            src={images[currentImage].src}
            alt={images[currentImage].alt}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Thumbnails */}
        <div className="flex justify-center gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                currentImage === index
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setCurrentImage(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-contain bg-white"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};