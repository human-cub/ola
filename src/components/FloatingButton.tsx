import { useState, useEffect } from "react";
import { Clock, ShoppingCart, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartDialog } from "./AddToCartDialog";

interface PriceData {
  people: number;
  price: number;
}

interface FloatingButtonProps {
  productName: string;
  productId: string;
  productImage?: string | null;
  flavors?: string[];
  prices?: PriceData[];
  waitingCount?: number;
}

export const FloatingButton = ({ 
  productName, 
  productId, 
  productImage = null,
  flavors = [],
  prices = [], 
  waitingCount = 0 
}: FloatingButtonProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isWaitingList, setIsWaitingList] = useState(false);

  useEffect(() => {
    const getNextSunday = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      
      // Calculate days until next Sunday (0 = Sunday, 6 = Saturday)
      const daysUntilSunday = (7 - now.getDay()) % 7;
      
      // If today is Sunday and it's before 23:59, target is today
      // Otherwise target next Sunday
      if (daysUntilSunday === 0 && now.getHours() < 23) {
        nextSunday.setHours(23, 59, 59, 999);
      } else {
        nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
        nextSunday.setHours(23, 59, 59, 999);
      }
      
      return nextSunday;
    };

    const calculateTimeLeft = () => {
      const targetDate = getNextSunday();
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

  // Buy Now price = second tier price (index 1) - fixed price regardless of participants
  const getBuyNowPrice = () => {
    if (prices.length === 0) return null;
    // prices[0] = highest price (1 person), prices[1] = second tier, etc.
    if (prices.length > 1) {
      return prices[1].price; // Second tier price (index 1)
    }
    return prices[0].price; // Fallback to first tier if only one exists
  };

  const buyNowPrice = getBuyNowPrice();

  const handleBuyNow = () => {
    setIsWaitingList(false);
    setDialogOpen(true);
  };

  const handleWaitForDiscount = () => {
    setIsWaitingList(true);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 px-3 py-3 sm:px-4 sm:py-4 md:left-auto md:top-[110px] md:bottom-auto">
        <div className="mx-auto max-w-[calc(100%-16px)] sm:max-w-md">
          <div className="bg-gradient-primary rounded-2xl px-3 py-3 sm:p-4 shadow-floating text-white">
            {/* Timer */}
            <div className="flex items-center gap-2 justify-center mb-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <div className="text-sm">
                <div className="flex gap-1 items-center justify-center">
                  <span className="font-bold">{timeLeft.days}d</span>
                  <span>:</span>
                  <span className="font-bold">{timeLeft.hours}h</span>
                  <span>:</span>
                  <span className="font-bold">{timeLeft.minutes}m</span>
                </div>
                <div className="text-xs opacity-90 text-center whitespace-nowrap">
                  Tiempo de recolección
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleWaitForDiscount}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2 flex-1 h-auto py-3 sm:py-2"
              >
                <Timer className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Esperar y pagar menos</span>
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBuyNow}
                className="bg-white hover:bg-white/90 text-primary border-0 gap-2 flex-1 h-auto py-3 sm:py-2 font-semibold"
              >
                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Comprar ahora {buyNowPrice && <span className="font-bold">${buyNowPrice.toLocaleString()}</span>}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddToCartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        productName={productName}
        productImage={productImage}
        flavors={flavors}
        prices={prices}
        isWaitingList={isWaitingList}
        currentParticipants={waitingCount}
      />
    </>
  );
};
