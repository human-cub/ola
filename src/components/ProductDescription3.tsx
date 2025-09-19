export const ProductDescription3 = () => {
  const flavors = [
    "Banana",
    "Cookies & Cream",
    "Vainilla",
    "Fresa",
    "Chocolate"
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