import { getProduct } from "@/data/products";

export const ProductInfo2 = () => {
  const product = getProduct("creatine");
  if (!product) return null;

  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {product.name}
          </h2>
          <p className="text-muted-foreground font-medium mb-4">
            Masa neto: <span className="text-primary font-semibold">{product.weight}</span>
          </p>
          
          {/* Variants */}
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-3 text-primary">
              Presentaciones Disponibles:
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {product.variants?.map((variant, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">{variant}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};