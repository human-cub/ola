import { Users, UserPlus, Calculator, FileCheck, Truck, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Te sumás al grupo del producto",
    description: "Unite a otros compradores interesados en el mismo producto durante de la semana"
  },
  {
    icon: UserPlus,
    title: "Invitás a tus amigos",
    description: "Compartí el grupo con amigos para conseguir mejores precios"
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
        
        <div className="relative max-w-md mx-auto space-y-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isLastStep = index === steps.length - 1;
            
            return (
              <div key={index} className="relative">
                {/* Step Block */}
                 <div
                   className="relative bg-background rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 animate-fade-in mx-6"
                   style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'both' }}
                 >
                   {/* Step Number */}
                   <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                     {index + 1}
                   </div>
                   
                   {/* Icon */}
                   <div className="mb-3 flex justify-center">
                     <div className="w-14 h-14 bg-gradient-primary/10 rounded-full flex items-center justify-center">
                       <IconComponent className="w-7 h-7 text-primary" />
                     </div>
                   </div>
                   
                   {/* Content */}
                   <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                     {step.title}
                   </h3>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    {step.description}
                    {index === 2 && (
                      <span className="block mt-2">
                        Si el grupo llega al máximo antes, hacemos el pedido más rápido
                      </span>
                    )}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};