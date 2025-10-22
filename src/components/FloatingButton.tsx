import { useState, useEffect } from "react";
import { Clock, ShoppingCart, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderDialog from "./OrderDialog";

interface FloatingButtonProps {
  productName: string;
  productId: string;
}

export const FloatingButton = ({ productName, productId }: FloatingButtonProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [waitForDiscount, setWaitForDiscount] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date('2025-10-26T23:59:59');
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

  const handleBuyNow = () => {
    setWaitForDiscount(false);
    setDialogOpen(true);
  };

  const handleWaitForDiscount = () => {
    setWaitForDiscount(true);
    setDialogOpen(true);
  };

  return (
    <>
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

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBuyNow}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2 flex-1"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm">Купить сейчас</span>
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleWaitForDiscount}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2 flex-1"
              >
                <Timer className="w-4 h-4" />
                <span className="text-sm">Подождать скидку</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        productName={productName}
        waitForDiscount={waitForDiscount}
      />
    </>
  );
};