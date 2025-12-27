import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const catalogCategories = [
  { name: "Proteínas", href: "#proteinas" },
  { name: "Creatinas", href: "#creatinas" },
  { name: "Aminoácidos", href: "#aminoacidos" },
  { name: "Aumentadores de masa", href: "#aumentadores" },
  { name: "Barras y snacks", href: "#barras" },
  { name: "Pre-entrenos", href: "#pre-entrenos" },
  { name: "Colágeno", href: "#colageno" },
  { name: "Vitaminas y minerales", href: "#vitaminas" },
];

export const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryClick = (href: string) => {
    setIsOpen(false);
    // For now just close the menu, later can navigate to category pages
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-primary/10"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left flex items-center gap-2">
            <img 
              src="/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" 
              alt="Ola Logo" 
              className="w-6 h-6 object-contain" 
            />
            <span className="bg-gradient-primary bg-clip-text text-transparent font-bold text-xl">
              Catálogo
            </span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="p-4">
          <ul className="space-y-1">
            {catalogCategories.map((category) => (
              <li key={category.name}>
                <button
                  onClick={() => handleCategoryClick(category.href)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                >
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
