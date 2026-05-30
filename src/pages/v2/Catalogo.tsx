import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useCategories } from "@/hooks/useCategories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { formatPrice } from "@/lib/formatting";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const CatalogoV2 = () => {
  const headerVisible = useScrollHeader();
  const { data: categories = [] } = useCategories({ includeInactive: true });
  const { data: products = [] } = useCatalogProducts();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

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
    return products.filter((p) => {
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
  }, [q, products, categories]);

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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((p) => (
                  <Link
                    key={p.urlSlug}
                    to={`/v2/p/${p.urlSlug}`}
                    className="group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-square bg-muted/30 p-4 flex items-center justify-center">
                      <img
                        src={p.images[0] || "/placeholder.svg"}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={400}
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      {p.brandName && (
                        <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">{p.brandName}</p>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{p.name}</h3>
                      {p.size && <p className="text-xs text-muted-foreground">{p.size}</p>}
                      <p className="text-lg font-bold text-primary pt-1">{formatPrice(p.priceT3)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              {activeCategories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/v2/categoria/${category.slug}`}
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