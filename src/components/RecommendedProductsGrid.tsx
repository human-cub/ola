import { Link } from "react-router-dom";
import { CatalogProductCard } from "@/components/v2/CatalogProductCard";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";

// Сетка плиток на главной: desktop 4 / tablet 3 / mobile 2.
// Показываем 12 (3 ряда на desktop); на мобиле прячем последние 4 → 8 (4 ряда по 2).
export const RecommendedProductsGrid = () => {
  const { products, isLoading } = useRecommendedProducts(12);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-8" id="products">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Lo más pedido</h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            {products.map((p, i) => (
              <div key={p.urlSlug} className={i >= 8 ? "max-md:hidden" : ""}>
                <CatalogProductCard
                  urlSlug={p.urlSlug}
                  name={p.name}
                  size={p.size}
                  brandName={p.brandName}
                  image={p.images[0]}
                  priceRetailDisplay={p.priceRetailDisplay}
                  priceSuper={p.priceT4}
                  priceBuyNow={p.priceT1}
                />
              </div>
            ))}
          </div>
        )}

        <div className="text-right mt-6">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1 text-primary font-semibold text-lg hover:underline"
          >
            Ver catálogo →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecommendedProductsGrid;
