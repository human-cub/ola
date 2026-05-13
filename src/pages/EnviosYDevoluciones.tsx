import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { Truck, Package, MapPin, RefreshCw } from "lucide-react";
import zonasEnvio from "@/assets/zonas-envio.png";

const EnviosYDevoluciones = () => {
  const isVisible = useScrollHeader();

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={isVisible} />

      <main className="container mx-auto px-4 pt-[120px] sm:pt-[104px] pb-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Envíos y Devoluciones
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-10" />

        <div className="space-y-10">
          {/* Mapa de zonas de envío */}
          <section>
            <img
              src={zonasEnvio}
              alt="Mapa de zonas de envío: CABA gratis, GBA $3000"
              className="w-full max-w-md mx-auto h-auto"
              loading="eager"
              decoding="async"
            />
          </section>

          {/* Logística y Envíos */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-primary text-white">
                <Truck className="w-5 h-5" />
              </span>
              Logística y Envíos
            </h2>
            <p className="text-foreground font-medium mb-3">
              ¡Recibilo hoy mismo en CABA y GBA! Hacé tu pedido antes de las 14 hs
            </p>
            <ul className="space-y-2 ml-2 mb-4 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Envío gratis</span> en CABA</li>
              <li><span className="font-semibold text-foreground">GBA:</span> $3.000</li>
              <li><span className="font-semibold text-foreground">Resto del país:</span> $5.000</li>
              <li><span className="font-semibold text-foreground">Envío gratis</span> a todo el país en compras superiores a $100.000</li>
            </ul>
            <p className="text-muted-foreground mb-3">
              ¡Queremos que tus productos lleguen volando! Contamos con logística propia para asegurarnos de que tu pedido te llegue rápido y en perfectas condiciones.
            </p>
            <p className="text-muted-foreground">
              Si estás lejos, ¡no te preocupes! También hacemos envíos a todo el país a través de Andreani y Correo Argentino.
            </p>
          </section>

          {/* Seguimiento */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-primary text-white">
                <Package className="w-5 h-5" />
              </span>
              Seguimiento de tu paquete
            </h2>
            <p className="text-muted-foreground">
              ¡Quedate tranqui! En cuanto despachemos tu compra, te vamos a mandar el código de seguimiento por mail para que puedas ver por dónde anda el paquete en todo momento.
            </p>
          </section>

          {/* Retiro en Persona */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-primary text-white">
                <MapPin className="w-5 h-5" />
              </span>
              Retiro en Persona
            </h2>
            <p className="text-muted-foreground mb-3">
              ¡Vení a visitarnos! Si preferís buscar tu pedido personalmente, te esperamos en nuestro punto de entrega sin ningún costo adicional.
            </p>
            <p className="text-foreground">
              <span className="font-semibold">Dirección:</span>{" "}
              <a
                href="https://maps.app.goo.gl/ZWBkLMDaPkFZgTb6A"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Av. Gral. Mosconi 3147, 3E, Villa Pueyrredón, CABA
              </a>
            </p>
          </section>

          {/* Cambios y Devoluciones */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-primary text-white">
                <RefreshCw className="w-5 h-5" />
              </span>
              Cambios y Devoluciones
            </h2>
            <p className="text-muted-foreground mb-3">
              ¡Tu satisfacción es lo más importante! Queremos que tengas la mejor experiencia con nosotros.
            </p>
            <p className="text-muted-foreground mb-3">
              Si necesitás hacer un cambio o devolución, podés gestionarlo directamente desde tu casa. Solo tenés que escribirnos a{" "}
              <a href="mailto:hola@alaola.com.ar" className="text-primary hover:underline font-medium">
                hola@alaola.com.ar
              </a>{" "}
              y te damos una mano.
            </p>
            <p className="text-muted-foreground">
              Tené en cuenta que las devoluciones se pueden realizar dentro de los <span className="font-semibold text-foreground">10 días corridos</span> posteriores a la compra.
            </p>
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

export default EnviosYDevoluciones;
