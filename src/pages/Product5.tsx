import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel5 } from "@/components/ProductCarousel5";
import { ProductInfo5 } from "@/components/ProductInfo5";
import { PriceSlider } from "@/components/PriceSlider";
import { getProduct } from "@/data/products";
import { ProductDescription5 } from "@/components/ProductDescription5";
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
        .select("waiting_for_discount_count, virtual_orders_count")
        .eq("name", "Gold Nutrition Gainer Gold")
        .single();
      
      if (data) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
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
        <ProductCarousel5 />
        <ProductInfo5 />
        <PriceSlider priceData={product?.priceSlider || []} waitingCount={waitingCount} />
        <ProductDescription5 />
        <RelatedProducts currentProduct="gainer" />
      </main>

      <FloatingButton productName="Gold Nutrition Gainer Gold" productId="gainer" />
    </div>
  );
};

export default Product5;