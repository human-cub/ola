import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MapPin, Mail } from "lucide-react";
import instagramIcon from "@/assets/instagram-icon-new.png";
import * as amplitude from "@amplitude/analytics-browser";

const Contacto = () => {
  const isVisible = useScrollHeader();

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={isVisible} />

      <main className="container mx-auto px-4 pt-[120px] sm:pt-[104px] pb-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Contacto
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-8" />

        <div className="text-muted-foreground text-base md:text-lg text-left mb-6 max-w-2xl mx-auto space-y-4">
          <p>
            Mejoramos todos los días para que la plataforma sea cada vez más fácil y cómoda de usar. Por eso, no dudes en escribirnos con tus preguntas, ideas o sugerencias.
          </p>
          <p>
            Además, si no sabés bien qué llevar, nuestros expertos siempre están listos para darte una mano y ayudarte a elegir los suplementos que mejor se adapten a tus objetivos.
          </p>
        </div>

        <p className="text-muted-foreground text-base md:text-lg text-center mb-8">
          Para una respuesta más rápida, escribinos por WhatsApp
        </p>

        <section className="bg-muted/40 rounded-2xl p-6 md:p-8 border border-border/50 mb-8 max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            <a
              href="http://wa.me/5491166650878"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => amplitude.track("Whatsapp Opened", { source: "contacto_page", phone: "5491166650878" })}
              className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <WhatsAppIcon className="w-6 h-6 flex-shrink-0" />
              <span>011 6665-0878</span>
            </a>
            <a
              href="http://wa.me/5491124008565"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => amplitude.track("Whatsapp Opened", { source: "contacto_page", phone: "5491124008565" })}
              className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <WhatsAppIcon className="w-6 h-6 flex-shrink-0" />
              <span>011 2400-8565</span>
            </a>

            <a
              href="mailto:hola@alaola.com.ar"
              className="flex items-center gap-3 px-5 py-4 rounded-xl bg-background border border-border/60 text-foreground font-medium hover:border-primary/50 transition-colors"
            >
              <Mail className="w-6 h-6 flex-shrink-0 text-primary" />
              <span>hola@alaola.com.ar</span>
            </a>

            <a
              href="https://www.instagram.com/ola.unity/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-4 rounded-xl bg-background border border-border/60 text-foreground font-medium hover:border-primary/50 transition-colors"
            >
              <img src={instagramIcon} alt="Instagram" className="w-6 h-6 flex-shrink-0" loading="lazy" decoding="async" />
              <span>Instagram @ola.unity</span>
            </a>
          </div>
        </section>

        <section className="bg-muted/40 rounded-2xl p-6 md:p-8 border border-border/50 max-w-md mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Dirección
          </h2>
          <a
            href="https://maps.app.goo.gl/ZWBkLMDaPkFZgTb6A"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Av. Gral. Mosconi 3147, E, C1419EQK Cdad. Autónoma de Buenos Aires
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contacto;