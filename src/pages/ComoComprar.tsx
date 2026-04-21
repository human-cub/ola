import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HowToBuyVideo } from "@/components/HowToBuyVideo";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import * as amplitude from "@amplitude/analytics-browser";

const ComoComprar = () => {
  const isScrolled = useScrollHeader();

  return (
    <div className="min-h-screen bg-background">
      <Header isScrolled={isScrolled} />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Cómo Comprar
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-8" />

        <HowToBuyVideo />

        <div className="space-y-8 mt-10">
          {/* Step 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">1</span>
              Elegí tus productos
            </h2>
            <p className="text-muted-foreground mb-3">Tenés dos modalidades:</p>
            <ul className="space-y-3 ml-2">
              <li className="text-foreground">
                <span className="font-semibold">Compra grupal:</span>{" "}
                <span className="text-muted-foreground">
                  Hacé clic en "Esperar y pagar menos" para unirte a la colecta. A medida que más personas se suman, el precio baja en tiempo real
                </span>
              </li>
              <li className="text-foreground">
                <span className="font-semibold">Compra inmediata:</span>{" "}
                <span className="text-muted-foreground">
                  Si no podés esperar, elegí "Comprar ahora" para llevarlo ya con un 20% de descuento
                </span>
              </li>
            </ul>
          </section>

          {/* Step 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">2</span>
              Tus datos y envío
            </h2>
            <p className="text-muted-foreground">
              Completá tu info de contacto y decinos dónde querés recibir el pedido. El envío es gratis en CABA, y para compras desde $100.000, gratis a todo el país.
            </p>
          </section>

          {/* Step 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">3</span>
              Confirmación y pago
            </h2>
            <p className="text-muted-foreground mb-3">¡Cero riesgo y sin prepago!</p>
            <ul className="space-y-3 ml-2">
              <li className="text-foreground">
                <span className="font-semibold">Grupal:</span>{" "}
                <span className="text-muted-foreground">
                  La colecta cierra el domingo a la medianoche. Ahí se fija el precio final y confirmás tu pedido
                </span>
              </li>
              <li className="text-foreground">
                <span className="font-semibold">Inmediata:</span>{" "}
                <span className="text-muted-foreground">
                  Confirmás tu compra en el momento
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-3">
              En ambos casos, pagás recién cuando tenés el producto en la mano y verificás que todo esté perfecto.
            </p>
          </section>

          {/* Step 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">4</span>
              ¡Listo!
            </h2>
            <p className="text-muted-foreground">
              Te va a llegar un e-mail con el detalle. Los pedidos de "Comprar ahora" se despachan en el mismo día (CABA y GBA). Los pedidos grupales te llegan al inicio de la semana.
            </p>
          </section>

          {/* WhatsApp CTA */}
          <section className="bg-muted/50 rounded-2xl p-6 text-center border border-border/50">
            <p className="text-foreground mb-4">
              💬 ¿Tenés dudas? Escribinos por WhatsApp
            </p>
            <a
              href="https://wa.me/5491166650878"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => amplitude.track('Whatsapp Opened', { source: 'como_comprar' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <WhatsAppIcon className="w-5 h-5" />
              011 6665-0878
            </a>
          </section>

          <div className="text-center pt-4">
            <Link to="/catalogo" className="text-primary hover:underline font-medium">
              Ver catálogo →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComoComprar;