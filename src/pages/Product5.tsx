import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel5 } from "@/components/ProductCarousel5";
import { ProductInfo5 } from "@/components/ProductInfo5";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription5 } from "@/components/ProductDescription5";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";

const Product5 = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const product = getProduct("gainer");

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
        <PriceSlider priceData={product?.priceSlider || []} />
        <ProductDescription5 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="gainer" />
      </main>

      <FloatingButton whatsappUrl="https://chat.whatsapp.com/CTvImulInPj12UcC08k5FB?mode=ems_copy_c" />
    </div>
  );
};

export default Product5;