interface DynamicProductInfoProps {
  name: string;
  weight: string;
  flavors?: string[];
  variants?: string[];
}

const TagList = ({ label, items }: { label: string; items?: string[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium text-primary">{label}</h4>
      <div className="flex flex-wrap justify-center sm:justify-start gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center sm:justify-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
    <section className="sm:px-4 flex justify-center lg:justify-start" data-test-id="product-info">
      <div className="/*mx-auto*/ max-w-md">
        <div className="text-center sm:text-left mb-6">
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

          <TagList label="Sabores Disponibles:" items={flavors} />
          <TagList label="Características:" items={variants} />
        </div>
      </div>
    </section>
  );
};
