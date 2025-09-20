import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FloatingButton } from "@/components/FloatingButton";
import { RelatedProducts } from "@/components/RelatedProducts";
import { ProductCarousel4 } from "@/components/ProductCarousel4";
import { ProductInfo4 } from "@/components/ProductInfo4";
import { ProductDescription4 } from "@/components/ProductDescription4";
import { PriceSlider } from "@/components/PriceSlider";

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
      <main className="pt-20">
        <ProductCarousel4 />
        <ProductInfo4 />
        <PriceSlider priceData={[
          { people: 1, price: 30330 },
          { people: 10, price: 27200 },
          { people: 30, price: 24000 },
          { people: 50, price: 21500 },
          { people: 100, price: 18200 },
        ]} />
        <ProductDescription4 />
        <RelatedProducts />
      </main>
      <FloatingButton />
    </div>
  );
};

export default Product4;