import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductDisplay {
  id: string;
  name: string;
  weight: string;
  link: string;
  image: string;
  originalPrice: string;
  discountPrice: string;
}

const fetchProducts = async (): Promise<ProductDisplay[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, weight, link, images, prices')
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return (data || []).map(product => {
    const images = product.images as string[] | null;
    const prices = product.prices as { people: number; price: number }[] | null;
    
    const firstPrice = prices?.[0]?.price || 0;
    const lastPrice = prices?.[prices.length - 1]?.price || 0;

    return {
      id: product.id,
      name: product.name,
      weight: product.weight,
      link: product.link || `/${product.id}`,
      image: images?.[0] || '',
      originalPrice: `$${firstPrice.toLocaleString('es-AR')}`,
      discountPrice: `$${lastPrice.toLocaleString('es-AR')}`
    };
  });
};

export const useProducts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          // Invalidate and refetch when any change happens
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
