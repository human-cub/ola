import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel7 } from "@/components/ProductCarousel7";
import { ProductInfo7 } from "@/components/ProductInfo7";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription7 } from "@/components/ProductDescription7";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { getProduct } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

const Product7 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("ena-bars");

  // Fetch initial waiting count and subscribe to realtime updates
  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('waiting_for_discount_count, virtual_orders_count')
        .eq('id', 'ena-bars')
        .single();
      
      if (data && !error) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
      }
    };

    fetchWaitingCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('product-ena-bars-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: 'id=eq.ena-bars'
        },
        (payload) => {
          const newData = payload.new as { waiting_for_discount_count: number; virtual_orders_count: number };
          setWaitingCount(newData.waiting_for_discount_count + newData.virtual_orders_count);
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      <HeroSection />
      <ProductCarousel7 />
      <ProductInfo7 />
      <PriceSlider 
        priceData={product.priceSlider}
        waitingCount={waitingCount}
      />
      <ProductDescription7 />
      <RelatedProducts currentProduct="ena-bars" />
      <FloatingButton productId="ena-bars" productName={product.name} />
    </div>
  );
};

export default Product7;
