import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { v5 as uuidv5 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogProductsRaw } from "@/lib/catalogApi";

// Stable namespace used to derive deterministic UUIDs from external SKUs.
const SKU_NAMESPACE = "8c3e6e5e-1234-4abc-8def-000000000001";
export const skuToUuid = (sku: string) => uuidv5(sku, SKU_NAMESPACE);

export interface CatalogVariant {
  sku: string;
  productId: string; // deterministic UUID per SKU (used for cart/waiting list)
  flavor: string | null;
  images: string[];
  priceT1: number;
  priceT2: number;
  priceT3: number;
  priceT4: number;
  priceRetailDisplay: number;
}

export interface CatalogProduct {
  urlSlug: string;
  name: string;
  nameShort: string | null;
  size: string | null;
  description: string | null;
  images: string[];
  /** Union of every variant's images, deduplicated, used as shared gallery. */
  galleryImages: string[];
  brandId: string | null;
  brandName: string | null;
  brandSlug: string | null;
  categorySlug: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  sortOrder: number;
  // Display prices (taken from first variant; assumed equal across flavors)
  priceT1: number;
  priceT2: number;
  priceT3: number;
  priceT4: number;
  priceRetailDisplay: number;
  variants: CatalogVariant[];
}

interface RawExternalProduct {
  sku: string;
  name: string;
  name_short: string | null;
  flavor: string | null;
  size: string | null;
  category_slug: string | null;
  url_slug: string | null;
  images: string[];
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  description_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  tags: string[];
  price_retail_display: number;
  price_t1: number;
  price_t2: number;
  price_t3: number;
  price_t4: number;
}

const fetchExternal = async (): Promise<RawExternalProduct[]> =>
  fetchCatalogProductsRaw<RawExternalProduct>();

const fetchInactiveBrandSlugs = async (): Promise<Set<string>> => {
  const { data } = await supabase
    .from("brand_collection_public" as any)
    .select("slug, is_active");
  return new Set(
    (data ?? []).filter((b: any) => b.is_active === false).map((b: any) => b.slug),
  );
};

interface WeeklyPriceSet {
  retail: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
}

const fetchThisWeekPrices = async (): Promise<Map<string, WeeklyPriceSet>> => {
  const { data, error } = await supabase
    .from("sku_prices_public")
    .select("sku, this_week_prices")
    .not("this_week_prices", "is", null);
  if (error) throw error;
  const map = new Map<string, WeeklyPriceSet>();
  for (const r of ((data ?? []) as unknown) as Array<{
    sku: string;
    this_week_prices: WeeklyPriceSet | null;
  }>) {
    if (r.this_week_prices) map.set(r.sku, r.this_week_prices);
  }
  return map;
};

const groupByUrlSlug = (
  rows: RawExternalProduct[],
  inactiveBrandSlugs: Set<string>,
  weeklyPrices: Map<string, WeeklyPriceSet>,
): CatalogProduct[] => {
  const groups = new Map<string, RawExternalProduct[]>();
  for (const r of rows) {
    if (!r.url_slug) continue;
    if (r.brand_slug && inactiveBrandSlugs.has(r.brand_slug)) continue;
    // Hide SKUs that have no frozen "this week" snapshot yet (e.g. brand-new
    // products added mid-week). They will appear after the next Monday freeze.
    const wk = weeklyPrices.get(r.sku);
    if (!wk) continue;
    const arr = groups.get(r.url_slug) ?? [];
    arr.push({
      ...r,
      price_retail_display: wk.retail || r.price_retail_display,
      price_t1: wk.t1 || r.price_t1,
      price_t2: wk.t2 || r.price_t2,
      price_t3: wk.t3 || r.price_t3,
      price_t4: wk.t4 || r.price_t4,
    });
    groups.set(r.url_slug, arr);
  }

  const out: CatalogProduct[] = [];
  for (const [urlSlug, variants] of groups) {
    // Preserve DB order of variants (flavors) — do NOT sort.
    const first = variants[0];
    // Build a shared gallery: union of every variant's images, in order, deduped.
    const seen = new Set<string>();
    const galleryImages: string[] = [];
    for (const v of variants) {
      for (const img of v.images) {
        if (!seen.has(img)) {
          seen.add(img);
          galleryImages.push(img);
        }
      }
    }
    // Fallback primary image for product card listings: first non-empty.
    const primaryImages =
      first.images.length > 0 ? first.images : galleryImages;
    out.push({
      urlSlug,
      name: first.name_short || first.name,
      nameShort: first.name_short,
      size: first.size,
      description: first.description_html,
      images: primaryImages,
      galleryImages,
      brandId: first.brand_id,
      brandName: first.brand_name,
      brandSlug: first.brand_slug,
      categorySlug: first.category_slug,
      seoTitle: first.seo_title,
      seoDescription: first.seo_description,
      tags: first.tags,
      sortOrder: first.sort_order,
      priceT1: first.price_t1,
      priceT2: first.price_t2,
      priceT3: first.price_t3,
      priceT4: first.price_t4,
      priceRetailDisplay: first.price_retail_display,
      variants: variants.map((v) => ({
        sku: v.sku,
        productId: skuToUuid(v.sku),
        flavor: v.flavor,
        // Per-variant images stay raw (may be empty). Fallback is handled in UI
        // using the shared galleryImages so we know which is "own" vs "shared".
        images: v.images,
        priceT1: v.price_t1,
        priceT2: v.price_t2,
        priceT3: v.price_t3,
        priceT4: v.price_t4,
        priceRetailDisplay: v.price_retail_display,
      })),
    });
  }
  out.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  // Ocultar productos sin precio (todas las tarifas en 0): no se pueden comprar
  // y no deben aparecer en catálogo, búsqueda, "Otros Productos" ni carruseles.
  // (p. ej. shakers/accesorios sin precio cargado.) Reaparecen al cargar precio.
  return out.filter(
    (p) => p.priceRetailDisplay > 0 || p.priceT1 > 0 || p.priceT4 > 0,
  );
};

// Кэш последнего удачного каталога: первый рендер мгновенный (без «флэша»
// старой главной), свежие данные подтягиваются в фоне (как в socios).
const CATALOG_CACHE_KEY = "catalog:products:v2";
const CATALOG_CACHE_TTL = 1000 * 60 * 60 * 24;

const readCatalogCache = (): CatalogProduct[] | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; data: CatalogProduct[] };
    if (!parsed?.data || Date.now() - parsed.at > CATALOG_CACHE_TTL) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const writeCatalogCache = (data: CatalogProduct[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — игнорируем */
  }
};

export const useCatalogProducts = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["catalog-products", "v2"],
    queryFn: async () => {
      const [rows, inactive, weekly] = await Promise.all([
        fetchExternal(),
        fetchInactiveBrandSlugs(),
        fetchThisWeekPrices(),
      ]);
      const grouped = groupByUrlSlug(rows, inactive, weekly);
      writeCatalogCache(grouped);
      return grouped;
    },
    staleTime: 1000 * 60 * 5,
    initialData: readCatalogCache,
    initialDataUpdatedAt: 0, // считаем кэш устаревшим — фоновый рефетч сразу
  });

  useEffect(() => {
    const channel = supabase
      .channel("brand-overrides-catalog")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_overrides" },
        () => qc.invalidateQueries({ queryKey: ["catalog-products"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
};

export const useCatalogProduct = (urlSlug: string | undefined) => {
  const { data, ...rest } = useCatalogProducts();
  const product = useMemo(
    () => (urlSlug ? data?.find((p) => p.urlSlug === urlSlug) ?? null : null),
    [data, urlSlug],
  );
  return { product, ...rest };
};

/**
 * Builds the legacy `prices` tier array expected by GroupBuyPriceBlock and
 * AddToCartDialog from the external T0-T4 prices. The `people` thresholds
 * are synthetic (1/25/50/75/100) and unused in v2 — the brand-level money
 * progress drives all UI in the new system.
 */
// Лестница страницы товара: [0] Retail, [1] Comprar Ahora (t1),
// [2] Precio Garantizado (t3), [3] Súper-Precio (t4)
export const buildLegacyPriceTiers = (v: CatalogVariant) => [
  { people: 1, price: v.priceRetailDisplay },
  { people: 25, price: v.priceT1 },
  { people: 50, price: v.priceT3 },
  { people: 75, price: v.priceT4 },
  { people: 100, price: v.priceT4 },
];