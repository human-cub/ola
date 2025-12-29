import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface DynamicProductCarouselProps {
  images: string[];
  productName: string;
}

export const DynamicProductCarousel = ({ images, productName }: DynamicProductCarouselProps) => {
  // If no images, show placeholder
  const displayImages = images.length > 0 ? images : ["/placeholder.svg"];

  return (
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
                    className="w-full max-w-[280px] h-auto object-contain rounded-xl"
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
  );
};
