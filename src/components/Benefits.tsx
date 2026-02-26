import { Percent, CreditCard, Shield, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const benefits = [
  {
    icon: Percent,
    title: "Hasta 2 veces más barato",
    description: "Conseguí mejores precios con compras colectivas"
  },
  {
    icon: Shield,
    title: "100% original",
    description: "Garantizado: solo proveedores oficiales"
  },
  {
    icon: Truck,
    title: "Envío gratis en CABA",
    description: "• GBA $3.000\n• Resto del país $5.000\n• Gratis todo $100.000+"
  },
  {
    icon: CreditCard,
    title: "Pagá al recibir",
    description: "Sin riesgos: pagás cuando tenés tu producto"
  }
];

export const Benefits = () => {
  const [isScrollPulsing, setIsScrollPulsing] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrollPulsing(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrollPulsing(false);
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section id="benefits" className="py-4">
      <div className="container mx-auto md:container-lg">
        <h3 className="text-xl font-semibold text-center mb-6 text-foreground">
          Nuestras Ventajas
        </h3>
        
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`${index === 3 
                ? "" 
                : "bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300"
              } rounded-xl p-4 flex items-center gap-4 lg:flex-col lg:items-start`}
            >
              <div className="w-12 h-12 bg-gradient-primary shadow-soft rounded-full flex items-center justify-center flex-shrink-0">
                <benefit.icon className={`w-6 h-6 text-white ${index === 3 && isScrollPulsing ? "animate-pulse" : ""}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 text-foreground md:text-[18px]`}>
                  {benefit.title}
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line md:text-[16px]">
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
