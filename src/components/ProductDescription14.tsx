import { Dumbbell, Battery, Zap, Shield } from "lucide-react";

export const ProductDescription14 = () => {
  const benefits = [
    {
      icon: <Battery className="w-5 h-5" />,
      title: "Aumenta la resistencia",
      description: "Durante el entrenamiento"
    },
    {
      icon: <Dumbbell className="w-5 h-5" />,
      title: "Incremento muscular",
      description: "Colabora con la masa muscular"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Recuperación",
      description: "Ayuda en la recuperación post-entreno"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Previene fatiga",
      description: "Evita la fatiga muscular"
    }
  ];

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Descripción del Producto
            </h2>
            <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full"></div>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">CREATINA MONOHIDRATO</span> es un suplemento que facilita la producción de combustible para el músculo en forma de ATP, lo que asegura que tus músculos trabajen de forma más eficiente por más tiempo. Además es el suplemento que más evidencia científica tiene en cuanto a beneficios en el rendimiento y en la salud en general.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Beneficios</h3>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col items-center text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    {benefit.icon}
                  </div>
                  <h4 className="text-xs font-semibold text-foreground mb-1">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">💪</span>
              Modo de Uso
            </h3>
            <p className="text-sm text-muted-foreground">
              Mezclar 1 servicio (5 grs) en 250 cm3 de agua o jugo y consumir con el estómago vacío. Para óptimos resultados, consumir 15-30 minutos antes del entrenamiento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
