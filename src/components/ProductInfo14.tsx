import { useState, useEffect } from "react";
import { PriceSlider } from "./PriceSlider";
import { supabase } from "@/integrations/supabase/client";

const priceData = [
  { people: 1, price: 24184 },
  { people: 25, price: 21985 },
  { people: 50, price: 19787 },
  { people: 75, price: 17588 },
  { people: 100, price: 16291 },
];

export const ProductInfo14 = () => {
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const fetchWaitingCount = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('waiting_for_discount_count')
        .eq('name', 'Star Nutrition Creatina Pote 150g')
        .single();

      if (!error && data) {
        setWaitingCount(data.waiting_for_discount_count || 0);
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

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
          <div className="text-center mb-4">
            <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-3">
              Creatina
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Star Nutrition Creatina Pote
            </h1>
            <p className="text-muted-foreground text-sm">
              Peso neto: <span className="font-semibold text-foreground">150g</span>
            </p>
          </div>

          <PriceSlider priceData={priceData} waitingCount={waitingCount} />
        </div>
      </div>
    </section>
  );
};
