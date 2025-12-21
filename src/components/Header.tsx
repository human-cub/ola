
import { MessageCircle, Menu, Dumbbell, Atom, Pill, TrendingUp, Zap, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HeaderProps {
  isVisible: boolean;
}

const catalogCategories = [
  { name: "Proteínas", icon: Dumbbell },
  { name: "Creatinas", icon: Atom },
  { name: "Aminoácidos", icon: Pill },
  { name: "Aumentadores de masa", icon: TrendingUp },
  { name: "Pre-entrenos", icon: Zap },
  { name: "Colágeno", icon: Sparkles },
  { name: "Vitaminas y minerales", icon: Heart },
];

export const Header = ({ isVisible }: HeaderProps) => {
  const handleWhatsAppClick = () => {
    window.open("http://wa.me/5491166650878", "_blank");
  };

  const handleHomeClick = () => {
    window.location.href = "/";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-soft transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Burger Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="z-20">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-background">
            <SheetHeader>
              <SheetTitle className="text-left text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Catálogo
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              {catalogCategories.map((category) => (
                <button
                  key={category.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-left text-foreground hover:bg-primary/10 transition-colors"
                >
                  <category.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-1 cursor-pointer z-20 absolute left-1/2 -translate-x-1/2" onClick={handleHomeClick}>
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" alt="Ola Wave Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Ola!
          </span>
        </div>

        {/* WhatsApp Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleWhatsAppClick}
          className="border-primary/20 hover:border-primary hover:bg-primary/5 gap-2 px-3 min-w-fit whitespace-nowrap z-20"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chateá por WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </Button>
      </div>
    </header>
  );
};
