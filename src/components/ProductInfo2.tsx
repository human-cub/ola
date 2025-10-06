export const ProductInfo2 = () => {
  const variants = [
    "Polvo sin sabor 500g",
    "100% Pura - Creatina Micronizada",
    "Ultra Micronizada para mejor absorción",
    "5 gramos por porción",
    "Máxima pureza"
  ];

  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Creatina Monohidrato Star Nutrition
          </h2>
          <p className="text-muted-foreground font-medium mb-4">
            Masa neto: <span className="text-primary font-semibold">500 gramos</span>
          </p>
          
          {/* Variants */}
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-3 text-primary">
              Presentaciones Disponibles:
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {variants.map((variant, index) => (
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