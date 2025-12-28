import { CheckCircle, Leaf, ChefHat, FlaskConical } from "lucide-react";

export const ProductDescription8 = () => {
  return (
    <section className="px-4 py-6">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
          {/* Title */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Descripción del Producto
            </h3>
            <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full"></div>
          </div>

          {/* Main Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 text-center">
            Just Plant es una proteína sin sabor, de origen 100% vegetal, ideal para dieta proteica. 
            Contiene todos los aminoácidos esenciales y una excelente propiedad emulsificante. 
            Es ideal para sumar proteínas de alto valor Biológico a tus recetas favoritas o 
            como ingrediente principal a tus batidos proteicos.
          </p>

          {/* Benefits Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
              Beneficios
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">Aumento de masa muscular</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">Apto para veganos</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <FlaskConical className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">No contiene saborizantes, endulzantes ni conservantes</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <ChefHat className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">Ideal para cocinar y hornear</p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Modo de Uso
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mezclar 1 servicio en 500 ml de agua. Consumir diariamente 1 o 2 servicios 
              como colación entre las comidas.
            </p>
          </div>

          {/* Certifications */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                Sin TACC
              </span>
              <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                100% Keto
              </span>
              <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                GMO Free
              </span>
              <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                Sin Lactosa
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
