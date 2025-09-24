import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductInfo } from "@/components/ProductInfo";
import { ProductDescription } from "@/components/ProductDescription";
import { PriceSlider } from "@/components/PriceSlider";
import { FloatingButton } from "@/components/FloatingButton";

const EnaWhey930 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Price data for the protein product
  const priceData = [
    { people: 1, price: 85000 },
    { people: 25, price: 68000 },
    { people: 50, price: 55000 },
    { people: 75, price: 48000 },
    { people: 100, price: 42000 }
  ];

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
      
      <main>
        <ProductInfo />
        <ProductCarousel />
        <PriceSlider priceData={priceData} />
        <ProductDescription />
      </main>
      
      <FloatingButton whatsappUrl="https://chat.whatsapp.com/Fbx2bOICgdsF6o7GGeYETg" />
    </div>
  );
};

export default EnaWhey930;