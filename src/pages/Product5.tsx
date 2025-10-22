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
import { supabase } from "@/integrations/supabase/client";

const Product5 = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("gainer");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data } = await supabase
        .from("products")
        .select("waiting_for_discount_count")
        .eq("name", "Gold Nutrition Gainer Gold")
        .single();
      
      if (data) {
        setWaitingCount(data.waiting_for_discount_count);
      }
    };

    fetchWaitingCount();
    
    const channel = supabase
      .channel("product-gainer-waiting")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `name=eq.Gold Nutrition Gainer Gold`,
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
        <PriceSlider priceData={product?.priceSlider || []} waitingCount={waitingCount} />
        <ProductDescription5 />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="gainer" />
      </main>

      <FloatingButton productName="Gold Nutrition Gainer Gold" productId="gainer" />
    </div>
  );
};

export default Product5;