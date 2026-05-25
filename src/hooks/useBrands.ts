import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const fetchBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, emoji, logo_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as Brand[];
};

export const useBrands = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["brands", "active"],
    queryFn: fetchBrands,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const channel = supabase
      .channel("brands-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands" },
        () => qc.invalidateQueries({ queryKey: ["brands"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
};