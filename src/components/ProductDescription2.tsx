export const ProductDescription2 = () => {
  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Descripción del Producto
          </h3>
          
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