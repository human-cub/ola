interface DynamicProductDescriptionProps {
  description: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ParagraphType = "header" | "highlight" | "body";

function classifyParagraph(text: string): ParagraphType {
  if (text.startsWith("**") || text.endsWith(":")) return "header";
  if (text.includes("**")) return "highlight";
  return "body";
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Paragraph({ text }: { text: string }) {
  const type = classifyParagraph(text);
  const content = stripMarkdown(text);

  if (type === "header") {
    return <h4 className="font-semibold text-foreground">{content}</h4>;
  }
  if (type === "highlight") {
    return <p className="text-primary font-semibold">{content}</p>;
  }
  return <p className="text-muted-foreground leading-relaxed">{content}</p>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DynamicProductDescription = ({ description }: DynamicProductDescriptionProps) => {
  if (!description) return null;

  const paragraphs = description.split("\n").filter((p) => p.trim());

  return (
    <section data-test-id="product-description" className="flex justify-center">
      <div className="sm:bg-gradient-card sm:rounded-2xl lg:pl-4 max-w-[72ch] mt-8 sm:mt-0 text-balance">
        <h3 className="text-xl font-semibold text-foreground mb-4">Descripción del Producto</h3>
        <div className="space-y-4 font-normal">
          {paragraphs.map((paragraph, index) => (
            <Paragraph key={index} text={paragraph} />
          ))}
        </div>
      </div>
    </section>
  );
};
