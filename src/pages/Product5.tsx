import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel5 } from "@/components/ProductCarousel5";
import { ProductInfo5 } from "@/components/ProductInfo5";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription5 } from "@/components/ProductDescription5";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product5 = () => {
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
        <ProductCarousel5 />
        <ProductInfo5 />
        <PriceSlider priceData={[
          { people: 1, price: 66400 },
          { people: 10, price: 49700 },
          { people: 30, price: 45200 },
          { people: 50, price: 40300 },
          { people: 100, price: 35100 },
        ]} />
        <ProductDescription5 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="gainer" />
      </main>

      <FloatingButton />
    </div>
  );
};

export default Product5;