import { ShareBlock } from './ShareBlock';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import * as amplitude from "@amplitude/analytics-browser";

export const ServiceDescription = () => {
  return (
    <section id="service-description" className="py-2">
      <div className="container mx-auto max-w-md md:max-w-[64ch] text-balance">
        <div className="py-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-3 leading-[1.15]">
              ¿Buscás precios más bajos?<br/>
              ¡Basta de pagar de más!
            </h3>
            <p className="text-lg font-semibold text-primary mb-4 leading-[1.15]">
              Comprando de forma colectiva ya no tenés que salir a buscar descuentos: los creamos entre todos
            </p>
          </div>

          <div className="space-y-4 text-foreground">
            <p className="text-sm leading-relaxed">
              Negociamos con proveedores para conseguir precios mayoristas y armamos compras colectivas
            </p>

            <div className="space-y-2">
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                Sin adelantos
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                El descuento depende de cuántos se sumen. Mové el deslizador y mirá cómo baja el precio.
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                Solo necesitás sumarte e invitar a tus amigos para conseguir un mejor precio. Del resto nos encargamos nosotros.
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                Cada colecta dura de lunes a domingo
              </p>
            </div>

            <p className="text-sm leading-relaxed">Cuando se cierra el pedido colectivo, confirmás el pedido y arrancamos con las entregas. Pagás al recibir y revisar el producto en efectivo o transferencia.</p>
            
            <p className="text-sm leading-relaxed font-medium text-primary">
              ¿No querés esperar? Podés comprar ahora mismo sin esperar a la colecta con un 20% de descuento. Si pedís antes de las 14:00 hs, te lo llevamos el mismo día en CABA y GBA!
            </p>

            <ShareBlock showQR />

            <div className="border-t border-border pt-4 mt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>¿Querés que agreguemos un producto?</p>
                <p>¿Querés ser parte, colaborar o proponer algo nuevo?</p>
                <p>¿Tenés preguntas, ideas o críticas?</p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-foreground mb-2">
                  Escribinos: estamos abiertos a escuchar, sumar ideas y mejorar juntos.
                </p>
                <p className="text-sm text-primary font-semibold mb-2">
                  Nuestra meta es que las compras sean más baratas y transparentes.
                </p>
                <p className="text-sm text-primary font-semibold mb-4">
                  ¡Hagámoslo juntos!
                </p>
                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                      console.log("Bottom WhatsApp button clicked");
                      window.open("http://wa.me/5491166650878", "_blank");
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Chateá por WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
