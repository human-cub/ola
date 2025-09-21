export const ProductDescription5 = () => {
  const flavors = [
    "Chocolate Creme",
    "Vainilla Creme"
  ];

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Descripción del Producto
          </h3>
          
          {/* Flavors */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-primary">
              Sabores Disponibles:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {flavors.map((flavor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">{flavor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Gainer Gold</strong> es un ganador de masa muscular premium, construido sobre una base de proteína láctea concentrada con un aporte de caseína y suplementada con creatina monohidrato. Su formulación 8 en 1 te ayuda a aumentar la masa muscular y reducir el tiempo de recuperación.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Contiene <strong className="text-primary">25g de proteína, 67g de carbohidratos complejos y 4.9mg de creatina</strong> por porción. Incluye proteína concentrada, caseína, BCAAs, glutamina, vitaminas y minerales para un desarrollo muscular óptimo.
            </p>
            
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <h5 className="font-semibold text-foreground mb-2">Beneficios:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Evita el catabolismo muscular</li>
                <li>• Fuente de energía limpia y constante</li>
                <li>• Incrementa la fuerza y resistencia</li>
                <li>• Regenera las fibras musculares</li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Modo de uso:</strong> Mezclar 1 medida en 300ml de agua. Consumir de 1 a 3 servicios diarios según necesidades nutricionales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};