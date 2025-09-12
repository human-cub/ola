import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface RelatedProductsProps {
  currentProduct?: "protein" | "creatine";
}

export const RelatedProducts = ({ currentProduct = "protein" }: RelatedProductsProps) => {
  const products = [
    {
      id: "creatine",
      name: "FitMax Creatine Monohydrate",
      description: "Creatina monohidrato micronizada",
      weight: "500g",
      link: "/product2",
      image: "/lovable-uploads/6c488915-6a0d-4b2b-95ed-83fb84f400db.png"
    },
    {
      id: "protein",
      name: "FitMax Whey Protein Premium",
      description: "Proteína de suero premium",
      weight: "2.27kg",
      link: "/",
      image: "/src/assets/protein-main.jpg"
    }
  ];

  // Filter out current product
  const otherProducts = products.filter(product => product.id !== currentProduct);

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
              <Link 
                key={product.id}
                to={product.link}
                className="block group"
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
                      <p className="text-xs font-medium text-primary">
                        Masa neto: {product.weight}
                      </p>
                    </div>
                    
                    <div className="text-primary group-hover:translate-x-1 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
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