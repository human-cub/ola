import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import instagramIcon from "@/assets/instagram-icon-new.png";
import olaLogo from "@/assets/ola-logo-new.webp";

interface FooterProps {
  isHomePage?: boolean;
}

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/categoria/proteinas", label: "Proteínas" },
  { to: "/categoria/creatinas", label: "Creatinas" },
  { to: "/categoria/aminoacidos", label: "Aminoácidos" },
  { to: "/categoria/aumentadores", label: "Ganadores de masa" },
  { to: "/categoria/barras", label: "Barras y snacks" },
  { to: "/categoria/pre-entrenos", label: "Pre-entrenos" },
  { to: "/categoria/colageno", label: "Colágeno" },
  { to: "/categoria/vitaminas", label: "Vitaminas y minerales" },
];

export const Footer = ({ isHomePage = false }: FooterProps) => {
  return (
    <footer className="bg-muted/50 border-t py-8 px-4">
      <div className="container-lg mx-auto">
        {/* Navigation - always shown */}
        <nav className="mb-6">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
            <Link to="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <img src={olaLogo} alt="Ola Wave Logo" className="w-6 h-6 object-contain" loading="lazy" decoding="async" />
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ola!
              </span>
            </Link>
            <span className="text-muted-foreground/40">|</span>

            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Contact info - only on homepage */}
        {isHomePage && (
          <>
            <div className="border-t pt-6 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 container-lg">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Dirección</h4>
                  <a 
                    href="https://maps.app.goo.gl/ZWBkLMDaPkFZgTb6A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Av. Gral. Mosconi 3147, E, C1419EQK Cdad. Autónoma de Buenos Aires
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Horarios</h4>
                  <p className="text-sm text-muted-foreground">
                    Lunes a Viernes<br />
                    10:00 - 20:00
                  </p>
                </div>
              </div>

              {/* Phones */}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Teléfonos</h4>
                  <div className="flex flex-col gap-1">
                    <a 
                      href="http://wa.me/5491166650878"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      011 6665-0878
                    </a>
                    <a 
                      href="http://wa.me/5491124008565"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      011 2400-8565
                    </a>
                  </div>
                </div>
              </div>

              {/* Email & Social */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Contacto</h4>
                  <a 
                    href="mailto:hola@alaola.com.ar"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors block mb-2"
                  >
                    hola@alaola.com.ar
                  </a>
                  <a 
                    href="https://www.instagram.com/ola.unity/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <img src={instagramIcon} alt="Instagram" className="w-5 h-5" loading="lazy" decoding="async" />
                    @ola.unity
                  </a>
                </div>
              </div>
            </div>
          </>
        )}

        <div className={`${isHomePage ? 'mt-8' : 'mt-2'} pt-4 border-t text-center`}>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OLA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
