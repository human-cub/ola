import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductInfo } from "@/components/ProductInfo";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription } from "@/components/ProductDescription";
import { Benefits } from "@/components/Benefits";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Index = () => {
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
        <PriceSlider />
        <ProductDescription />
        <Benefits />
        <ServiceDescription />
        <RelatedProducts currentProduct="protein" />
      </main>

      <FloatingButton />
    </div>
  );
};

export default Index;
