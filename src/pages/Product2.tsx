import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel2 } from "@/components/ProductCarousel2";
import { ProductInfo2 } from "@/components/ProductInfo2";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription2 } from "@/components/ProductDescription2";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product2 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const product = getProduct("creatine");

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
        <ProductCarousel2 />
        <ProductInfo2 />
        <PriceSlider priceData={product?.priceSlider || []} />
        <ProductDescription2 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="creatine" />
      </main>

      <FloatingButton whatsappUrl="https://chat.whatsapp.com/DuDGRwejfqZGZq1w8UBcnk?mode=ems_copy_c" />
    </div>
  );
};

export default Product2;