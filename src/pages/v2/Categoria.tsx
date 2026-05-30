import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { formatPrice } from "@/lib/formatting";
import { useCategories } from "@/hooks/useCategories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION =
  "Comprá suplementos deportivos al precio mayorista en Argentina. Envío el mismo día en CABA y GBA.";

const CategoriaV2 = () => {
  const { category } = useParams<{ category: string }>();
  const headerVisible = useScrollHeader();
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useCatalogProducts();

  const categoryRow = useMemo(
    () => categories.find((c) => c.slug === category) ?? null,
    [categories, category],
  );

  const filtered = useMemo(
    () => products.filter((p) => p.categorySlug === category),
    [products, category],
  );

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
        <Breadcrumb items={[{ label: "Catálogo", href: "/v2/catalogo" }, { label: name }]} />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
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
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    {p.size && <p className="text-xs text-muted-foreground">{p.size}</p>}
                    <div className="space-y-0.5">
                      {p.priceRetailDisplay > p.priceT3 && (
                        <p className="text-sm text-muted-foreground/70 line-through">
                          {formatPrice(p.priceRetailDisplay)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary">{formatPrice(p.priceT3)}</p>
                      <p className="text-xs text-muted-foreground">(Súper-Precio)</p>
                    </div>
                  </div>
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

export default CategoriaV2;