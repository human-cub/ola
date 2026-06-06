import type { CatalogProduct } from "@/hooks/useCatalogProducts";

// ──────────────────────────────────────────────────────────────────────────
// Búsqueda de productos del lado del cliente (el catálogo ya está en memoria).
// Tolerante a acentos y errores de tipeo, con sinónimos del rubro (es-AR) y
// ranking por relevancia. Para el dropdown del header y /catalogo?q=
// ──────────────────────────────────────────────────────────────────────────

/** minúsculas, sin acentos, sin signos, trim */
export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Sinónimos / jerga AR de suplementos. Bidireccional.
const SYNONYM_GROUPS: string[][] = [
  ["proteina", "proteinas", "whey", "protein", "wpc", "wpi", "iso", "isolate", "isolada"],
  ["creatina", "creatine", "creapure", "monohidrato"],
  ["aminoacidos", "aminoacido", "aminos", "amino", "bcaa", "eaa"],
  ["quemador", "quemadores", "fatburner", "termogenico", "definicion", "lipo", "burner"],
  ["ganador", "ganadores", "volumen", "masa", "gainer", "weightgainer"],
  ["preentreno", "pre", "preworkout", "pump", "oxidonitrico", "energia"],
  ["barra", "barras", "bar", "snack", "snacks"],
  ["colageno", "collagen"],
  ["glutamina", "glutamine"],
  ["vitamina", "vitaminas", "multivitaminico", "multi"],
  ["omega", "omega3", "pescado", "fishoil"],
  ["cafeina", "caffeine", "cafe"],
  ["magnesio", "magnesium"],
];

const SYNONYMS: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const norm = group.map((g) => normalize(g));
    for (const term of norm) {
      const set = m.get(term) ?? new Set<string>();
      norm.forEach((t) => set.add(t));
      m.set(term, set);
    }
  }
  return m;
})();

/** Distancia de Levenshtein con corte temprano. */
const levenshtein = (a: string, b: string, max: number): number => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
};

/** Tolerancia a errores según largo (palabras cortas = 0 errores). */
const fuzzyMax = (len: number): number => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

interface IndexedProduct {
  product: CatalogProduct;
  nameWords: string[];
  nameNorm: string;
  brandNorm: string;
  haystack: string;
  words: string[];
}

const buildIndexed = (
  product: CatalogProduct,
  categoryNameBySlug: Map<string, string>,
): IndexedProduct => {
  const nameNorm = normalize(product.name);
  const brandNorm = normalize(product.brandName ?? "");
  const catName = product.categorySlug
    ? categoryNameBySlug.get(product.categorySlug) ?? product.categorySlug
    : "";
  const haystackRaw = [
    product.name,
    product.nameShort ?? "",
    product.size ?? "",
    product.brandName ?? "",
    catName,
    (product.tags ?? []).join(" "),
    product.variants.map((v) => v.flavor ?? "").join(" "),
    product.variants.map((v) => v.sku).join(" "),
  ].join(" ");
  const haystack = normalize(haystackRaw);
  return {
    product,
    nameNorm,
    brandNorm,
    nameWords: nameNorm.split(" ").filter(Boolean),
    haystack,
    words: Array.from(new Set(haystack.split(" ").filter(Boolean))),
  };
};

const expandToken = (token: string): string[] => {
  const syn = SYNONYMS.get(token);
  return syn ? Array.from(syn) : [token];
};

/** Puntaje del token en el índice (0 = no coincide). */
const scoreToken = (idx: IndexedProduct, token: string): number => {
  const variants = expandToken(token);
  let best = 0;
  for (const v of variants) {
    const isSynonym = v !== token;
    if (idx.haystack.includes(v)) {
      if (idx.nameNorm.startsWith(v)) best = Math.max(best, isSynonym ? 60 : 100);
      else if (idx.nameWords.some((w) => w.startsWith(v)))
        best = Math.max(best, isSynonym ? 45 : 80);
      else if (idx.brandNorm.includes(v)) best = Math.max(best, isSynonym ? 35 : 60);
      else best = Math.max(best, isSynonym ? 25 : 40);
      continue;
    }
    const max = fuzzyMax(v.length);
    if (max > 0) {
      for (const w of idx.words) {
        const d = levenshtein(v, w, max);
        if (d <= max) best = Math.max(best, (isSynonym ? 20 : 30) - d * 6);
      }
    }
  }
  return best;
};

export interface SearchResult {
  product: CatalogProduct;
  score: number;
}

let cachedKey: string | null = null;
let cachedIndex: IndexedProduct[] = [];

const getIndex = (
  products: CatalogProduct[],
  categoryNameBySlug: Map<string, string>,
): IndexedProduct[] => {
  const key = `${products.length}:${products[0]?.urlSlug ?? ""}:${products[products.length - 1]?.urlSlug ?? ""}`;
  if (key === cachedKey && cachedIndex.length === products.length) return cachedIndex;
  cachedIndex = products.map((p) => buildIndexed(p, categoryNameBySlug));
  cachedKey = key;
  return cachedIndex;
};

/**
 * Busca y rankea productos. Cada token debe coincidir (directo, sinónimo o
 * fuzzy); el puntaje prioriza el inicio del nombre y penaliza el tipeo.
 */
export const searchProducts = (
  products: CatalogProduct[],
  query: string,
  categoryNameBySlug: Map<string, string> = new Map(),
  limit?: number,
): SearchResult[] => {
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  const index = getIndex(products, categoryNameBySlug);
  const queryNorm = normalize(query);

  const results: SearchResult[] = [];
  for (const idx of index) {
    let total = 0;
    let allMatched = true;
    for (const token of tokens) {
      const s = scoreToken(idx, token);
      if (s <= 0) {
        allMatched = false;
        break;
      }
      total += s;
    }
    if (!allMatched) continue;
    if (idx.nameNorm.includes(queryNorm)) total += 40;
    results.push({ product: idx.product, score: total });
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      a.product.sortOrder - b.product.sortOrder ||
      a.product.name.localeCompare(b.product.name, "es-AR"),
  );
  return limit ? results.slice(0, limit) : results;
};

// ── Recientes (localStorage) ────────────────────────────────────────────────
const RECENT_KEY = "ola:recent-searches:v1";
const RECENT_MAX = 6;

export const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};

export const pushRecentSearch = (q: string) => {
  const term = q.trim();
  if (!term) return;
  try {
    const prev = getRecentSearches().filter(
      (x) => x.toLowerCase() !== term.toLowerCase(),
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev].slice(0, RECENT_MAX)));
  } catch {
    /* quota */
  }
};

export const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
};
