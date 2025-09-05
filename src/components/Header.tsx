
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isVisible: boolean;
}

export const Header = ({ isVisible }: HeaderProps) => {
  const handleWhatsAppClick = () => {
    window.open("https://whatsapp.com/channel/0029VbApwH83LdQPnkFyGo2p", "_blank");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-soft transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-1">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/lovable-uploads/6c488915-6a0d-4b2b-95ed-83fb84f400db.png" alt="Ola Wave Logo" className="w-12 h-12 object-contain" />
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
          className="border-primary/20 hover:border-primary hover:bg-primary/5 gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Grupo Principal</span>
          <span className="sm:hidden">Grupo</span>
        </Button>
      </div>
    </header>
  );
};
