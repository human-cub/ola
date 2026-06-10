import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useCategories } from "@/hooks/useCategories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useBrands } from "@/hooks/useBrands";
import { CatalogProductCard } from "@/components/v2/CatalogProductCard";
import { CatalogFilters, SortKey, sortProducts } from "@/components/v2/CatalogFilters";
import { usePopularity } from "@/hooks/usePopularity";

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION =
  "Comprá suplementos deportivos al precio mayorista en Argentina. Envío el mismo día en CABA y GBA.";

const CategoriaV2 = () => {
  const { category } = useParams<{ category: string }>();
  const headerVisible = useScrollHeader();
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useCatalogProducts();
  const { data: brands = [] } = useBrands();

  const categoryRow = useMemo(
    () => categories.find((c) => c.slug === category) ?? null,
    [categories, category],
  );

  const categoryProducts = useMemo(
    () => products.filter((p) => p.categorySlug === category),
    [products, category],
  );

  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("popular");

  const availableBrands = useMemo(() => {
    const slugs = new Set(
      categoryProducts.map((p) => p.brandSlug).filter((s): s is string => !!s),
    );
    return brands
      .filter((b) => slugs.has(b.slug))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => ({ value: b.slug, label: b.name }));
  }, [categoryProducts, brands]);

  const { scoreOf } = usePopularity();

  const filtered = useMemo(() => {
    const list =
      brandFilter === "all"
        ? categoryProducts
        : categoryProducts.filter((p) => p.brandSlug === brandFilter);
    return sortProducts(list, sort, scoreOf);
  }, [categoryProducts, brandFilter, sort, scoreOf]);

  useEffect(() => {
    if (!category) return;
    const title = categoryRow?.seo_title || DEFAULT_TITLE;
    const description = categoryRow?.seo_description || DEFAULT_DESCRIPTION;
    const canonical = `https://alaola.com.ar/categoria/${category}`;
    document.title = title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", description);
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalTag) canonicalTag.href = canonical;
    else {
      canonicalTag = document.createElement("link");
      canonicalTag.rel = "canonical";
      canonicalTag.href = canonical;
      document.head.appendChild(canonicalTag);
    }
    return () => {
      document.title = DEFAULT_TITLE;
      if (descTag) descTag.setAttribute("content", DEFAULT_DESCRIPTION);
      if (canonicalTag) canonicalTag.href = "https://alaola.com.ar/";
    };
  }, [category, categoryRow]);

  const name = categoryRow?.name || category || "Categoría";

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      <main className="pb-[24px] pt-[120px] sm:pt-[104px]">
        <Breadcrumb items={[{ label: "Catálogo", href: "/catalogo" }, { label: name }]} />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            {categoryRow?.emoji && <span className="text-3xl">{categoryRow.emoji}</span>}
            <span className="bg-gradient-primary bg-clip-text text-transparent">{name}</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">No hay productos en esta categoría</p>
            </div>
          ) : (
            <>
              <CatalogFilters
                sort={sort}
                onSortChange={setSort}
                filter={brandFilter}
                onFilterChange={setBrandFilter}
                filterLabel="Todas las marcas"
                filterOptions={availableBrands}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                {filtered.map((p) => (
                <CatalogProductCard
                  key={p.urlSlug}
                  urlSlug={p.urlSlug}
                  name={p.name}
                  size={p.size}
                  brandName={p.brandName}
                  image={p.images[0]}
                  priceRetailDisplay={p.priceRetailDisplay}
                  priceSuper={p.priceT4}
                  priceBuyNow={p.priceT1}
                  product={p}
                />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoriaV2;