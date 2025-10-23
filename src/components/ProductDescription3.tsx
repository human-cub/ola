import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription3 = () => {
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
                  <strong className="text-foreground">Whey Protein Doypack 2 Lb Star Nutrition</strong> es un suplemento de proteína de suero de leche concentrada de alta calidad, ideal para el desarrollo y mantenimiento de la masa muscular.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Cada porción aporta <strong className="text-primary">24 gramos de proteína</strong> con un perfil completo de aminoácidos esenciales que favorecen la síntesis proteica y la recuperación muscular post-entrenamiento.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Presentación en práctico doypack de 2 libras (900g)</strong> que facilita su almacenamiento y uso. Se disuelve fácilmente en agua o leche, ofreciendo un sabor delicioso y una textura cremosa.
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};