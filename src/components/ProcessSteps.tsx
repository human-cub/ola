import { useState } from "react";
import { Users, ShoppingCart, Calculator, FileCheck, Truck, CreditCard, Package, ClipboardCheck } from "lucide-react";

const waitingListSteps = [
  {
    icon: Users,
    title: "Te sumás a la compra de los productos",
    description: "Sumáte en la lista de espera de lunes a domingo (sin compromiso)"
  },
  {
    icon: Calculator,
    title: "Al final de la semana vemos cuántos se sumaron",
    description: "Calculamos el descuento según cuántas personas se sumaron a cada producto"
  },
  {
    icon: FileCheck,
    title: "El lunes confirmás tu pedido",
    description: "Chequeás los precios finales y confirmás tu pedido en la lista de espera"
  },
  {
    icon: Truck,
    title: "Envío el mismo día después de confirmar o retirás vos cuando quieras",
    description: "Envío gratis en CABA (GBA $3.000 • Interior $5.000 • Gratis en todo el país desde $100.000)"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás los productos y pagás en el momento en efectivo o transferencia"
  }
];

const buyNowSteps = [
  {
    icon: ShoppingCart,
    title: "Elegís tus productos favoritos y hacés clic en \"Comprar ahora\"",
    description: "Compra directa, sin espera"
  },
  {
    icon: ClipboardCheck,
    title: "Completás el pedido en el carrito",
    description: "Sin prepago"
  },
  {
    icon: Truck,
    title: "Te lo llevamos o lo retirás vos",
    description: "Envío gratis en CABA (GBA $3.000 • Interior $5.000\n• Gratis en todo el país desde $100.000)",
    subtitle: "Pedidos antes de las 14:00 hs: entrega el mismo día en CABA y GBA"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás el producto y pagás en el momento en efectivo o transferencia"
  }
];

export const ProcessSteps = () => {
  const [isWaitingList, setIsWaitingList] = useState(true);
  
  const steps = isWaitingList ? waitingListSteps : buyNowSteps;

  return (
    <section className="py-8 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Cómo Funciona?
          </h2>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-6"></div>
          
          {/* Segmented Toggle - centered in viewport, ignoring parent padding */}
          <div className="w-[85vw] max-w-md mx-auto -ml-[calc((85vw-100%)/2)] sm:w-auto sm:max-w-none sm:ml-0 flex bg-muted rounded-full p-1 gap-1">
            <button
              onClick={() => setIsWaitingList(true)}
              style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
              className={`w-1/2 py-2.5 px-2 sm:px-6 rounded-full sm:text-sm font-medium transition-all duration-300 flex items-center justify-center whitespace-nowrap ${
                isWaitingList 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Esperar y pagar menos
            </button>
            <button
              onClick={() => setIsWaitingList(false)}
              style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
              className={`w-1/2 py-2.5 px-2 sm:px-6 rounded-full sm:text-sm font-medium transition-all duration-300 flex items-center justify-center whitespace-nowrap ${
                !isWaitingList 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Comprar ahora
            </button>
          </div>
        </div>
        
        <div className="relative max-w-md mx-auto space-y-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div key={`${isWaitingList ? 'wait' : 'buy'}-${index}`} className="relative">
                {/* Step Block */}
                 <div
                   className="relative bg-background rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 animate-fade-in mx-6"
                   style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                 >
                   {/* Step Number */}
                   <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                     {index + 1}
                   </div>
                   
                   {/* Icon */}
                   <div className="mb-3 flex justify-center">
                     <div className="bg-gradient-primary/10 rounded-full flex items-center justify-center">
                       <IconComponent className="size-14 my-4 text-primary" />
                     </div>
                   </div>
                   
                     <h3 className="text-lg font-semibold text-foreground mb-2 text-center leading-[1.2]">
                       {step.title}
                       {'subtitle' in step && step.subtitle && (
                         <span className="block text-sm font-normal text-muted-foreground mt-1">
                           {step.subtitle as string}
                         </span>
                       )}
                     </h3>
                    <p className="text-muted-foreground text-center text-sm leading-relaxed whitespace-pre-line">
                      {step.description}
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
