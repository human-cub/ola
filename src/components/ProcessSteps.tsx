import { Users, UserPlus, Calculator, FileCheck, Truck, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Te sumás al grupo del producto",
    description: "Unite a otros compradores interesados en el mismo producto"
  },
  {
    icon: UserPlus,
    title: "Invitás a tus amigos",
    description: "Compartí el grupo con conocidos para conseguir mejores precios"
  },
  {
    icon: Calculator,
    title: "Al final de la semana contamos la cantidad de participantes",
    description: "Calculamos el descuento según la cantidad de personas en el grupo"
  },
  {
    icon: FileCheck,
    title: "Confirmás tu participación completando el formulario de entrega",
    description: "Completás tus datos de entrega una vez confirmado el precio final"
  },
  {
    icon: Truck,
    title: "Te llevamos el producto",
    description: "Coordinamos la entrega en el lugar que nos indiques"
  },
  {
    icon: CreditCard,
    title: "Revisás el pedido y pagás solo al recibirlo",
    description: "Sin riesgos: verificás la calidad y pagás en el momento de la entrega"
  }
];

export const ProcessSteps = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Cómo Funciona?
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-4"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seis simples pasos para conseguir productos de calidad al mejor precio
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="relative bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-primary/10 rounded-full flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-3 text-center min-h-[3rem] flex items-center justify-center">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-center text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Connecting Line - Hidden on mobile */}
        <div className="hidden lg:block relative -mt-32 mb-16">
          <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl" height="2">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="1" x2="100%" y2="1" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5"/>
          </svg>
        </div>
      </div>
    </section>
  );
};