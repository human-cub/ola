import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

interface PriceData {
  people: number;
  price: number;
}

interface PriceSliderProps {
  priceData: PriceData[];
  waitingCount?: number;
}

export const PriceSlider = ({ priceData, waitingCount = 0 }: PriceSliderProps) => {
  const [selectedIndex, setSelectedIndex] = useState(4); // Default to 100 people
  const [showMaxGlow, setShowMaxGlow] = useState(false);
  
  // Вычисляем текущую цену на основе количества ожидающих
  const getCurrentPriceIndex = () => {
    for (let i = priceData.length - 1; i >= 0; i--) {
      if (waitingCount >= priceData[i].people) {
        return i;
      }
    }
    return 0;
  };
  
  const currentPriceIndex = getCurrentPriceIndex();
  const currentActualPrice = priceData[currentPriceIndex];
  const maxPrice = priceData[priceData.length - 1];
  const progressPercent = (waitingCount / maxPrice.people) * 100;

  const handleSliderChange = (value: number[]) => {
    const newIndex = value[0];
    setSelectedIndex(newIndex);
    
    // Trigger glow animation when reaching maximum
    if (newIndex === 4) {
      setShowMaxGlow(true);
      setTimeout(() => setShowMaxGlow(false), 1000);
    }
  };

  const currentPrice = priceData[selectedIndex];
  const retailPrice = priceData[0].price; // Use price for 1 person as retail price

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="px-4 pt-1 pb-4">
      <div className="container mx-auto max-w-md">
        <div className="relative bg-gradient-card rounded-2xl p-6 shadow-floating animate-glow-pulse animate-float hover:scale-105 transition-all duration-500 border-2 animate-border-pulse backdrop-blur-sm">
          
          <h3 className="text-lg font-bold text-center mb-4 text-foreground bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent animate-scale-in">
            El precio baja a medida que se suman más participantes
          </h3>
          
          {/* Прогресс-бар */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Сейчас ждут: {waitingCount} чел.</span>
              <span>Цель: {maxPrice.people} чел.</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
          
          {/* Price Scale */}
          <div className="relative mb-8">
            {/* People numbers (top) */}
            <div className="relative mb-2">
              <div className="absolute inset-0 flex">
                {priceData.map((item, index) => {
                  const position = index === 0 ? '0%' : 
                                  index === 1 ? '25%' :
                                  index === 2 ? '50%' :
                                  index === 3 ? '75%' : '100%';
                  return (
                    <div 
                      key={index} 
                      className="absolute transform -translate-x-1/2"
                      style={{ left: position }}
                    >
                      <span className={`text-sm font-medium ${
                        index === selectedIndex ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {item.people}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-6"></div>
            </div>
            
            {/* Slider */}
            <div className="mb-2 -mx-3">
              <Slider
                value={[selectedIndex]}
                onValueChange={handleSliderChange}
                max={4}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Price numbers (bottom) */}
            <div className="relative">
              <div className="absolute inset-0 flex">
                {priceData.map((item, index) => {
                  const position = index === 0 ? '0%' : 
                                  index === 1 ? '25%' :
                                  index === 2 ? '50%' :
                                  index === 3 ? '75%' : '100%';
                  return (
                    <div 
                      key={index} 
                      className="absolute transform -translate-x-1/2"
                      style={{ left: position }}
                    >
                      <span className={`text-xs ${
                        index === selectedIndex ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}>
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-4"></div>
            </div>
          </div>

          {/* Current Price Display */}
          <div className="text-center relative space-y-4">
            <div className={`absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl -z-10 animate-shimmer ${showMaxGlow ? 'shadow-glow animate-pulse' : ''}`}></div>
            
            {/* Текущая цена */}
            <div>
              <p className="text-sm text-muted-foreground mb-1 font-medium">
                Цена сейчас
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-2">
                {/* Main price */}
                <p className="text-3xl font-bold text-foreground">
                  {formatPrice(currentActualPrice.price)}
                </p>
              </div>
            </div>
            
            {/* Разделитель */}
            <div className="border-t border-primary/20 pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                🎯 Подожди до окончания сбора и получи цену
              </p>
              
              {/* Максимальная цена со скидкой - подсвечена */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-lg blur-md animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-primary to-primary-dark p-4 rounded-lg shadow-glow">
                  <p className="text-4xl font-black text-white animate-bounce-subtle drop-shadow-lg">
                    {formatPrice(maxPrice.price)}
                  </p>
                  <p className="text-xs text-white/90 mt-1">
                    💰 При {maxPrice.people} участниках
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};