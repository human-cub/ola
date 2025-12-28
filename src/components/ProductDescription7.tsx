import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription7 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
            <CollapsibleTrigger className="w-full flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">
                Descripción del Producto
              </h3>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="space-y-4 mt-4">
                <p className="text-primary font-bold text-lg">
                  PROTEÍNA DE BOLSILLO, MÁS ENERGÍA + MEJOR DEFINICIÓN.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Protein Bar</strong> es el snack saludable para todos los días. Constituye una muy buena fuente de proteínas y carbohidratos ideal para completar una larga rutina de ejercicios, en un formato fácil de transportar y consumir.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Dos barritas de Protein Bar aportan <strong className="text-foreground">30 gramos de proteína pura</strong> por día.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Constituye un <strong className="text-foreground">alimento funcional</strong>, que al estar reforzado con vitaminas y minerales, permite formar masa muscular al mismo tiempo que provee de energía.
                </p>

                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">Características:</h4>
                  <ul className="text-muted-foreground leading-relaxed space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>15g de proteína por barra</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Snack rico en proteínas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Fácil de transportar y consumir</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Reforzado con vitaminas y minerales</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">Sugerencia de consumo:</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Consumir antes o después del entrenamiento o en cualquier momento del día.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};
