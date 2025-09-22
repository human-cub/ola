import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface RelatedProductsProps {
  currentProduct?: "protein" | "creatine" | "whey-protein" | "pump-v8" | "gainer";
}

import wheyProteinMain from "@/assets/whey-protein-main.png";
import pumpV8Main from "@/assets/pump-v8-main.png";

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
  const products = [
    {
      id: "creatine",
      name: "Creatina Monohidrato Star Nutrition",
      description: "Creatina monohidrato micronizada",
      weight: "500g",
      link: "/product2",
      image: "https://www.demusculos.com/web/wp-content/uploads/2024/11/creatina-500-grs-star-1.jpg",
      originalPrice: "$45.990",
      discountPrice: "$32.193"
    },
    {
      id: "protein",
      name: "TrueMade Whey Protein",
      description: "Proteína de suero premium",
      weight: "930g",
      link: "/",
      image: "/truemade-protein-main.webp",
      originalPrice: "$89.990",
      discountPrice: "$62.993"
    },
    {
      id: "whey-protein",
      name: "Whey Protein Doypack 2 Lb",
      description: "Proteína en práctico doypack",
      weight: "900g",
      link: "/product3",
      image: wheyProteinMain,
      originalPrice: "$79.990",
      discountPrice: "$55.993"
    },
    {
      id: "pump-v8",
      name: "Star Nutrition Pump V8",
      description: "Pre-entreno de máximo rendimiento",
      weight: "285g",
      link: "/product4",
      image: pumpV8Main,
      originalPrice: "$65.990",
      discountPrice: "$46.193"
    },
    {
      id: "gainer",
      name: "Gold Nutrition Gainer Gold",
      description: "Ganador de masa muscular premium",
      weight: "5 lbs",
      link: "/product5",
      image: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-cbc507a865b208583517254733035648-1024-1024.png",
      originalPrice: "$149.990",
      discountPrice: "$104.993"
    }
  ];

  // Filter out current product
  const otherProducts = products.filter(product => product.id !== currentProduct);

  const handleProductClick = (productLink: string) => {
    // Store scroll target in sessionStorage for cross-page navigation
    sessionStorage.setItem('scrollTarget', 'product-photos');
    
    // Navigate to the product page
    window.location.href = productLink;
  };

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
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
                <Card className="p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft group-hover:scale-[1.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-8 h-8 bg-primary/20 rounded"></div>';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm mb-1 truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.description}
                      </p>
                      <p className="text-xs font-medium text-primary mb-2">
                        Masa neto: {product.weight}
                      </p>
                      
                      {/* Pricing Information */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground line-through">
                            {product.originalPrice}
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {product.discountPrice}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          Precio por 100 pedidos
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-primary group-hover:translate-x-1 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
            
            {/* Placeholder for future products */}
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Próximamente más productos
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};