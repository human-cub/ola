import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import * as amplitude from "@amplitude/analytics-browser";

const ComoComprar = () => {
  const isVisible = useScrollHeader();

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={isVisible} />

      <main className="container mx-auto px-4 pt-[120px] sm:pt-[104px] pb-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Cómo Comprar
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-8" />

        <div className="space-y-8 mt-10">
          {/* Step 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">1</span>
              Elegí tus productos
            </h2>
            <p className="text-muted-foreground">
              Elegí tus productos y sumate a la compra grupal de cada marca — apretá <strong className="font-semibold text-foreground">"Sumate al grupo"</strong>. Podés estar en varios grupos a la vez. Desde que entrás ya tenés el <strong className="font-semibold text-foreground">Precio Garantizado</strong>.
            </p>
            <p className="text-muted-foreground mt-2">
              También está <strong className="font-semibold text-foreground">"Comprar ahora"</strong>, la opción para llevarlos ya, sin esperar.
            </p>
          </section>

          {/* Step 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">2</span>
              Invitá y compartí para llegar al Súper-Precio
            </h2>
            <p className="text-muted-foreground">
              El <strong className="font-semibold text-foreground">Súper-Precio</strong> se activa cuando los pedidos del grupo suman la meta de la marca. Cada uno paga su producto, y cada persona que sumás acerca el mínimo para todos.
            </p>
          </section>

          {/* Step 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">3</span>
              El lunes conocés tu precio
            </h2>
            <p className="text-muted-foreground">
              Si la marca llegó a la meta pagás el <strong className="font-semibold text-foreground">Súper-Precio</strong>, y si no, te queda el <strong className="font-semibold text-foreground">Precio Garantizado</strong> igual. Esperar siempre te conviene. Después confirmás tu pedido.
            </p>
          </section>

          {/* Step 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm mr-2 align-middle">4</span>
              Coordinamos la entrega
            </h2>
            <p className="text-muted-foreground">
              Envío a domicilio o retiro, como te quede mejor. Pagás al recibirlo, en efectivo o transferencia.
            </p>
            <p className="text-muted-foreground mt-2">
              Envío gratis en CABA · GBA $3.000 · Interior $5.000 · Gratis en todo el país desde $100.000.
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