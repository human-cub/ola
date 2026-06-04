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

const CATEGORIES_CACHE_KEY = "catalog:categories:v1";
const CATEGORIES_CACHE_TTL = 1000 * 60 * 60 * 24;

const readCategoriesCache = (): Category[] | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; data: Category[] };
    if (!parsed?.data || Date.now() - parsed.at > CATEGORIES_CACHE_TTL) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const writeCategoriesCache = (data: Category[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — игнорируем */
  }
};

export const useCategories = (options?: { includeInactive?: boolean }) => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["categories", "external"],
    queryFn: async () => {
      const rows = await fetchCategories();
      writeCategoriesCache(rows);
      return rows;
    },
    staleTime: 1000 * 60 * 5,
    initialData: readCategoriesCache,
    initialDataUpdatedAt: 0, // фоновый рефетч сразу
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