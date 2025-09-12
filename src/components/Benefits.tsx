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
    description: "Sin riesgos, pagas cuando tienes tu producto"
  }
];

export const Benefits = () => {
  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <h3 className="text-xl font-semibold text-center mb-6 text-foreground">
          Nuestras Ventajas
        </h3>
        
        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-gradient-card rounded-xl p-4 shadow-soft flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">
                  {benefit.title}
                </h4>
                <p className="text-sm text-muted-foreground">
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