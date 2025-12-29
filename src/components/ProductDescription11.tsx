import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ProductDescription11 = () => {
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
                  El <strong className="text-foreground">Citrato de Magnesio</strong> es un suplemento que favorece el metabolismo energético normal y ayuda a disminuir el cansancio y la fatiga. Asimismo, participa en el correcto funcionamiento del sistema nervioso y muscular. También contribuye a la síntesis proteica y al mantenimiento de huesos en condiciones normales.
                </p>
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">BENEFICIOS:</h4>
                  <ul className="text-muted-foreground leading-relaxed space-y-2">
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Ayuda a descansar mejor y reduce la fatiga</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Relaja los músculos para una mejor recuperación</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Favorece el funcionamiento del sistema nervioso</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Contribuye al mantenimiento de huesos y músculos</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Regula la función intestinal</span></li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Libre de Gluten y T.A.C.C</span></li>
                  </ul>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">MODO DE USO:</h4>
                  <p className="text-muted-foreground leading-relaxed">Mezclar una medida en 300 ml de agua.</p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};
