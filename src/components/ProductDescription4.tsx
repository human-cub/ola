import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription4 = () => {
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
                  <strong className="text-foreground">Star Nutrition Pump V8</strong> es un pre-entreno de última generación diseñado para maximizar tu rendimiento en cada sesión de entrenamiento. Su fórmula avanzada combina ingredientes científicamente probados para potenciar tu energía, fuerza y concentración.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Cada porción contiene <strong className="text-primary">6000mg de L-Citrulina, 3200mg de Beta Alanina y 300mg de Cafeína</strong>, creando la combinación perfecta para un pump muscular explosivo y una energía sostenida durante todo tu entrenamiento.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Formulado con ingredientes premium de máxima pureza, Pump V8 se disuelve fácilmente en agua fría, proporcionando un sabor delicioso y una absorción rápida para resultados inmediatos.
                </p>

                <div className="bg-primary/5 rounded-lg p-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-yellow-600">Advertencia:</strong> No exceder 1 scoop por día. No apto para menores de 18 años. Consultar médico antes de usar si tienes condiciones cardíacas.
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