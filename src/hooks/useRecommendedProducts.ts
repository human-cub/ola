import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogProducts, type CatalogProduct } from "@/hooks/useCatalogProducts";

// Categorías que NUNCA recomendamos (accesorios/shakers y vacías).
const EXCLUDED_CATEGORIES = new Set(["accesorios", "frutos-secos", "semillas"]);

// Carta de "qué complementa a qué" (cross-sell por categoría), aprobada por Dima.
const COMPLEMENTS: Record<string, string[]> = {
  "proteinas": ["creatinas", "barras-y-snacks", "aminoacidos", "vitaminas-y-minerales", "ganadores-de-masa"],
  "creatinas": ["proteinas", "pre-entrenos", "aminoacidos", "barras-y-snacks"],
  "pre-entrenos": ["creatinas", "aminoacidos", "energy", "proteinas"],
  "aminoacidos": ["proteinas", "creatinas", "recuperadores-musculares", "vitaminas-y-minerales"],
  "ganadores-de-masa": ["proteinas", "creatinas", "barras-y-snacks", "vitaminas-y-minerales"],
  "quemadores": ["proteinas", "electrolitos", "vitaminas-y-minerales", "barras-y-snacks"],
  "recuperadores-musculares": ["proteinas", "aminoacidos", "colageno", "vitaminas-y-minerales"],
  "vitaminas-y-minerales": ["colageno", "proteinas", "superfoods", "electrolitos"],
  "colageno": ["vitaminas-y-minerales", "proteinas", "superfoods"],
  "superfoods": ["vitaminas-y-minerales", "colageno", "proteinas", "almacen"],
  "barras-y-snacks": ["proteinas", "creatinas", "energy"],
  "energy": ["pre-entrenos", "electrolitos", "barras-y-snacks", "creatinas"],
  "electrolitos": ["proteinas", "aminoacidos", "energy", "pre-entrenos"],
  "almacen": ["salsas", "superfoods", "barras-y-snacks"],
  "salsas": ["almacen", "proteinas", "barras-y-snacks"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// IDs de productos que el usuario ya pidió (vacío si no hay sesión — RLS limita al dueño).
async function fetchOrderedProductIds(): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase.from("user_orders").select("items");
  if (error || !data) return [];
  const ids: string[] = [];
  for (const row of data as Array<{ items: unknown }>) {
    const items = (row.items as Array<{ product_id?: string }> | null) ?? [];
    for (const it of items) if (it?.product_id) ids.push(it.product_id);
  }
  return ids;
}

// Popularidad (productId -> total_orders_count) para el fallback "más pedidos".
async function fetchPopularity(): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  const { data, error } = await supabase
    .from("products")
    .select("id, total_orders_count")
    .gt("total_orders_count", 0)
    .order("total_orders_count", { ascending: false })
    .limit(400);
  if (!error && data) {
    for (const r of data as Array<{ id: string; total_orders_count: number | null }>) {
      m.set(r.id, r.total_orders_count ?? 0);
    }
  }
  return m;
}

/**
 * Lista personalizada para la home:
 *  - con historial: lo ya pedido + misma categoría/marca + complementos (carta), mezclado;
 *  - sin sesión/historial: los más pedidos (fallback), sin accesorios.
 */
export function useRecommendedProducts(limit = 12) {
  const { data: catalog = [], isLoading } = useCatalogProducts();
  const { data: orderedIds = [] } = useQuery({
    queryKey: ["recommended", "ordered-ids"],
    queryFn: fetchOrderedProductIds,
    staleTime: 2 * 60 * 1000,
  });
  const { data: popularity } = useQuery({
    queryKey: ["recommended", "popularity"],
    queryFn: fetchPopularity,
    staleTime: 10 * 60 * 1000,
  });

  const products = useMemo<CatalogProduct[]>(() => {
    const usable = catalog.filter(
      (p) => p.categorySlug && !EXCLUDED_CATEGORIES.has(p.categorySlug) && p.priceT4 > 0,
    );
    if (usable.length === 0) return [];

    const popScore = (p: CatalogProduct) => {
      if (!popularity) return 0;
      let s = 0;
      for (const v of p.variants) s = Math.max(s, popularity.get(v.productId) ?? 0);
      return s;
    };

    const orderedSet = new Set(orderedIds);
    const orderedProducts = usable.filter((p) => p.variants.some((v) => orderedSet.has(v.productId)));

    // Fallback (invitado o sin historial): más pedidos; si no hay datos de popularidad, al azar.
    if (orderedProducts.length === 0) {
      const hasPop = popularity && popularity.size > 0;
      const base = hasPop
        ? [...usable].sort((a, b) => popScore(b) - popScore(a) || a.sortOrder - b.sortOrder)
        : shuffle(usable);
      return base.slice(0, limit);
    }

    // Con historial: mezcla de ya-pedido + misma cat/marca + complementos.
    const orderedCats = new Set(orderedProducts.map((p) => p.categorySlug!).filter(Boolean));
    const orderedBrands = new Set(orderedProducts.map((p) => p.brandSlug).filter(Boolean) as string[]);
    const complementCats = new Set<string>();
    orderedCats.forEach((c) => (COMPLEMENTS[c] || []).forEach((cc) => complementCats.add(cc)));

    const orderedSlugs = new Set(orderedProducts.map((p) => p.urlSlug));
    const candidates = usable.filter(
      (p) =>
        !orderedSlugs.has(p.urlSlug) &&
        ((p.categorySlug && orderedCats.has(p.categorySlug)) ||
          (p.brandSlug && orderedBrands.has(p.brandSlug)) ||
          (p.categorySlug && complementCats.has(p.categorySlug))),
    );

    const orderedPick = shuffle(orderedProducts).slice(0, Math.min(6, Math.ceil(limit / 2)));
    const seen = new Set<string>();
    const mixed: CatalogProduct[] = [];
    for (const p of [...orderedPick, ...shuffle(candidates)]) {
      if (!seen.has(p.urlSlug)) {
        seen.add(p.urlSlug);
        mixed.push(p);
      }
    }
    let result = shuffle(mixed).slice(0, limit);

    if (result.length < limit) {
      const have = new Set(result.map((p) => p.urlSlug));
      const backfill = [...usable].sort((a, b) => popScore(b) - popScore(a)).filter((p) => !have.has(p.urlSlug));
      result = [...result, ...backfill].slice(0, limit);
    }
    return result;
  }, [catalog, orderedIds, popularity, limit]);

  return { products, isLoading };
}
