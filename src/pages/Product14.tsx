import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCarousel14 } from "@/components/ProductCarousel14";
import { ProductInfo14 } from "@/components/ProductInfo14";
import { PriceSlider } from "@/components/PriceSlider";
import { ProductDescription14 } from "@/components/ProductDescription14";
import { RelatedProducts } from "@/components/RelatedProducts";
import { HeroSection } from "@/components/HeroSection";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceDescription } from "@/components/ServiceDescription";
import { FloatingButton } from "@/components/FloatingButton";
import { supabase } from "@/integrations/supabase/client";

const priceData = [
  { people: 1, price: 24184 },
  { people: 25, price: 21985 },
  { people: 50, price: 19787 },
  { people: 75, price: 17588 },
  { people: 100, price: 16291 },
];

const Product14 = () => {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data } = await supabase
        .from('products')
        .select('waiting_for_discount_count, virtual_orders_count')
        .eq('name', 'Star Nutrition Creatina Pote 150g')
        .single();

      if (data) {
        setWaitingCount((data.waiting_for_discount_count || 0) + (data.virtual_orders_count || 0));
      }
    };

    fetchWaitingCount();

    const channel = supabase
      .channel('product-creatine-pote-150-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          fetchWaitingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeader);
    
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={showHeader} />
      <main className="pb-24">
        <ProductCarousel14 />
        <ProductInfo14 />
        <PriceSlider priceData={priceData} waitingCount={waitingCount} />
        <ProductDescription14 />
        <RelatedProducts currentProduct="creatine-pote-150" />
        <HeroSection />
        <Benefits />
        <ProcessSteps />
        <ServiceDescription />
      </main>
      <FloatingButton 
        productName="Star Nutrition Creatina Pote 150g"
        productId="creatine-pote-150"
      />
    </div>
  );
};

export default Product14;
