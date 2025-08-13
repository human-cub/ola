import { useState, useEffect } from "react";
import { MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FloatingButton = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes } = prev;
        
        if (minutes > 0) {
          minutes--;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
        }
        
        return { days, hours, minutes };
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/message/GROUP_LINK", "_blank");
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-primary rounded-2xl p-4 shadow-floating flex items-center justify-between text-white">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <div className="text-sm">
              <div className="flex gap-1 items-center">
                <span className="font-bold">{timeLeft.days}d</span>
                <span>:</span>
                <span className="font-bold">{timeLeft.hours}h</span>
                <span>:</span>
                <span className="font-bold">{timeLeft.minutes}m</span>
              </div>
              <div className="text-xs opacity-90">
                Tiempo de recolección
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <Button 
            variant="secondary"
            size="sm"
            onClick={handleWhatsAppClick}
            className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Unirse</span>
          </Button>
        </div>
      </div>
    </div>
  );
};