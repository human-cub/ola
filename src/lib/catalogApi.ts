// Каталог витрины: edge-функция catalog-products живёт в pim-pum Supabase
// и деплоится напрямую (без Lovable). Формат ответа идентичен старой
// fetch-external-products, поэтому потребители не меняются.
export const CATALOG_PRODUCTS_URL =
  "https://bqbywleogtdelcmpmnny.supabase.co/functions/v1/catalog-products";

export const fetchCatalogProductsRaw = async <T = unknown>(): Promise<T[]> => {
  const res = await fetch(CATALOG_PRODUCTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`catalog-products: HTTP ${res.status}`);
  const json = (await res.json()) as { products?: T[] };
  return json.products ?? [];
};
