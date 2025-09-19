export const ProductDescription2 = () => {
  const variants = [
    "Polvo sin sabor 500g",
    "100% Pura - Creatina Micronizada",
    "Ultra Micronizada para mejor absorción",
    "5 gramos por porción",
    "Máxima pureza"
  ];

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Descripción del Producto
          </h3>
          
          {/* Variants */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-primary">
              Presentaciones Disponibles:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">{variant}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Creatina Monohidrato Star Nutrition</strong> es la unión de tres aminoácidos que ofrece mayores ventajas que la creatina normal, mejorando su asimilación.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              La creatina monohidrato es recomendada durante un plan de entrenamiento para <strong className="text-primary">aumentar la fuerza, resistencia y recuperación</strong>.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Creatina monohidrato micronizada de máxima pureza - 100% Pura.</strong> Producto ultra micronizado para una mejor disolución y absorción óptima.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};