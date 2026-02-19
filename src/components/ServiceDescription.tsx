import { ShareBlock } from './ShareBlock';

export const ServiceDescription = () => {
  return (
    <section id="service-description" className="py-2">
      <div className="container mx-auto max-w-md">
        <div className="py-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              ¿Buscás precios más bajos?
            </h3>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              ¡Basta de pagar de más!
            </h3>
            <p className="text-lg font-semibold text-primary mb-4 leading-[1.2]">
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/>
                    </svg>
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
