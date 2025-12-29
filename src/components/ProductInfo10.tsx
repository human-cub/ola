import { getProduct } from "@/data/products";

export const ProductInfo10 = () => {
  const product = getProduct("collagen");
  if (!product) return null;

  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
          <p className="text-muted-foreground font-medium mb-4">
            <span className="text-primary font-semibold">{product.weight}</span>
          </p>
          {product.flavors && product.flavors.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sabores Disponibles:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {product.flavors.map((flavor, index) => (
                  <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{flavor}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
