import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isVisible: boolean;
}

export const Header = ({ isVisible }: HeaderProps) => {
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/message/COMMUNITY_LINK", "_blank");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-soft transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-soft">
            <img src="/lovable-uploads/b99517da-1b60-4cc9-ab51-1d60dd3d658a.png" alt="Ola Wave Logo" className="w-8 h-8" />
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
          <span className="hidden sm:inline">Comunidad</span>
        </Button>
      </div>
    </header>
  );
};