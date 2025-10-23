import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription2 = () => {
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};