import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BurgerMenu } from "@/components/BurgerMenu";

interface HeaderProps {
  isVisible: boolean;
}

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
        <div className="z-20">
          <BurgerMenu />
        </div>
        
        {/* Logo and Brand - Centered */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 cursor-pointer z-20" 
          onClick={handleHomeClick}
        >
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
