import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { Button } from "@/components/ui/button";

const QuienesSomos = () => {
  const isVisible = useScrollHeader();

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={isVisible} />

      <main className="container mx-auto px-4 pt-[120px] sm:pt-[104px] pb-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Quiénes Somos
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-8" />

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Ola: Consumo inteligente y compras colectivas
        </h2>

        <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
          Ola nace como una alternativa directa a las compras impulsivas y los sobreprecios. Nuestra propuesta es el shopping inteligente: una comunidad de personas que se suman para acceder a productos de alta calidad pagando mucho menos. En lugar de depender de rebajas artificiales, negociamos condiciones mayoristas y creamos los descuentos entre todos.
        </p>

        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
          Nuestra mecánica
        </h3>

        <div className="space-y-6 mb-8">
          <section className="bg-muted/40 rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Precios que construimos juntos
            </h4>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Más pedidos en la marca, precio más bajo para todos — así de simple.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para orientarte, mostramos tres referencias: <strong className="text-foreground">Retail</strong> es el precio de mercado, <strong className="text-foreground">Precio Garantizado</strong> es el que te llevás sí o sí por sumarte al grupo (siempre por debajo del retail, llegues o no a la meta), y <strong className="text-foreground">Súper-Precio</strong> es el mínimo que se destraba cuando el grupo llega a la meta. Cada pedido de la marca suma, y cuando entre todos llegamos al monto, el Súper-Precio queda activado para todos.
            </p>
          </section>

          <section className="bg-muted/40 rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Cero pagos por adelantado
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Participar en el grupo no tiene costo previo. Pagás recién cuando recibís y revisás el producto en tus manos, ya sea en efectivo o por transferencia.
            </p>
          </section>

          <section className="bg-muted/40 rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Ciclos de lunes a domingo
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Cada grupo corre de lunes a domingo a medianoche. Llegando a la meta te llevás el Súper-Precio; si no, igual te queda el Precio Garantizado. Confirmás el pedido en tu cuenta y salen las entregas.
            </p>
          </section>

          <section className="bg-muted/40 rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Comprá ahora
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              ¿No podés esperar? Tenés habilitada la opción de compra tradicional con un <strong className="text-foreground">20% de descuento</strong> directo. Además, si confirmás tu pedido antes de las <strong className="text-foreground">14:00 hs</strong>, te lo entregamos en el mismo día en CABA y GBA.
            </p>
          </section>
        </div>

        <p className="text-foreground text-base md:text-lg text-center font-medium mb-8 leading-relaxed">
          Sumate a la Ola. Consumo consciente, precios reales y el respaldo de comprar en comunidad.
        </p>

        <div className="flex justify-center">
          <Link to="/catalogo">
            <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 px-8">
              Ver catálogo
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuienesSomos;
