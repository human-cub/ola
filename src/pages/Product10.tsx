import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel10 } from "@/components/ProductCarousel10";
import { ProductInfo10 } from "@/components/ProductInfo10";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription10 } from "@/components/ProductDescription10";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { getProduct } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

const Product10 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("collagen");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('waiting_for_discount_count, virtual_orders_count')
        .eq('id', 'collagen')
        .single();
      if (data && !error) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
      }
    };
    fetchWaitingCount();

    const channel = supabase
      .channel('product-collagen-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: 'id=eq.collagen' }, (payload) => {
        const newData = payload.new as { waiting_for_discount_count: number; virtual_orders_count: number };
        setWaitingCount(newData.waiting_for_discount_count + newData.virtual_orders_count);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) setHeaderVisible(false);
      else setHeaderVisible(true);
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
      <ProductCarousel10 />
      <ProductInfo10 />
      <PriceSlider priceData={product.priceSlider} waitingCount={waitingCount} />
      <ProductDescription10 />
      <RelatedProducts currentProduct="collagen" />
      <FloatingButton productId="collagen" productName={product.name} />
    </div>
  );
};

export default Product10;
