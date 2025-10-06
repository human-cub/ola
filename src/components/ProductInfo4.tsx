export const ProductInfo4 = () => {
  const flavors = ["Chocolate", "Vainilla"];

  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Star Nutrition Pump V8
          </h2>
          <p className="text-muted-foreground font-medium mb-4">
            Masa neto: <span className="text-primary font-semibold">285 gramos</span>
          </p>
          
          {/* Flavors */}
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-3 text-primary">
              Sabores Disponibles:
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {flavors.map((flavor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">{flavor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};