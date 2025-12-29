import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCarousel14 } from "@/components/ProductCarousel14";
import { ProductInfo14 } from "@/components/ProductInfo14";
import { ProductDescription14 } from "@/components/ProductDescription14";
import { RelatedProducts } from "@/components/RelatedProducts";
import { HeroSection } from "@/components/HeroSection";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { FloatingButton } from "@/components/FloatingButton";

const Product14 = () => {
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
        <ProductCarousel14 />
        <ProductInfo14 />
        <ProductDescription14 />
        <RelatedProducts currentProduct="creatine-pote-150" />
        <HeroSection />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
      </main>
      <FloatingButton 
        productName="Star Nutrition Creatina Pote 150g"
        productId="creatine-pote-150"
      />
    </div>
  );
};

export default Product14;
