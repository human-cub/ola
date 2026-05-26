import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
}

const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.functions.invoke(
    "fetch-external-categories",
    { body: {} },
  );
  if (error) throw error;
  const list = ((data as { categories?: Category[] })?.categories ?? []);
  return list;
};

export const useCategories = (options?: { includeInactive?: boolean }) => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["categories", "external"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
    select: (rows) =>
      options?.includeInactive ? rows : rows.filter((r) => r.is_active),
  });

  useEffect(() => {
    const channel = supabase
      .channel("category-overrides-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "category_overrides" },
        () => qc.invalidateQueries({ queryKey: ["categories"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
};