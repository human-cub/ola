import { Users, UserPlus, Calculator, FileCheck, Truck, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Te sumás a la compra del producto (sin prepago)",
    description: "Unite a otros que quieren el mismo producto durante la semana"
  },
  {
    icon: UserPlus,
    title: "Invitás a tus amigos",
    description: "Cuantos más se suman, más baja el precio"
  },
  {
    icon: Calculator,
    title: "Al final de la semana vemos cuántos se sumaron",
    description: "Calculamos el descuento según cuántas personas se sumaron a la compra"
  },
  {
    icon: FileCheck,
    title: "Confirmás tus datos de entrega",
    description: "Te mandamos un mensaje con la info de entrega y el precio final"
  },
  {
    icon: Truck,
    title: "Te llevamos el producto o lo retirás vos",
    description: "Coordinamos lo que te quede más cómodo: envío o retiro"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás el producto y pagás en el momento"
  }
];

export const ProcessSteps = () => {
  return (
    <section className="py-8 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Cómo Funciona?
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-4"></div>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
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
                         Si la compra llega al máximo antes, hacemos el pedido antes
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