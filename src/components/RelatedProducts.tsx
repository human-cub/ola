import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { getAllProducts } from "@/data/products";

interface RelatedProductsProps {
  currentProduct?: string;
}


export const RelatedProducts = ({ currentProduct = "protein" }: RelatedProductsProps) => {
  // Handle scroll to photos section on page load if coming from product click
  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('scrollTarget');
    if (scrollTarget === 'product-photos') {
      sessionStorage.removeItem('scrollTarget'); // Clear after use
      
      // Delay to ensure DOM is fully rendered
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
  
  // IMPORTANT: getAllProducts() returns a new array each render, so we memoize it to keep
  // the random selection stable during scroll-triggered re-renders.
  const products = useMemo(() => getAllProducts(), []);

  // Filter out current product and pick 3 random products (stable until currentProduct changes)
  const otherProducts = useMemo(() => {
    const filteredProducts = products.filter((product) => product.id !== currentProduct);
    const shuffled = [...filteredProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [currentProduct, products]);

  const handleProductClick = (productLink: string) => {
    // Store scroll target in sessionStorage for cross-page navigation
    sessionStorage.setItem('scrollTarget', 'product-photos');
    
    // Navigate to the product page
    window.location.href = productLink;
  };

  return (
    <section className="px-4 py-6">
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Otros Productos
          </h3>
          <p className="text-sm text-muted-foreground">
            Explorá más opciones de suplementos
          </p>
        </div>

        <div className="space-y-4">
          {otherProducts.map((product) => (
            <button 
              key={product.id}
              onClick={() => handleProductClick(product.link)}
              className="block group w-full text-left"
            >
              <Card className="p-4 border-0 bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300 group-hover:scale-[1.01]">
                <div className="flex gap-4">
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
                      <h4 className="font-bold text-foreground text-base leading-tight mb-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {product.description}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        {product.weight}
                      </p>
                    </div>
                    
                    {/* Pricing - horizontal */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground line-through">
                        {product.originalPrice}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {product.discountPrice}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (mín.)
                      </span>
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