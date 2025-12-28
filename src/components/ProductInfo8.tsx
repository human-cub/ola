import { Package, Leaf } from "lucide-react";

export const ProductInfo8 = () => {
  return (
    <section className="px-4 py-6">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
          {/* Title and Description */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Star Nutrition Just Plant Protein
            </h2>
            <p className="text-muted-foreground text-sm">
              Proteína 100% vegetal sin sabor
            </p>
          </div>

          {/* Weight Info */}
          <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-primary/10 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium">Peso neto: 908g</span>
          </div>

          {/* Product Highlights */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">100% Origen Vegetal</p>
                <p className="text-xs text-muted-foreground">Sin saborizantes ni conservantes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-primary font-bold text-lg">24g</span>
              <div>
                <p className="text-sm font-medium text-foreground">Proteína por Porción</p>
                <p className="text-xs text-muted-foreground">Alto valor biológico</p>
              </div>
            </div>
          </div>

          {/* Flavor Badge */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center">
              Sabor Disponible
            </h3>
            <div className="flex justify-center">
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground">
                Sin sabor
              </span>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-bold text-primary">2 LB</p>
              <p className="text-xs text-muted-foreground">Contenido</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-bold text-primary">30</p>
              <p className="text-xs text-muted-foreground">Porciones</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
