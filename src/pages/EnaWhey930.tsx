import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductInfo } from "@/components/ProductInfo";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription } from "@/components/ProductDescription";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { supabase } from "@/integrations/supabase/client";

const EnaWhey930 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("protein");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data } = await supabase
        .from("products")
        .select("waiting_for_discount_count, virtual_orders_count")
        .eq("name", "ENA TrueMade Whey Protein")
        .single();
      
      if (data) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
      }
    };

    fetchWaitingCount();
    
    // Реалтайм подписка на изменения
    const channel = supabase
      .channel("product-waiting-count")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `name=eq.ENA TrueMade Whey Protein`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.waiting_for_discount_count !== undefined && newData.virtual_orders_count !== undefined) {
            setWaitingCount(newData.waiting_for_discount_count + newData.virtual_orders_count);
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
        <ProductCarousel />
        <ProductInfo />
        <PriceSlider priceData={product?.priceSlider || []} waitingCount={waitingCount} />
        <ProductDescription />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
        <RelatedProducts currentProduct="protein" />
      </main>

      <FloatingButton productName="ENA TrueMade Whey Protein" productId="protein" />
    </div>
  );
};

export default EnaWhey930;