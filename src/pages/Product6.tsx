import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel6 } from "@/components/ProductCarousel6";
import { ProductInfo6 } from "@/components/ProductInfo6";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription6 } from "@/components/ProductDescription6";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { supabase } from "@/integrations/supabase/client";

const Product6 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("platinum-protein");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data } = await supabase
        .from("products")
        .select("waiting_for_discount_count, virtual_orders_count")
        .eq("name", "Star Nutrition Platinum Protein")
        .single();
      
      if (data) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
      }
    };

    fetchWaitingCount();
    
    const channel = supabase
      .channel("product-platinum-waiting")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `name=eq.Star Nutrition Platinum Protein`,
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
        <ProductCarousel6 />
        <ProductInfo6 />
        <PriceSlider priceData={product?.priceSlider || []} waitingCount={waitingCount} />
        <ProductDescription6 />
        <RelatedProducts currentProduct="platinum-protein" />
      </main>

      <FloatingButton productName="Star Nutrition Platinum Protein" productId="platinum-protein" />
    </div>
  );
};

export default Product6;
