import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel2 } from "@/components/ProductCarousel2";
import { ProductInfo2 } from "@/components/ProductInfo2";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription2 } from "@/components/ProductDescription2";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product2 = () => {
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
        <ProductCarousel2 />
        <ProductInfo2 />
        <div ref={priceSliderRef}>
          <PriceSlider priceData={[
            { people: 1, price: 52900 },
            { people: 10, price: 48200 },
            { people: 30, price: 43000 },
            { people: 50, price: 40000 },
            { people: 100, price: 34000 },
          ]} />
        </div>
        {!isButtonFixed && (
          <FloatingButton 
            whatsappUrl="https://chat.whatsapp.com/DuDGRwejfqZGZq1w8UBcnk?mode=ems_copy_c" 
            isFixed={false} 
          />
        )}
        <ProductDescription2 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="creatine" />
      </main>

      {isButtonFixed && (
        <FloatingButton 
          whatsappUrl="https://chat.whatsapp.com/DuDGRwejfqZGZq1w8UBcnk?mode=ems_copy_c" 
          isFixed={true} 
        />
      )}
    </div>
  );
};

export default Product2;