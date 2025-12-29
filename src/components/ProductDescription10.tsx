export const ProductDescription10 = () => {
  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Descripción del Producto
          </h3>
          
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              El <strong className="text-foreground">Colágeno</strong> es una proteína fundamental para la formación de tejidos en nuestro organismo, entre ellos tendones, pelo, piel, uñas, ligamentos, cartílagos, vasos sanguíneos e intestinos.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Star Nutrition ha realizado una combinación perfecta entre colágeno + vitamina C + ácido hialurónico + resveratrol, para complementar tu alimentación y lograr tus objetivos de cuidado corporal. Además sirve a deportistas para prevenir lesiones y mejorar la recuperación.
            </p>
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="font-semibold text-foreground mb-2">BENEFICIOS:</h4>
              <ul className="text-muted-foreground leading-relaxed space-y-2">
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Cuidado de la elasticidad de la piel y retrasa la aparición de arrugas</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Fortalece cartílagos, tendones y ligamentos</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Ayuda a prevenir lesiones</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Contiene ácido hialurónico, vitamina C y resveratrol</span></li>
                <li className="flex items-start gap-2"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><span>Fácil absorción</span></li>
              </ul>
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="font-semibold text-foreground mb-2">MODO DE USO:</h4>
              <p className="text-muted-foreground leading-relaxed">Diluir 2 medidas (10,5 grs) en 300 ml de agua. Consumir con el estómago vacío.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};