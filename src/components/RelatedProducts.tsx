import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import * as amplitude from "@amplitude/analytics-browser";

interface RelatedProductsProps {
  currentProduct?: string;
}

interface ProductItem {
  id: string;
  name: string;
  description: string;
  weight: string;
  link: string;
  image: string;
  originalPrice: string;
  discountPrice: string;
}

export const RelatedProducts = ({ currentProduct = "" }: RelatedProductsProps) => {
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, weight, link, images, prices");

      if (error || !data) {
        console.error("Error fetching products:", error);
        return;
      }

      const formatted = data.map((p) => {
        const images = (p.images as string[]) || [];
        const prices = (p.prices as { people: number; price: number }[]) || [];
        const firstPrice = prices[0]?.price || 0;
        const lastPrice = prices[prices.length - 1]?.price || 0;

        return {
          id: p.id,
          name: p.name,
          description: p.description || "",
          weight: p.weight,
          link: p.link || `/producto/${p.id}`,
          image: images[0] || "",
          originalPrice: `$${firstPrice.toLocaleString("es-AR")}`,
          discountPrice: `$${lastPrice.toLocaleString("es-AR")}`,
        };
      });

      setProducts(formatted);
    };

    fetchProducts();
  }, []);

  // Handle scroll to photos section on page load if coming from product click
  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('scrollTarget');
    if (scrollTarget === 'product-photos') {
      sessionStorage.removeItem('scrollTarget');

      const timer = setTimeout(() => {
        const element = document.getElementById('product-photos');
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Filter out current product and pick 3 random products
  const otherProducts = useMemo(() => {
    const filteredProducts = products.filter((product) => product.id !== currentProduct);
    const shuffled = [...filteredProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [currentProduct, products]);

  const handleProductClick = (productLink: string, productName: string) => {
    amplitude.track('Product Click', { product_name: productName, source: 'related_products' });
    sessionStorage.setItem('scrollTarget', 'product-photos');
    window.location.href = productLink;
  };

  return (
    <section className="sm:px-4 py-6 mt-10">
      <div className="container mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Otros Productos
          </h3>
          <p className="text-sm text-muted-foreground">
            Explorá más opciones de suplementos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 justify-items-center w-fit mx-auto">
          {otherProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product.link)}
              className="block group w-full text-left max-w-[360px] h-full"
            >
              <Card className="p-4 bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300 group-hover:scale-[1.01] w-full h-full max-w-[360px] border border-primary">
                <div className="flex gap-4 h-full">
                  {/* Image - larger and square */}
                  <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-12 h-12 bg-primary/20 rounded"></div>';
                      }}
                    />
                  </div>

                  {/* Content - stacked vertically */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-bold text-foreground text-sm leading-tight mb-1 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs font-medium text-primary">
                        {product.weight}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col mt-1">
                      <div className="flex gap-2 items-baseline">
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">
                            {product.discountPrice}
                          </span>
                          <span className="text-[10px] text-primary font-medium leading-tight text-nowrap">
                            Super-Precio
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-primary self-center group-hover:translate-x-1 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
