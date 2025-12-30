import { Percent, CreditCard, Shield, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const benefits = [
  {
    icon: Percent,
    title: "Hasta 3 veces más barato",
    description: "Conseguí mejores precios con compras colectivas"
  },
  {
    icon: Shield,
    title: "100% original",
    description: "Garantizado: solo proveedores oficiales"
  },
  {
    icon: Truck,
    title: "Envío gratis",
    description: "Recibí tu pedido sin costo adicional dentro de CABA"
  },
  {
    icon: CreditCard,
    title: "Pagá al recibir",
    description: "Sin riesgos: pagás cuando tenés tu producto"
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
    <section id="benefits" className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <h3 className="text-xl font-semibold text-center mb-6 text-foreground">
          Nuestras Ventajas
        </h3>
        
        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`${index === 3 
                ? "shadow-elegant border border-primary/20 animate-glow-pulse" 
                : "bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300"
              } rounded-xl p-4 flex items-center gap-4`}
            >
              <div className="w-12 h-12 bg-gradient-primary shadow-soft rounded-full flex items-center justify-center">
                <benefit.icon className={`w-6 h-6 text-white ${index === 3 && isScrollPulsing ? "animate-pulse" : ""}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${index === 3 ? "text-foreground" : "text-foreground"}`}>
                  {benefit.title}
                </h4>
                <p className={`text-sm ${index === 3 ? "text-muted-foreground" : "text-muted-foreground"}`}>
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