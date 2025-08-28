export const ServiceDescription = () => {
  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-xl p-6 shadow-soft">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              ¿Cansade de los precios inflados?
            </h3>
            <p className="text-lg font-semibold text-primary mb-4">
              ¡Basta de pagar de más! Juntes podemos cambiar las reglas del juego.
            </p>
          </div>

          <div className="space-y-4 text-foreground">
            <p className="text-sm leading-relaxed">
              Negociamos con proveedores para conseguir precios mayoristas y armamos grupos de compra colectiva.
            </p>

            <div className="space-y-2">
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                Sin adelantos.
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                La juntada dura una semana y cierra el domingo a la medianoche.
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                El descuento depende de la cantidad de participantes.
              </p>
            </div>

            <p className="text-sm leading-relaxed">
              El lunes hacemos el pedido al proveedores y arrancamos con las entregas. El pago es en efectivo al recibir y revisar el producto.
            </p>

            <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-sm font-semibold text-primary text-center mb-2">
                ¡Vamos a conseguir el mayor descuento!
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Compartilo con tus amigues — capaz que a elles también les interesa.
              </p>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>¿Necesitás un producto que todavía no está en las juntadas?</p>
                <p>¿Conocés proveedores confiables?</p>
                <p>¿Tenés propuestas o críticas?</p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-foreground mb-2">
                  Escribinos — estamos abiertes a colaborar y escuchar sugerencias.
                </p>
                <p className="text-sm text-primary font-semibold">
                  Nuestra meta es que las compras sean más baratas y más transparentes, sin las mañas de los vendedores. ¡Hagámoslo juntes!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};