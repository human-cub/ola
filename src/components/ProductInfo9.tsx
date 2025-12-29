import { getProduct } from "@/data/products";

export const ProductInfo9 = () => {
  const product = getProduct("omega3");
  if (!product) return null;

  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {product.name}
          </h2>
          <p className="text-muted-foreground font-medium mb-4">
            <span className="text-primary font-semibold">{product.weight}</span>
          </p>
        </div>
      </div>
    </section>
  );
};
