import { useState } from "react";
import { Users, ShoppingCart, Calculator, FileCheck, Truck, CreditCard, Package, ClipboardCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const waitingListSteps = [
  {
    icon: Users,
    title: "Te sumás a la compra del producto",
    subtitle: "(sin compromiso, sin prepago)",
    description: "Sumáte en la lista de espera con otros que quieren el mismo producto de lunes a domingo"
  },
  {
    icon: Users,
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
    title: "El lunes te lo enviamos o lo retirás vos cuando quieras",
    description: "Envío gratis en CABA (GBA $3.000 • Interior $5.000 • Gratis en todo el país desde $100.000)"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás el producto y pagás en el momento en efectivo o transferencia"
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
    description: "Envío gratis en CABA (GBA $3.000 • Interior $5.000 • Gratis en todo el país desde $100.000)",
    subtitle: "Pedidos antes de las 14:00 hs: entrega el mismo día en CABA y GBA"
  },
  {
    icon: CreditCard,
    title: "Revisás y pagás al recibirlo",
    description: "Sin riesgos: revisás el producto y pagás en el momento"
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
          
          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${isWaitingList ? 'text-primary' : 'text-muted-foreground'}`}>
              Esperar y pagar menos
            </span>
            <Switch
              checked={!isWaitingList}
              onCheckedChange={(checked) => setIsWaitingList(!checked)}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary"
            />
            <span className={`text-sm font-medium transition-colors ${!isWaitingList ? 'text-primary' : 'text-muted-foreground'}`}>
              Comprar ahora
            </span>
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
                     <div className="w-14 h-14 bg-gradient-primary/10 rounded-full flex items-center justify-center">
                       <IconComponent className="w-7 h-7 text-primary" />
                     </div>
                   </div>
                   
                    {/* Content */}
                     <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                       {step.title}
                       {'subtitle' in step && step.subtitle && (
                         <span className="block text-sm font-normal text-muted-foreground mt-1">
                           {step.subtitle}
                         </span>
                       )}
                     </h3>
                    <p className="text-muted-foreground text-center text-sm leading-relaxed">
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
