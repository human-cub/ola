interface DynamicProductDescriptionProps {
  description: string;
}

export const DynamicProductDescription = ({ description }: DynamicProductDescriptionProps) => {
  if (!description) return null;

  // Parse description into paragraphs
  const paragraphs = description.split("\n").filter(p => p.trim());

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Descripción del Producto
          </h3>
          
          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => {
              // Check if it's a header (starts with ** or ends with :)
              if (paragraph.startsWith("**") || paragraph.endsWith(":")) {
                return (
                  <h4 key={index} className="font-semibold text-foreground">
                    {paragraph.replace(/\*\*/g, "")}
                  </h4>
                );
              }
              // Check if it's highlighted text (wrapped in **)
              if (paragraph.includes("**")) {
                return (
                  <p key={index} className="text-primary font-semibold">
                    {paragraph.replace(/\*\*/g, "")}
                  </p>
                );
              }
              return (
                <p key={index} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
