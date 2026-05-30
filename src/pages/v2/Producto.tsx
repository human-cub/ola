import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { DynamicProductCarousel } from "@/components/DynamicProductCarousel";
import { DynamicProductDescription } from "@/components/DynamicProductDescription";
import { GroupBuyPriceBlock } from "@/components/GroupBuyPriceBlock";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import {
  useCatalogProduct,
  buildLegacyPriceTiers,
  type CatalogVariant,
} from "@/hooks/useCatalogProducts";
import { useCategories } from "@/hooks/useCategories";

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION =
  "Comprá suplementos deportivos al precio mayorista en Argentina.";

const ProductoV2 = () => {
  const { urlSlug } = useParams<{ urlSlug: string }>();
  const headerVisible = useScrollHeader();
  const { product, isLoading } = useCatalogProduct(urlSlug);
  const { data: categories = [] } = useCategories();

  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  // Initialise selected variant
  useEffect(() => {
    if (product && !selectedSku) {
      setSelectedSku(product.variants[0]?.sku ?? null);
    }
  }, [product, selectedSku]);

  const selectedVariant: CatalogVariant | null = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.sku === selectedSku) ?? product.variants[0] ?? null;
  }, [product, selectedSku]);

  // SEO
  useEffect(() => {
    if (!product) return;
    const title = product.seoTitle || `${product.name} | Ola! Argentina`;
    const description = product.seoDescription || DEFAULT_DESCRIPTION;
    const canonical = `https://alaola.com.ar/p/${product.urlSlug}`;
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
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Producto no encontrado</p>
      </div>
    );
  }

  const category = categories.find((c) => c.slug === product.categorySlug);
  const breadcrumbItems = category
    ? [
        { label: "Catálogo", href: "/v2/catalogo" },
        { label: category.name, href: `/v2/categoria/${category.slug}` },
        { label: product.name },
      ]
    : [{ label: "Catálogo", href: "/v2/catalogo" }, { label: product.name }];

  const flavors = product.variants
    .map((v) => v.flavor)
    .filter((f): f is string => !!f);
  const hasFlavors = flavors.length > 0;

  const legacyPrices = buildLegacyPriceTiers(selectedVariant);
  const images = selectedVariant.images.length > 0 ? selectedVariant.images : product.images;

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pb-[24px] pt-[64px]">
        <Breadcrumb items={breadcrumbItems} />
        <div className="max-w-[1088px] px-4 mx-auto gap-4 grid grid-cols-1 lg:grid-cols-[20fr_12fr] lg:justify-center lg:pt-10">
          <div className="contents lg:block">
            <div className="order-1">
              <DynamicProductCarousel images={images} productName={product.name} />
            </div>

            <div className="order-2 mt-4 space-y-3">
              <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
              {product.size && (
                <p className="text-sm text-muted-foreground">{product.size}</p>
              )}

              {hasFlavors && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Sabor</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = v.sku === selectedVariant.sku;
                      return (
                        <button
                          key={v.sku}
                          type="button"
                          onClick={() => setSelectedSku(v.sku)}
                          className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-foreground hover:border-primary/60"
                          }`}
                        >
                          {v.flavor || "Único"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="order-4">
              <DynamicProductDescription description={product.description || ""} />
            </div>
          </div>

          <div className="sticky-viewport lg:contents order-3">
            <div className="contents lg:block">
              <div className="sm:flex sm:justify-center lg:justify-start sm:gap-6 lg:sticky top-[72px]">
                <GroupBuyPriceBlock
                  productName={product.name}
                  productId={selectedVariant.productId}
                  productImage={images[0] ?? null}
                  flavors={selectedVariant.flavor ? [selectedVariant.flavor] : []}
                  priceData={legacyPrices}
                  waitingCount={0}
                  brandName={product.brandName}
                  brandSlug={product.brandSlug}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductoV2;