import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface DynamicProductCarouselProps {
  images: string[];
  productName: string;
}

export const DynamicProductCarousel = ({ images, productName }: DynamicProductCarouselProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // If no images, show placeholder
  const displayImages = images.length > 0 ? images : ["/placeholder.svg"];

  return (
    <>
      <section className="px-4 py-6">
        <div className="container mx-auto max-w-md">
          <Carousel className="w-full">
            <CarouselContent>
              {displayImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="flex items-center justify-center p-2">
                    <img
                      src={image}
                      alt={`${productName} - Imagen ${index + 1}`}
                      className="w-full max-w-[280px] h-auto object-contain rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {displayImages.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>
      </section>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/95 border-none">
          <img
            src={selectedImage || ""}
            alt={productName}
            className="w-full h-full max-h-[90vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
