import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel4 } from "@/components/ProductCarousel4";
import { ProductInfo4 } from "@/components/ProductInfo4";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription4 } from "@/components/ProductDescription4";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product4 = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHeaderVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={isHeaderVisible} />
      
      <main className="pb-24">
        <HeroSection />
        <ProductCarousel4 />
        <ProductInfo4 />
        <PriceSlider priceData={[
          { people: 1, price: 36500 },
          { people: 10, price: 33250 },
          { people: 30, price: 30000 },
          { people: 50, price: 26000 },
          { people: 100, price: 20500 },
        ]} />
        <ProductDescription4 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts />
      </main>

      <FloatingButton />
    </div>
  );
};

export default Product4;