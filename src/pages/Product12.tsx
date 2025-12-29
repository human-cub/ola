import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCarousel12 } from "@/components/ProductCarousel12";
import { ProductInfo12 } from "@/components/ProductInfo12";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription12 } from "@/components/ProductDescription12";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { getProduct } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

const Product12 = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const product = getProduct("creatine-pote");

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('waiting_for_discount_count, virtual_orders_count')
        .eq('id', 'creatine-pote')
        .single();
      if (data && !error) {
        setWaitingCount(data.waiting_for_discount_count + data.virtual_orders_count);
      }
    };
    fetchWaitingCount();

    const channel = supabase
      .channel('product-creatine-pote-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: 'id=eq.creatine-pote' }, (payload) => {
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
      <ProductCarousel12 />
      <ProductInfo12 />
      <PriceSlider priceData={product.priceSlider} waitingCount={waitingCount} />
      <ProductDescription12 />
      <Benefits />
      <ProcessSteps />
      <ServiceDescription />
      <RelatedProducts currentProduct="creatine-pote" />
      <FloatingButton productId="creatine-pote" productName={product.name} />
    </div>
  );
};

export default Product12;
