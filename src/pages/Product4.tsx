import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel4 } from "@/components/ProductCarousel4";
import { ProductInfo4 } from "@/components/ProductInfo4";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription4 } from "@/components/ProductDescription4";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { supabase } from "@/integrations/supabase/client";

const Product4 = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("pump-v8");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data } = await supabase
        .from("products")
        .select("waiting_for_discount_count, virtual_orders_count")
        .eq("name", "Star Nutrition Pump V8")
        .single();
      
      if (data) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
      }
    };

    fetchWaitingCount();
    
    const channel = supabase
      .channel("product-pumpv8-waiting")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `name=eq.Star Nutrition Pump V8`,
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
        <PriceSlider priceData={product?.priceSlider || []} waitingCount={waitingCount} />
        <ProductDescription4 />
        <RelatedProducts currentProduct="pump-v8" />
      </main>

      <FloatingButton productName="Star Nutrition Pump V8" productId="pump-v8" />
    </div>
  );
};

export default Product4;