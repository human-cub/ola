import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useCategories } from "@/hooks/useCategories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { CatalogProductCard } from "@/components/v2/CatalogProductCard";
import { CatalogFilters, SortKey, sortProducts } from "@/components/v2/CatalogFilters";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const CatalogoV2 = () => {
  const headerVisible = useScrollHeader();
  const { data: categories = [] } = useCategories({ includeInactive: true });
  const { data: products = [] } = useCatalogProducts();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const [sort, setSort] = useState<SortKey>("popular");

  // Only show categories that have at least one active product (active brand)
  const activeCategories = useMemo(() => {
    const slugsWithProducts = new Set(
      products.map((p) => p.categorySlug).filter((s): s is string => !!s),
    );
    return categories
      .filter((c) => slugsWithProducts.has(c.slug))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, products]);

  const searchResults = useMemo(() => {
    if (!q) return [];
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const matched = products.filter((p) => {
      const cat = categories.find((c) => c.slug === p.categorySlug);
      const hay = norm(
        [
          p.name,
          p.nameShort ?? "",
          p.size ?? "",
          p.brandName ?? "",
          p.categorySlug ?? "",
          cat?.name ?? "",
          (p.tags ?? []).join(" "),
          p.variants.map((v) => v.flavor ?? "").join(" "),
          p.variants.map((v) => v.sku).join(" "),
        ].join(" "),
      );
      return tokens.every((t) => hay.includes(t));
    });
    return sortProducts(matched, sort);
  }, [q, products, categories, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <div className="pt-[120px] sm:pt-[104px]">
        <Breadcrumb items={[{ label: "Catálogo" }]} />
      </div>

      <main className="pb-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-primary bg-clip-text text-transparent">
            {q ? `Resultados: "${q}"` : "Catálogo"}
          </h1>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-2 mb-8" />

          {q ? (
            searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No encontramos productos para tu búsqueda.</p>
            ) : (
              <>
                <CatalogFilters sort={sort} onSortChange={setSort} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                  {searchResults.map((p) => (
                  <CatalogProductCard
                    key={p.urlSlug}
                    urlSlug={p.urlSlug}
                    name={p.name}
                    size={p.size}
                    brandName={p.brandName}
                    image={p.images[0]}
                    priceRetailDisplay={p.priceRetailDisplay}
                    priceT3={p.priceT3}
                  />
                  ))}
                </div>
              </>
            )
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              {activeCategories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/categoria/${category.slug}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    {category.emoji && <span className="text-2xl">{category.emoji}</span>}
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{category.name}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CatalogoV2;