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
        
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="relative bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 animate-fade-in group"
                style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'both' }}
              >
                {/* Connection Lines to Next Step */}
                {index < steps.length - 1 && (
                  <>
                    {/* Desktop Horizontal Line */}
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 transform -translate-y-1/2">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Mobile Side Curved Connections */}
                    <div className="lg:hidden absolute bottom-0 w-full h-16 pointer-events-none">
                      <svg 
                        className="absolute bottom-0 w-full h-16" 
                        viewBox="0 0 100 64" 
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id={`mobileCurve${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7"/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
                          </linearGradient>
                        </defs>
                        
                        {/* Alternating side curves */}
                        {index % 2 === 0 ? (
                          // Right side curve (blocks 1-2, 3-4, 5-6)
                          <>
                            <path
                              d="M85 0 Q100 20 85 40 Q70 60 85 64"
                              stroke={`url(#mobileCurve${index})`}
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray="4,4"
                            />
                            <circle cx="85" cy="64" r="2" fill="hsl(var(--primary))" opacity="0.8"/>
                          </>
                        ) : (
                          // Left side curve (blocks 2-3, 4-5)  
                          <>
                            <path
                              d="M15 0 Q0 20 15 40 Q30 60 15 64"
                              stroke={`url(#mobileCurve${index})`}
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray="4,4"
                            />
                            <circle cx="15" cy="64" r="2" fill="hsl(var(--primary))" opacity="0.8"/>
                          </>
                        )}
                      </svg>
                    </div>
                  </>
                )}
                
                {/* Flow Arrow for Better Connection */}
                {index < steps.length - 1 && index % 3 === 2 && (
                  <div className="hidden lg:block absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center space-x-2 text-primary/60">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-primary/40"></div>
                      <div className="w-3 h-3 border-r-2 border-b-2 border-primary/60 transform rotate-45"></div>
                      <div className="w-8 h-0.5 bg-gradient-to-r from-primary/40 to-transparent"></div>
                    </div>
                  </div>
                )}
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
        
        {/* Process Flow Indicator */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center space-x-4 text-primary/60">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <div className="hidden sm:block text-sm font-medium">Proceso continuo</div>
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40"></div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-sm font-medium">Sin interrupciones</div>
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};