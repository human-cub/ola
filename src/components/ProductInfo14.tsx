import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ProductInfo14 = () => {
  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Star Nutrition Creatina Pote
          </h2>
          <p className="text-muted-foreground font-medium mb-4">
            Peso neto: <span className="text-primary font-semibold">150g</span>
          </p>
        </div>
      </div>
    </section>
  );
};
