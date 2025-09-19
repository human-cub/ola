import { useState, useEffect } from "react";
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
        <ProductCarousel3 />
        <ProductInfo3 />
        <PriceSlider priceData={[
          { people: 1, price: 41900 },
          { people: 10, price: 37200 },
          { people: 30, price: 32000 },
          { people: 50, price: 29000 },
          { people: 100, price: 23000 },
        ]} />
        <ProductDescription3 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="whey-protein" />
      </main>

      <FloatingButton />
    </div>
  );
};

export default Product3;