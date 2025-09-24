import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel3 } from "@/components/ProductCarousel3";
import { ProductInfo3 } from "@/components/ProductInfo3";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription3 } from "@/components/ProductDescription3";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product3 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isButtonFixed, setIsButtonFixed] = useState(false);
  const priceSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Header visibility logic
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      // Button position logic
      if (priceSliderRef.current) {
        const priceSliderBottom = priceSliderRef.current.offsetTop + priceSliderRef.current.offsetHeight;
        setIsButtonFixed(currentScrollY > priceSliderBottom + 50);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      
      <main className="pb-24">
        <HeroSection />
        <ProductCarousel3 />
        <ProductInfo3 />
        <div ref={priceSliderRef}>
          <PriceSlider priceData={[
            { people: 1, price: 41900 },
            { people: 10, price: 37200 },
            { people: 30, price: 32000 },
            { people: 50, price: 29000 },
            { people: 100, price: 23000 },
          ]} />
        </div>
        {!isButtonFixed && (
          <FloatingButton 
            whatsappUrl="https://chat.whatsapp.com/BYSF3mQxkxS9CdHtoXGD6m?mode=ems_copy_c" 
            isFixed={false} 
          />
        )}
        <ProductDescription3 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="whey-protein" />
      </main>

      {isButtonFixed && (
        <FloatingButton 
          whatsappUrl="https://chat.whatsapp.com/BYSF3mQxkxS9CdHtoXGD6m?mode=ems_copy_c" 
          isFixed={true} 
        />
      )}
    </div>
  );
};

export default Product3;