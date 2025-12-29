export const ProductDescription = () => {
  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Descripción del Producto
          </h3>
          
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">TrueMade Whey Protein</strong> es un suplemento de proteína de suero de leche de alta calidad, ideal para deportistas y personas activas que buscan aumentar su masa muscular y mejorar su rendimiento físico.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Cada porción contiene <strong className="text-primary">25 gramos de proteína pura</strong>, con un perfil completo de aminoácidos esenciales que favorecen la recuperación muscular y el crecimiento.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Formulado con ingredientes premium y libre de azúcares añadidos, este producto se disuelve fácilmente en agua o leche, proporcionando un sabor delicioso y una textura suave.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};