import { useState, useCallback, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CarouselArrowButton } from "@/components/ui/carousel-arrow-button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface DynamicProductCarouselProps {
  images: string[];
  productName: string;
}

export const DynamicProductCarousel = ({ images, productName }: DynamicProductCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inlineApi, setInlineApi] = useState<CarouselApi>();
  const [modalApi, setModalApi] = useState<CarouselApi>();
  const [modalCurrent, setModalCurrent] = useState(0);

  const displayImages = images.length > 0 ? images : ["/placeholder.svg"];

  const onModalSelect = useCallback(() => {
    if (!modalApi) return;
    setModalCurrent(modalApi.selectedScrollSnap());
  }, [modalApi]);

  useEffect(() => {
    if (!modalApi) return;
    onModalSelect();
    modalApi.on("select", onModalSelect);
    return () => { modalApi.off("select", onModalSelect); };
  }, [modalApi, onModalSelect]);

  useEffect(() => {
    if (selectedIndex !== null && modalApi) {
      modalApi.scrollTo(selectedIndex, true);
    }
  }, [selectedIndex, modalApi]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") modalApi?.scrollPrev();
      if (e.key === "ArrowRight") modalApi?.scrollNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, modalApi]);

  return (
    <>
      <section className="px-0 py-6">
        <div className="container mx-auto max-w-md px-4">
          <Carousel opts={{ loop: true }} setApi={setInlineApi} className="w-full">
            <CarouselContent>
              {displayImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="flex items-center justify-center p-2">
                    <img
                      src={image}
                      alt={`${productName} - Imagen ${index + 1}`}
                      className="w-full max-w-[280px] h-auto object-contain rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedIndex(index)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {displayImages.length > 1 && (
              <>
                <CarouselArrowButton direction="prev" onClick={() => inlineApi?.scrollPrev()} className="-left-2 sm:-left-4" />
                <CarouselArrowButton direction="next" onClick={() => inlineApi?.scrollNext()} className="-right-2 sm:-right-4" />
              </>
            )}
          </Carousel>
        </div>
      </section>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4 bg-white border-none shadow-none [&>button]:rounded-full [&>button]:p-1 [&>button]:z-50">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Carousel
              opts={{ loop: true, startIndex: selectedIndex ?? 0 }}
              setApi={setModalApi}
              className="w-full max-w-[90vw]"
            >
              <CarouselContent>
                {displayImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="flex items-center justify-center">
                      <img
                        src={image}
                        alt={`${productName} - Imagen ${index + 1}`}
                        className="max-w-full max-h-[80vh] object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {displayImages.length > 1 && (
                <>
                  <CarouselArrowButton direction="prev" onClick={() => modalApi?.scrollPrev()} className="left-1 sm:left-2 h-10 w-10" />
                  <CarouselArrowButton direction="next" onClick={() => modalApi?.scrollNext()} className="right-1 sm:right-2 h-10 w-10" />
                </>
              )}
            </Carousel>

            {displayImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => modalApi?.scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === modalCurrent
                        ? "bg-white w-6"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
