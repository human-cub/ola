import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription12 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
            <CollapsibleTrigger className="w-full flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Descripción del Producto</h3>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 mt-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">CREATINA MONOHIDRATO</strong> es un suplemento que facilita la producción de combustible para el músculo en forma de ATP, lo que asegura que tus músculos trabajen de forma más eficiente por más tiempo. Además es el suplemento que más evidencia científica tiene en cuanto a beneficios en el rendimiento y en la salud en general.
                </p>
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">BENEFICIOS:</h4>
                  <ul className="text-muted-foreground leading-relaxed space-y-2">
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Aumenta la resistencia durante el entrenamiento</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Colabora con el incremento de la masa muscular</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Ayuda en la recuperación</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Previene la fatiga muscular</span></li>
                  </ul>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">MODO DE USO:</h4>
                  <p className="text-muted-foreground leading-relaxed">Mezclar 1 servicio (5 grs) en 250 cm3 de agua o jugo y consumir con el estómago vacío. Para óptimos resultados, consumir 15-30 minutos antes del entrenamiento.</p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};
