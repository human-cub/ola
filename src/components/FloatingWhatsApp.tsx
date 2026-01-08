import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FloatingWhatsApp = () => {
  const handleWhatsAppClick = () => {
    window.open("http://wa.me/5491166650878", "_blank");
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] shadow-lg hover:shadow-xl transition-all duration-300 p-0"
      aria-label="Chatear por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </Button>
  );
};
