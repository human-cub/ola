import instagramIcon from '../assets/instagram-icon-new.png';

export const ServiceDescription = () => {
  return <section id="service-description" className="px-4 py-2">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              ¿Buscás precios más bajos?
            </h3>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              ¡Basta de pagar de más!
            </h3>
            <p className="text-lg font-semibold text-primary mb-4">
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
                El descuento depende de cuántos se sumen. Mové el deslizador y mirá cómo baja el precio
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                Solo necesitás unirte e invitar a tus amigos para conseguir un mejor precio. Del resto nos encargamos nosotros
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                Cada colecta dura una semana (de lunes a domingo). Si se llena antes, hacemos el pedido más rápido
              </p>
            </div>

            <p className="text-sm leading-relaxed">Cuando se cierra el pedido colectivo, compramos al mayorista y arrancamos con las entregas.
Pagás en efectivo al recibir y revisar el producto.</p>

            <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-sm font-semibold text-primary text-center mb-1">
                ¡Seamos más pagamos menos!
              </p>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Vamos a conseguir el mejor descuento — compartilo con tus amigos.
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const text = 'Che! Mirá esto - descuentos increíbles de suplementos 🎉 Podés comprar al precio actual o esperar y pagar menos 🤑 https://ola.lovable.app/';
                    if (navigator.share) {
                      navigator.share({ text }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text);
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Compartir con amigos</span>
                </button>
                
                <button
                  onClick={() => {
                    const text = encodeURIComponent('Che! Mirá esto - descuentos increíbles de suplementos 🎉 Podés comprar al precio actual o esperar y pagar menos 🤑 https://ola.lovable.app/');
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/>
                  </svg>
                  <span>Compartir por WhatsApp</span>
                </button>
                
                <button
                  onClick={() => {
                    const text = 'Che! Mirá esto - descuentos increíbles de suplementos 🎉 Podés comprar al precio actual o esperar y pagar menos 🤑 https://ola.lovable.app/';
                    navigator.clipboard.writeText(text);
                  }}
                  className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copiar invitación</span>
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://ola.lovable.app/');
                  }}
                  className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copiar enlace</span>
                </button>
                
                <div className="border-t border-border/50 pt-2 mt-2" />
                
                <div className="relative w-full p-[2px] rounded-md bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                  <a
                    href="https://www.instagram.com/ola.unity/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-background hover:bg-accent rounded-md py-2.5 px-4 transition-colors text-sm"
                  >
                    <img 
                      src={instagramIcon}
                      alt="Instagram"
                      className="h-5 w-5 flex-shrink-0"
                    />
                    <span className="whitespace-nowrap">Seguinos en Instagram</span>
                  </a>
                </div>
                
                <p className="text-xs text-center text-muted-foreground mb-2">
                  para ofertas, descuentos y novedades
                </p>
                
                <div className="flex flex-col items-center">
                  <div className="w-[180px] h-[180px] aspect-square flex items-center justify-center">
                    <img 
                      src="/qr-code.svg"
                      alt="QR Code"
                      className="w-full h-full object-contain hover:opacity-90 transition-opacity rounded-lg border-2 border-primary/30 hover:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>

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
    </section>;
};