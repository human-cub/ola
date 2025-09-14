import { Percent, CreditCard, Shield } from "lucide-react";

const benefits = [
  {
    icon: Percent,
    title: "Descuentos hasta 60%",
    description: "Obtén mejores precios comprando en grupo"
  },
  {
    icon: Shield,
    title: "100% original",
    description: "Trabajamos solo con proveedores oficiales"
  },
  {
    icon: CreditCard,
    title: "Paga al recibir",
    description: "Sin riesgos, pagás cuando tenés tu producto"
  }
];

export const Benefits = () => {
  return (
    <section id="benefits" className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <h3 className="text-xl font-semibold text-center mb-6 text-foreground">
          Nuestras Ventajas
        </h3>
        
        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`${index === 2 
                ? "bg-gradient-primary shadow-elegant border border-primary/20 animate-glow-pulse" 
                : "bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300"
              } rounded-xl p-4 flex items-center gap-4`}
            >
              <div className={`w-12 h-12 ${index === 2 
                ? "bg-white shadow-glow" 
                : "bg-gradient-primary shadow-soft"
              } rounded-full flex items-center justify-center`}>
                <benefit.icon className={`w-6 h-6 ${index === 2 ? "text-primary" : "text-white"}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${index === 2 ? "text-white" : "text-foreground"}`}>
                  {benefit.title}
                </h4>
                <p className={`text-sm ${index === 2 ? "text-white/90" : "text-muted-foreground"}`}>
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};