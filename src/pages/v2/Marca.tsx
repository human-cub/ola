import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useBrands } from "@/hooks/useBrands";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useCategories } from "@/hooks/useCategories";
import { BrandProgressBar } from "@/components/BrandProgressBar";
import { CatalogProductCard } from "@/components/v2/CatalogProductCard";

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION =
  "Comprá suplementos deportivos al precio mayorista en Argentina. Envío el mismo día en CABA y GBA.";

const MarcaV2 = () => {
  const { slug } = useParams<{ slug: string }>();
  const headerVisible = useScrollHeader();
  const { data: brands = [], isLoading: brandsLoading } = useBrands({ includeInactive: true });
  const { data: products = [], isLoading: prodLoading } = useCatalogProducts();
  const { data: categories = [] } = useCategories({ includeInactive: true });

  const brand = useMemo(() => brands.find((b) => b.slug === slug) ?? null, [brands, slug]);
  const filtered = useMemo(() => {
    const catOrder = new Map<string, number>();
    categories.forEach((c, i) => catOrder.set(c.slug, c.sort_order ?? i));
    const list = products.filter((p) => p.brandSlug === slug);
    return list.sort((a, b) => {
      const ai = a.categorySlug ? catOrder.get(a.categorySlug) ?? 9999 : 9999;
      const bi = b.categorySlug ? catOrder.get(b.categorySlug) ?? 9999 : 9999;
      if (ai !== bi) return ai - bi;
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    });
  }, [products, slug, categories]);

  useEffect(() => {
    if (!slug) return;
    const fallbackTitle = brand
      ? `${brand.name} al Precio Mayorista | Ola! Argentina`
      : DEFAULT_TITLE;
    const fallbackDescription = brand
      ? `Comprá productos ${brand.name} al precio mayorista en Argentina.`
      : DEFAULT_DESCRIPTION;
    const title = brand?.seo_title || fallbackTitle;
    const description = brand?.seo_description || fallbackDescription;
    const canonical = `https://alaola.com.ar/marcas/${slug}`;
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
  }, [slug, brand]);

  const loading = brandsLoading || prodLoading;
  const notFound = !loading && (!brand || !brand.is_active);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      <main className="pb-[24px] pt-[120px] sm:pt-[104px]">
        <Breadcrumb
          items={[
            { label: "Marcas", href: "/v2/marcas" },
            { label: brand?.name || "Marca" },
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          {!notFound && (
            <div className="flex flex-col items-center mb-8 gap-3">
              {brand?.logo_url && (
                <img
                  src={brand.logo_url}
                  alt={`Logo ${brand.name}`}
                  className="h-20 w-auto object-contain"
                  loading="eager"
                  width={200}
                  height={80}
                />
              )}
              <h1 className="text-2xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
                {brand?.name || "Marca"}
              </h1>
              {brand?.slug && (
                <div className="w-full max-w-md mt-2">
                  <BrandProgressBar brandSlug={brand.slug} />
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : notFound ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Marca no encontrada</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">No hay productos de esta marca</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MarcaV2;