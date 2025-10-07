import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel4 } from "@/components/ProductCarousel4";
import { ProductInfo4 } from "@/components/ProductInfo4";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription4 } from "@/components/ProductDescription4";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product4 = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const product = getProduct("pump-v8");

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
        <PriceSlider priceData={product?.priceSlider || []} />
        <ProductDescription4 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="pump-v8" />
      </main>

      <FloatingButton whatsappUrl="https://chat.whatsapp.com/LwCt9mb1TlD87eYaMSOp8Y?mode=ems_copy_c" />
    </div>
  );
};

export default Product4;