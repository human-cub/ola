export const ProductDescription12 = () => {
  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Descripción del Producto
          </h3>
          
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">CREATINA MONOHIDRATO</strong> es un suplemento que facilita la producción de combustible para el músculo en forma de ATP, lo que asegura que tus músculos trabajen de forma más eficiente por más tiempo. Además es el suplemento que más evidencia científica tiene en cuanto a beneficios en el rendimiento y en la salud en general.
            </p>
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="font-semibold text-foreground mb-2">BENEFICIOS:</h4>
              <ul className="text-muted-foreground leading-relaxed space-y-2">
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Aumenta la resistencia durante el entrenamiento</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Colabora con el incremento de la masa muscular</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Ayuda en la recuperación</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Previene la fatiga muscular</span></li>
              </ul>
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="font-semibold text-foreground mb-2">MODO DE USO:</h4>
              <p className="text-muted-foreground leading-relaxed">Mezclar 1 servicio (5 grs) en 250 cm3 de agua o jugo y consumir con el estómago vacío. Para óptimos resultados, consumir 15-30 minutos antes del entrenamiento.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};