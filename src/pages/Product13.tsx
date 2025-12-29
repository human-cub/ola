import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCarousel13 } from "@/components/ProductCarousel13";
import { ProductInfo13 } from "@/components/ProductInfo13";
import { ProductDescription13 } from "@/components/ProductDescription13";
import { RelatedProducts } from "@/components/RelatedProducts";
import { HeroSection } from "@/components/HeroSection";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { FloatingButton } from "@/components/FloatingButton";

const Product13 = () => {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeader);
    
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={showHeader} />
      <main className="pt-16">
        <ProductCarousel13 />
        <ProductInfo13 />
        <ProductDescription13 />
        <RelatedProducts currentProduct="creatine-star" />
        <HeroSection />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
      </main>
      <FloatingButton 
        productName="Star Nutrition Creatina Doypack 300g"
        productId="creatine-star"
      />
    </div>
  );
};

export default Product13;
