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
        
        <div className="relative max-w-sm mx-auto space-y-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isLastStep = index === steps.length - 1;
            
            return (
              <div key={index} className="relative">
                {/* Step Block */}
                <div
                  className="relative bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 animate-fade-in mx-6"
                  style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'both' }}
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-primary/10 rounded-full flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Curved Connection Lines between block edges */}
                {!isLastStep && (
                  <div className="absolute top-1/2 left-0 w-full h-24 pointer-events-none z-0" style={{ transform: 'translateY(50%)' }}>
                    <svg 
                      className="absolute inset-0 w-full h-full" 
                      viewBox="0 0 100 100"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id={`edgeConnection${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6"/>
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Alternating curved paths from edge center to edge center */}
                      {index % 2 === 0 ? (
                        // Right to left: from right edge center of current block to left edge center of next block
                        <path
                          d="M85 10 Q95 25 95 50 Q95 75 15 90"
                          stroke={`url(#edgeConnection${index})`}
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4,3"
                          className="opacity-80"
                        />
                      ) : (
                        // Left to right: from left edge center of current block to right edge center of next block  
                        <path
                          d="M15 10 Q5 25 5 50 Q5 75 85 90"
                          stroke={`url(#edgeConnection${index})`}
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4,3"
                          className="opacity-80"
                        />
                      )}
                      
                      {/* Small dots at connection points */}
                      <circle cx="85" cy="10" r="1.5" fill="hsl(var(--primary))" opacity="0.6"/>
                      <circle 
                        cx={index % 2 === 0 ? "15" : "85"} 
                        cy="90" 
                        r="1.5" 
                        fill="hsl(var(--primary))" 
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                )}
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