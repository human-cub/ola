interface DynamicProductInfoProps {
  name: string;
  weight: string;
  flavors?: string[];
  variants?: string[];
}

export const DynamicProductInfo = ({ name, weight, flavors, variants }: DynamicProductInfoProps) => {
  const formatWeight = (w: string) => {
    const lower = w.toLowerCase();
    if (lower.includes("peso neto") || lower.includes("cápsulas") || lower.includes("unidades")) {
      return w;
    }
    if (/^\d+\s*g$/i.test(w)) {
      return `Peso neto: ${w}`;
    }
    return w;
  };

  const hasContent = (flavors && flavors.length > 0) || (variants && variants.length > 0);

  return (
    <section className="px-4 pt-3 pb-0">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2 leading-[1.15]">
            {name}
          </h2>
          <p className="text-muted-foreground font-medium mb-4">
            {formatWeight(weight).includes("Peso neto") ? (
              <>Peso neto: <span className="text-primary font-semibold">{weight}</span></>
            ) : (
              <span className="text-primary font-semibold">{weight}</span>
            )}
          </p>
          
          {/* Flavors */}
          {flavors && flavors.length > 0 && (
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
          )}

          {/* Variants */}
          {variants && variants.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-medium mb-3 text-primary">
                Características:
              </h4>
              <div className="flex flex-wrap justify-center gap-3">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-foreground">{variant}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
