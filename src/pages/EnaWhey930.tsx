import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
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
        <PriceSlider priceData={[
          { people: 1, price: 67200 },
          { people: 10, price: 54900 },
          { people: 30, price: 48100 },
          { people: 50, price: 41500 },
          { people: 100, price: 34200 },
        ]} />
        <ProductDescription />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="protein" />
      </main>

      <FloatingButton whatsappUrl="https://chat.whatsapp.com/FxpV8T80s4DC13No0d6UVK?mode=ems_copy_t" />
    </div>
  );
};

export default EnaWhey930;