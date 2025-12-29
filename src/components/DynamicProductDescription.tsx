import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DynamicProductDescriptionProps {
  description: string;
}

export const DynamicProductDescription = ({ description }: DynamicProductDescriptionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!description) return null;

  // Parse description into paragraphs
  const paragraphs = description.split("\n").filter(p => p.trim());

  return (
    <section className="px-4 py-4">
      <div className="container mx-auto max-w-md">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="bg-gradient-card rounded-2xl p-6 shadow-soft">
            <CollapsibleTrigger className="w-full flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">
                Descripción del Producto
              </h3>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="space-y-4 mt-4">
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};
