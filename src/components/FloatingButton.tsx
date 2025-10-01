import { useState, useEffect } from "react";
import { MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingButtonProps {
  whatsappUrl?: string;
}

export const FloatingButton = ({ whatsappUrl = "https://chat.whatsapp.com/FxpV8T80s4DC13No0d6UVK?mode=ems_copy_t" }: FloatingButtonProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date('2025-10-12T23:59:59');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft({ days, hours, minutes });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();
    
    // Update every minute
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-primary rounded-2xl p-4 shadow-floating flex flex-col gap-3 text-white">
          {/* Timer */}
          <div className="flex items-center gap-2 justify-center">
            <Clock className="w-5 h-5" />
            <div className="text-sm">
              <div className="flex gap-1 items-center">
                <span className="font-bold">{timeLeft.days}d</span>
                <span>:</span>
                <span className="font-bold">{timeLeft.hours}h</span>
                <span>:</span>
                <span className="font-bold">{timeLeft.minutes}m</span>
              </div>
              <div className="text-xs opacity-90 text-center">
                Tiempo de recolección
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <Button 
            variant="secondary"
            size="sm"
            onClick={handleWhatsAppClick}
            className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2 w-full"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Unite al grupo de WhatsApp</span>
          </Button>
        </div>
      </div>
    </div>
  );
};