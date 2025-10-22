import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel3 } from "@/components/ProductCarousel3";
import { ProductInfo3 } from "@/components/ProductInfo3";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription3 } from "@/components/ProductDescription3";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { supabase } from "@/integrations/supabase/client";

const Product3 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("whey-protein");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data } = await supabase
        .from("products")
        .select("waiting_for_discount_count")
        .eq("name", "Star Nutrition Whey Protein")
        .single();
      
      if (data) {
        setWaitingCount(data.waiting_for_discount_count);
      }
    };

    fetchWaitingCount();
    
    const channel = supabase
      .channel("product-whey-waiting")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `name=eq.Star Nutrition Whey Protein`,
        },
        (payload) => {
          if (payload.new.waiting_for_discount_count !== undefined) {
            setWaitingCount(payload.new.waiting_for_discount_count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <ProductCarousel3 />
        <ProductInfo3 />
        <PriceSlider priceData={product?.priceSlider || []} waitingCount={waitingCount} />
        <ProductDescription3 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="whey-protein" />
      </main>

      <FloatingButton productName="Star Nutrition Whey Protein" productId="whey-protein" />
    </div>
  );
};

export default Product3;