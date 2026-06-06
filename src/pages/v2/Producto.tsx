import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
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
import { CatalogProductCard } from "@/components/v2/CatalogProductCard";

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION =
  "Comprá suplementos deportivos al precio mayorista en Argentina.";

const ProductoV2 = () => {
  const { urlSlug } = useParams<{ urlSlug: string }>();
  const headerVisible = useScrollHeader();
  const { product, isLoading } = useCatalogProduct(urlSlug);
  const { data: categories = [] } = useCategories();

  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Initialise selected variant
  useEffect(() => {
    if (product && !selectedSku) {
      // ?sku= / ?flavor= в URL (ссылки из админки) предвыбирают вариант
      const qsSku = searchParams.get("sku");
      const qsFlavor = searchParams.get("flavor");
      const bySku = qsSku ? product.variants.find((v) => v.sku === qsSku) : undefined;
      const byFlavor = !bySku && qsFlavor
        ? product.variants.find(
            (v) => (v.flavor ?? "").toLowerCase() === qsFlavor.toLowerCase(),
          )
        : undefined;
      setSelectedSku((bySku ?? byFlavor)?.sku ?? product.variants[0]?.sku ?? null);
    }
  }, [product, selectedSku, searchParams]);

  const selectedVariant: CatalogVariant | null = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.sku === selectedSku) ?? product.variants[0] ?? null;
  }, [product, selectedSku]);

  // SEO
  useEffect(() => {
    if (!product) return;
    const title = product.seoTitle || `${product.name} | Ola! Argentina`;
    const description = product.seoDescription || DEFAULT_DESCRIPTION;
    const canonical = `https://alaola.com.ar/productos/${product.urlSlug}`;
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
        { label: "Catálogo", href: "/catalogo" },
        { label: category.name, href: `/categoria/${category.slug}` },
        { label: product.name },
      ]
    : [{ label: "Catálogo", href: "/catalogo" }, { label: product.name }];

  const flavors = product.variants
    .map((v) => v.flavor)
    .filter((f): f is string => !!f);
  const hasFlavors = flavors.length > 0;

  const legacyPrices = buildLegacyPriceTiers(selectedVariant);
  // Все вкусы товара + данные вариантов для смены вкуса в попапе добавления
  const allFlavors = product.variants.map((v) => v.flavor).filter(Boolean) as string[];
  const variantOptions = product.variants.map((v) => ({
    productId: v.productId,
    flavor: v.flavor,
    image: v.images[0] || product.galleryImages[0] || product.images[0] || null,
    prices: buildLegacyPriceTiers(v),
  }));
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
                    to={`/marcas/${product.brandSlug}`}
                    className="inline-block text-2xl font-bold leading-tight uppercase tracking-wider text-primary hover:underline"
                  >
                    {product.brandName}
                  </Link>
                ) : (
                  <p className="text-2xl font-bold leading-tight uppercase tracking-wider text-primary">
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
                          {v.flavor || "Sin sabor"}
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
                  flavors={allFlavors}
                  preselectedFlavor={selectedVariant.flavor}
                  variantOptions={variantOptions}
                  priceData={legacyPrices}
                  waitingCount={0}
                  brandName={product.brandName}
                  brandSlug={product.brandSlug}
                  productLink={`https://alaola.com.ar/productos/${product.urlSlug}`}
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
          <CatalogProductCard
            key={p.urlSlug}
            urlSlug={p.urlSlug}
            name={p.name}
            size={p.size}
            brandName={p.brandName}
            image={p.images[0]}
            priceRetailDisplay={p.priceRetailDisplay}
            priceSuper={p.priceT4}
            compact
          />
        ))}
      </div>
    </section>
  );
};