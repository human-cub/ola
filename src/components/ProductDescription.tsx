import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription = () => {
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
                  <strong className="text-foreground">TrueMade Whey Protein</strong> es un suplemento de proteína de suero de leche de alta calidad, ideal para deportistas y personas activas que buscan aumentar su masa muscular y mejorar su rendimiento físico.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Cada porción contiene <strong className="text-primary">25 gramos de proteína pura</strong>, con un perfil completo de aminoácidos esenciales que favorecen la recuperación muscular y el crecimiento.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Formulado con ingredientes premium y libre de azúcares añadidos, este producto se disuelve fácilmente en agua o leche, proporcionando un sabor delicioso y una textura suave.
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};