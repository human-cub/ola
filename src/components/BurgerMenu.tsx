import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  { name: "Proteínas", slug: "proteinas" },
  { name: "Creatinas", slug: "creatinas" },
  { name: "Aminoácidos", slug: "aminoacidos" },
  { name: "Ganadores de masa", slug: "aumentadores" },
  { name: "Barras y snacks", slug: "barras" },
  { name: "Pre-entrenos", slug: "pre-entrenos" },
  { name: "Colágeno", slug: "colageno" },
  { name: "Vitaminas y minerales", slug: "vitaminas" },
];

export const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (slug: string) => {
    setIsOpen(false);
    navigate(`/categoria/${slug}`);
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
          <SheetTitle className="text-left">
            <button
              onClick={() => { setIsOpen(false); navigate("/catalogo"); }}
              className="bg-gradient-primary bg-clip-text text-transparent font-bold text-xl hover:opacity-80 transition-opacity"
            >
              Catálogo
            </button>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="p-4">
          <ul className="space-y-1">
            {catalogCategories.map((category) => (
              <li key={category.slug}>
                <button
                  onClick={() => handleCategoryClick(category.slug)}
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
