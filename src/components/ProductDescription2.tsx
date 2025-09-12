export const ProductDescription2 = () => {
  const variants = [
    "Polvo sin sabor",
    "Sabor Frutas Tropicales", 
    "Sabor Limón",
    "Sabor Sandía",
    "Cápsulas (90 unidades)"
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
              <strong className="text-foreground">FitMax Creatine Monohydrate</strong> es un suplemento de creatina monohidrato de máxima pureza, diseñado para mejorar la fuerza, potencia y resistencia muscular durante entrenamientos de alta intensidad.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Cada porción contiene <strong className="text-primary">5 gramos de creatina monohidrato pura</strong>, la forma más estudiada y efectiva de creatina para el rendimiento deportivo.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Producto micronizado para una mejor disolución y absorción. Sin aditivos innecesarios, ideal para atletas que buscan maximizar su rendimiento y acelerar la recuperación.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};