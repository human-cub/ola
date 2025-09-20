import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const ProductDescription4 = () => {
  const ingredients = [
    { name: "Betaína Anhidra", amount: "1500 mg", description: "Mejora la fuerza y potencia muscular" },
    { name: "Beta Alanina", amount: "1500 mg", description: "Reduce la fatiga y mejora la resistencia" },
    { name: "L-Citrulina Malato", amount: "1000 mg", description: "Aumenta el flujo sanguíneo y el pump" },
    { name: "Arginina AKG", amount: "1000 mg", description: "Vasodilatador natural para mejor pump" },
    { name: "Taurina", amount: "400 mg", description: "Mejora la hidratación celular" },
    { name: "L-Tirosina", amount: "400 mg", description: "Aumenta el focus y concentración" },
    { name: "Cafeína Anhidra", amount: "160 mg", description: "Energía y alerta mental" },
    { name: "Extracto de Cacao", amount: "100 mg", description: "Antioxidante natural y mejora del humor" },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Fórmula Completa de 8 Ingredientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Cada ingredient ha sido cuidadosamente seleccionado y dosificado según los últimos estudios científicos para garantizar máxima efectividad
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Ingredients List */}
          <Card className="p-8">
            <h3 className="text-2xl font-semibold mb-6 text-center">Información Nutricional</h3>
            <div className="space-y-4">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex justify-between items-start py-3 border-b border-muted/30 last:border-b-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{ingredient.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
                  </div>
                  <span className="font-semibold text-primary ml-4">{ingredient.amount}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Benefits */}
          <Card className="p-8">
            <h3 className="text-2xl font-semibold mb-6 text-center">¿Por qué elegir Pump V8?</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Fórmula Científicamente Respaldada</h4>
                  <p className="text-sm text-muted-foreground">
                    Cada ingrediente está dosificado según estudios científicos para máxima efectividad
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Sin Rellenos Innecesarios</h4>
                  <p className="text-sm text-muted-foreground">
                    Solo ingredientes activos que realmente funcionan, sin colorantes artificiales excesivos
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Sabores Increíbles</h4>
                  <p className="text-sm text-muted-foreground">
                    4 sabores únicos que hacen que tomar tu pre-entreno sea un placer
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Mezcla Perfecta</h4>
                  <p className="text-sm text-muted-foreground">
                    Se disuelve completamente sin grumos, textura suave y agradable
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Warning */}
        <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <span className="text-amber-600 text-xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Advertencias Importantes</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                No exceder 2 porciones diarias. No consumir si eres sensible a la cafeína. 
                Consulta con tu médico antes de usar si tienes alguna condición médica. 
                Mantener fuera del alcance de los niños.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};