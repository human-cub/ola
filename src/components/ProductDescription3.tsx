export const ProductDescription3 = () => {
  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Descripción del Producto
          </h3>
          
          {/* Product Details */}
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Whey Protein Doypack 2 Lb Star Nutrition</strong> es un suplemento de proteína de suero de leche concentrada de alta calidad, ideal para el desarrollo y mantenimiento de la masa muscular.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Cada porción aporta <strong className="text-primary">24 gramos de proteína</strong> con un perfil completo de aminoácidos esenciales que favorecen la síntesis proteica y la recuperación muscular post-entrenamiento.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Presentación en práctico doypack de 2 libras (900g)</strong> que facilita su almacenamiento y uso. Se disuelve fácilmente en agua o leche, ofreciendo un sabor delicioso y una textura cremosa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};