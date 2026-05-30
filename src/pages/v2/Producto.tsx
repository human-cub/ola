import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { DynamicProductCarousel } from "@/components/DynamicProductCarousel";
import { GroupBuyPriceBlock } from "@/components/GroupBuyPriceBlock";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import {
  useCatalogProduct,
  useCatalogProducts,
  buildLegacyPriceTiers,
  type CatalogVariant,
} from "@/hooks/useCatalogProducts";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/lib/formatting";

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
  // Main image: variant's own first image if it has one, else first gallery image.
  const variantPrimary =
    selectedVariant.images[0] || product.galleryImages[0] || product.images[0] || null;
  // Shared gallery (other photos common to all flavors): all gallery images
  // except the one currently shown as main. Always show at least the variant
  // primary so the carousel is never empty.
  const otherImages = product.galleryImages.filter((img) => img !== variantPrimary);
  const images = variantPrimary ? [variantPrimary, ...otherImages] : product.galleryImages;

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pb-[24px] pt-[64px]">
        <Breadcrumb items={breadcrumbItems} />
        <div className="max-w-[1088px] px-4 mx-auto gap-4 grid grid-cols-1 lg:grid-cols-[20fr_12fr] lg:justify-center lg:pt-10">
          <div className="contents lg:block">
            <div className="order-1">
              <DynamicProductCarousel
                key={selectedVariant.sku}
                images={images}
                productName={product.name}
              />
            </div>

            <div className="order-2 mt-4 space-y-3 px-2 sm:px-4">
              {product.brandName && (
                product.brandSlug ? (
                  <Link
                    to={`/v2/marcas/${product.brandSlug}`}
                    className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary hover:underline"
                  >
                    {product.brandName}
                  </Link>
                ) : (
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary">
                    {product.brandName}
                  </p>
                )
              )}
              <h1 className="text-2xl font-bold leading-tight">
                {product.name}
                {product.size && <span className="ml-2">{product.size}</span>}
              </h1>

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

            <div className="order-4 px-2 sm:px-4">
              {product.description && (
                <section className="flex justify-center mt-8">
                  <div className="max-w-[72ch] w-full">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      Descripción del Producto
                    </h3>
                    <div
                      className="prose-product space-y-3 text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                </section>
              )}
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

        <RelatedV2Products currentSlug={product.urlSlug} categorySlug={product.categorySlug} />
      </main>

      <Footer />
    </div>
  );
};

export default ProductoV2;

const RelatedV2Products = ({
  currentSlug,
  categorySlug,
}: {
  currentSlug: string;
  categorySlug: string | null;
}) => {
  const { data: all = [] } = useCatalogProducts();
  const items = useMemo(() => {
    const pool = all.filter(
      (p) => p.urlSlug !== currentSlug && (!categorySlug || p.categorySlug === categorySlug),
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [all, currentSlug, categorySlug]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-[1088px] mx-auto px-4 mt-12">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">Otros Productos</h3>
        <p className="text-sm text-muted-foreground">Explorá más opciones de suplementos</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((p) => (
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
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                  {p.brandName}
                </p>
              )}
              <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {p.name}
              </h4>
              {p.size && <p className="text-xs text-blue-500 font-medium">{p.size}</p>}
              <p className="text-lg font-bold text-primary pt-1">{formatPrice(p.priceT3)}</p>
              <p className="text-[10px] text-muted-foreground">(Súper-Precio)</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};