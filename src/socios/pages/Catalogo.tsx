import { memo, useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { searchProducts } from "@/lib/productSearch";
import type { CatalogProduct } from "@/hooks/useCatalogProducts";
import { useSociosProducts, type SociosProduct } from "../hooks/useSociosProducts";
import { useSociosCartCtx } from "../SociosCartProvider";
import type { SociosCartItem } from "../hooks/useSociosCart";
import { formatARS } from "../lib/format";
import { SociosHeader } from "../SociosHeader";
import { BrandBar } from "../BrandBar";

// Tamaño -> número comparable (kg/l -> x1000, lb -> x453.6, g/ml/caps/unid -> tal cual)
const sizeToNumber = (s: string | null | undefined): number => {
  if (!s) return Number.MAX_SAFE_INTEGER;
  const m = s.toLowerCase().replace(",", ".").match(/([\d.]+)\s*(kg|kilo|lbs?|gr?s?|ml|cc|lt?|litros?|c[aá]ps?|comp|unid|sobres?)?/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return Number.MAX_SAFE_INTEGER;
  const unit = m[2] ?? "";
  const mult = unit.startsWith("kg") || unit.startsWith("kilo") || unit === "l" || unit === "lt" || unit.startsWith("litro")
    ? 1000
    : unit.startsWith("lb")
      ? 453.6
      : 1;
  return n * mult;
};

interface RowProps {
  p: SociosProduct;
  line: SociosCartItem | undefined;
  onAdd: (p: SociosProduct, displayName: string, displayImage: string) => void;
  onSetQuantity: (id: string, quantity: number) => void;
}

// Fila memoizada: con catálogos grandes ("Todos") evita re-renderizar las ~900
// filas en cada cambio de carrito. content-visibility saltea el layout/paint
// de las filas fuera de pantalla.
const CatalogRow = memo(({ p, line, onAdd, onSetQuantity }: RowProps) => {
  const qty = line?.quantity ?? 0;
  const rawFirst = p.images?.[0] || "";
  const displayImage = rawFirst.includes("|") ? rawFirst.split("|")[0] : rawFirst;
  const displayName = p.name_short || p.name;

  return (
    <div className="flex items-center gap-3 bg-card border rounded-lg p-2 sm:p-3 [content-visibility:auto] [contain-intrinsic-size:auto_84px]">
      <div className="w-16 h-16 shrink-0 bg-white rounded-md overflow-hidden flex items-center justify-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayName}
            width={64}
            height={64}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-tight line-clamp-2">
          {displayName}
          {p.size ? <span className="text-muted-foreground"> · {p.size}</span> : null}
        </div>
        {p.flavor && (
          <div className="text-xs text-muted-foreground mt-0.5">{p.flavor}</div>
        )}
        {p.brand_name && (
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {p.brand_name}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {qty === 0 ? (
          <Button size="sm" onClick={() => onAdd(p, displayName, displayImage)}>
            Agregar
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => line && onSetQuantity(line.id, qty - 1)}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-7 text-center text-sm font-medium">{qty}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => line && onSetQuantity(line.id, qty + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="text-right shrink-0 w-24 sm:w-28">
        <div className="text-xs text-muted-foreground line-through">
          {formatARS(p.retail_price)}
        </div>
        <div className="text-base font-bold">{formatARS(p.buy_price)}</div>
        {p.discount_pct > 0 && (
          <div className="text-xs text-emerald-600 font-medium">
            -{p.discount_pct}%
          </div>
        )}
      </div>
    </div>
  );
});
CatalogRow.displayName = "CatalogRow";

const Catalogo = () => {
  const { data: products = [], isLoading } = useSociosProducts();
  const { data: brands = [], isLoading: brandsLoading } = useBrands({ includeInactive: true });
  const { data: categories = [] } = useCategories({ includeInactive: true });
  const { items, addItem, setQuantity, findLine } = useSociosCartCtx();
  const [search, setSearch] = useState("");
  // undefined = todavía no se eligió nada (autoseleccionamos la primera marca);
  // null = el usuario eligió "Todos" explícitamente (no pisar con el autoselect).
  const [selectedBrandId, setSelectedBrandId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (brands.length > 0 && selectedBrandId === undefined) {
      setSelectedBrandId(brands[0].id);
    }
  }, [brands, selectedBrandId]);

  // Marca efectiva: antes de que corra el autoselect (efecto) ya filtramos por
  // la primera marca, para no renderizar todo el catálogo en el primer frame.
  const effectiveBrandId =
    selectedBrandId === undefined ? brands[0]?.id ?? undefined : selectedBrandId;

  // Nombre de marca por id: fallback para enriquecer la búsqueda cuando un
  // producto no trae brand_name.
  const brandNameById = useMemo(() => {
    const m = new Map<string, string>();
    brands.forEach((b: any) => {
      if (b.id) m.set(String(b.id), b.name ?? "");
    });
    return m;
  }, [brands]);

  // Nombre de categoría por slug: alimenta el haystack del buscador compartido.
  const categoryNameBySlug = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c: any) => {
      if (c.slug) m.set(String(c.slug), c.name ?? c.slug);
    });
    return m;
  }, [categories]);

  // Adaptamos cada SKU a la forma mínima que entiende searchProducts para usar
  // EXACTAMENTE el mismo motor que la tienda retail (sinónimos AR + tolerancia a
  // tipeo + ranking por relevancia) en vez de un filtro por substring.
  const searchable = useMemo<CatalogProduct[]>(
    () =>
      products.map(
        (p) =>
          ({
            urlSlug: p.url_slug || p.sku,
            name: p.name,
            nameShort: p.name_short,
            size: p.size,
            brandName:
              p.brand_name ?? (p.brand_id ? brandNameById.get(p.brand_id) ?? null : null),
            categorySlug: p.category_slug,
            tags: Array.isArray(p.tags) ? p.tags : [],
            sortOrder: p.sort_order,
            variants: [{ sku: p.sku, flavor: p.flavor }],
          }) as unknown as CatalogProduct,
      ),
    [products, brandNameById],
  );

  const searchActive = search.trim().length > 0;

  // Cuando hay búsqueda: posición por relevancia (sku -> índice) del motor
  // compartido. null = sin búsqueda (usamos el orden por categoría de siempre).
  const rankBySku = useMemo(() => {
    if (!searchActive) return null;
    const ranked = searchProducts(searchable, search, categoryNameBySlug);
    const order = new Map<string, number>();
    ranked.forEach((r, i) => order.set(r.product.variants[0].sku, i));
    return order;
  }, [searchActive, searchable, search, categoryNameBySlug]);

  const filtered = useMemo(() => {
    // Búsqueda activa: ignoramos el filtro de marca (buscamos en todo el
    // catálogo) y ordenamos por relevancia, igual que /catalogo?q= en retail.
    if (rankBySku) {
      return products
        .filter((p) => rankBySku.has(p.sku))
        .sort((a, b) => (rankBySku.get(a.sku) ?? 0) - (rankBySku.get(b.sku) ?? 0));
    }

    // Sin búsqueda: filtro por marca + orden categoría -> nombre -> tamaño ->
    // sabor -> sku.
    const categoryOrder = new Map<string, number>();
    categories.forEach((category, index) => {
      if (category.id) categoryOrder.set(category.id.toLowerCase().trim(), index);
      if (category.slug) categoryOrder.set(category.slug.toLowerCase().trim(), index);
      if (category.name) categoryOrder.set(category.name.toLowerCase().trim(), index);
    });
    const categoryKey = (value: string | null | undefined) =>
      value?.toLowerCase().trim() ?? "";

    return products
      .filter((p) => !(effectiveBrandId && p.brand_id !== effectiveBrandId))
      .sort((a, b) => {
        const ak = categoryKey(a.category_slug);
        const bk = categoryKey(b.category_slug);
        const ai = categoryOrder.get(ak) ?? Number.MAX_SAFE_INTEGER;
        const bi = categoryOrder.get(bk) ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        if (ak !== bk) return ak.localeCompare(bk, "es-AR");
        const an = (a.name_short || a.name).trim();
        const bn = (b.name_short || b.name).trim();
        const nameCmp = an.localeCompare(bn, "es-AR");
        if (nameCmp !== 0) return nameCmp;
        const asz = sizeToNumber(a.size);
        const bsz = sizeToNumber(b.size);
        if (asz !== bsz) return asz - bsz;
        const fl = (a.flavor ?? "").localeCompare(b.flavor ?? "", "es-AR");
        if (fl !== 0) return fl;
        return a.sku.localeCompare(b.sku);
      });
  }, [products, rankBySku, effectiveBrandId, categories]);

  void items; // ensure rerender on cart change

  const handleAdd = useMemo(
    () => (p: SociosProduct, displayName: string, displayImage: string) =>
      void addItem({
        external_sku: p.sku,
        product_name: displayName,
        flavor: p.flavor,
        price_per_unit: p.buy_price,
        product_image: displayImage,
        quantity: 1,
      }),
    [addItem],
  );

  // Hasta que llegue la lista de marcas y se autoseleccione la primera,
  // no mostramos "todo el catálogo" (evita el flash con el contador total).
  const initialBrandPending = brandsLoading && selectedBrandId === undefined && !search.trim();

  return (
    <div className="min-h-screen bg-background pb-32">
      <SociosHeader search={search} onSearchChange={setSearch} />
      <main className="pt-[112px] px-3">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-baseline justify-between mb-3">
            <h1 className="text-xl font-bold">Catálogo Mayorista</h1>
            <span className="text-xs text-muted-foreground">
              {initialBrandPending ? "…" : `${filtered.length} productos`}
            </span>
          </div>

          {(isLoading && products.length === 0) || initialBrandPending ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 bg-card border rounded-lg p-2 sm:p-3">
                  <Skeleton className="w-16 h-16 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <CatalogRow
                  key={p.sku}
                  p={p}
                  line={findLine(p.sku)}
                  onAdd={handleAdd}
                  onSetQuantity={setQuantity}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No hay productos
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <BrandBar selectedBrandId={effectiveBrandId} onSelect={setSelectedBrandId} />
    </div>
  );
};

export default Catalogo;
