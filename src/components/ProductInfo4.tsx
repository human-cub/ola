import { Card } from "@/components/ui/card";

export const ProductInfo4 = () => {
  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Pre-Entreno de Alto Rendimiento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pump V8 contiene 8 ingredientes activos cientificamente respaldados para maximizar tu rendimiento en el gimnasio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center hover:shadow-glow transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <h3 className="font-semibold mb-2">Energía Explosiva</h3>
            <p className="text-sm text-muted-foreground">
              160mg de cafeína anhidra para máxima energía y focus
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-glow transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-lg">💪</span>
            </div>
            <h3 className="font-semibold mb-2">Fuerza y Resistencia</h3>
            <p className="text-sm text-muted-foreground">
              Beta Alanina y Betaína para entrenamientos más intensos
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-glow transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🩸</span>
            </div>
            <h3 className="font-semibold mb-2">Pump Extremo</h3>
            <p className="text-sm text-muted-foreground">
              L-Citrulina y Arginina para vasodilatación máxima
            </p>
          </Card>
        </div>

        {/* Usage Instructions */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <h3 className="text-xl font-semibold mb-4 text-center">Modo de Uso</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <span className="text-sm">Mezclar 1 scoop (9.5g) en 500ml de agua</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <span className="text-sm">Consumir 15-30 min antes del entrenamiento</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <span className="text-sm">Máximo 2 porciones diarias</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};