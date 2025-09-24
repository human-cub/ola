import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductInfo } from "@/components/ProductInfo";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription } from "@/components/ProductDescription";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const EnaWhey930 = () => {
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
        setIsButtonFixed(currentScrollY > priceSliderBottom + 100);
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
        <ProductCarousel />
        <ProductInfo />
        <div ref={priceSliderRef}>
          <PriceSlider priceData={[
            { people: 1, price: 64000 },
            { people: 10, price: 52500 },
            { people: 30, price: 46000 },
            { people: 50, price: 40000 },
            { people: 100, price: 36200 },
          ]} />
        </div>
        {!isButtonFixed && (
          <FloatingButton 
            whatsappUrl="https://chat.whatsapp.com/Fbx2bOICgdsF6o7GGeYETg" 
            isFixed={false} 
          />
        )}
        <ProductDescription />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="protein" />
      </main>

      {isButtonFixed && (
        <FloatingButton 
          whatsappUrl="https://chat.whatsapp.com/Fbx2bOICgdsF6o7GGeYETg" 
          isFixed={true} 
        />
      )}
    </div>
  );
};

export default EnaWhey930;