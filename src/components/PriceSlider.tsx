import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

interface PriceData {
  people: number;
  price: number;
}

interface PriceSliderProps {
  priceData: PriceData[];
  waitingCount?: number;
}

export const PriceSlider = ({ priceData, waitingCount = 0 }: PriceSliderProps) => {
  // Преобразование количества людей в позицию слайдера (0-4)
  const peopleToSliderPosition = (people: number): number => {
    for (let i = 0; i < priceData.length - 1; i++) {
      const current = priceData[i];
      const next = priceData[i + 1];
      
      if (people <= current.people) {
        return i;
      }
      
      if (people > current.people && people <= next.people) {
        // Линейная интерполяция между позициями i и i+1
        const ratio = (people - current.people) / (next.people - current.people);
        return i + ratio;
      }
    }
    return priceData.length - 1;
  };
  
  // Преобразование позиции слайдера (0-4) в количество людей
  const sliderPositionToPeople = (position: number): number => {
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index >= priceData.length - 1) {
      return priceData[priceData.length - 1].people;
    }
    
    const current = priceData[index];
    const next = priceData[index + 1];
    
    return Math.round(current.people + (next.people - current.people) * fraction);
  };
  
  const initialPosition = peopleToSliderPosition(waitingCount || priceData[0].people);
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [showMaxGlow, setShowMaxGlow] = useState(false);
  
  // Обновляем позицию слайдера при изменении количества участников
  useEffect(() => {
    setSliderPosition(peopleToSliderPosition(waitingCount || priceData[0].people));
  }, [waitingCount]);
  
  // Функция для получения цены по количеству людей с интерполяцией
  const getPriceForPeople = (people: number) => {
    for (let i = 0; i < priceData.length - 1; i++) {
      const current = priceData[i];
      const next = priceData[i + 1];
      
      if (people <= current.people) {
        return current.price;
      }
      
      if (people > current.people && people <= next.people) {
        const ratio = (people - current.people) / (next.people - current.people);
        return Math.round(current.price - (current.price - next.price) * ratio);
      }
    }
    return priceData[priceData.length - 1].price;
  };
  
  const selectedPeople = sliderPositionToPeople(sliderPosition);
  
  // Получаем текущую цену для реального количества участников
  const currentActualPrice = {
    people: waitingCount,
    price: getPriceForPeople(waitingCount)
  };
  
  // Получаем цену для выбранной позиции слайдера
  const selectedPrice = {
    people: selectedPeople,
    price: getPriceForPeople(selectedPeople)
  };
  
  const maxPrice = priceData[priceData.length - 1];

  const handleSliderChange = (value: number[]) => {
    const newPosition = value[0];
    setSliderPosition(newPosition);
    
    // Trigger glow animation when reaching maximum
    if (newPosition >= priceData.length - 1) {
      setShowMaxGlow(true);
      setTimeout(() => setShowMaxGlow(false), 1000);
    }
  };

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
          
          {/* Информация об участниках */}
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{waitingCount}</span> из <span className="font-semibold">{maxPrice.people}</span> участников
            </p>
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
                  const isNearSelected = Math.abs(selectedPeople - item.people) <= 
                    (index < priceData.length - 1 ? (priceData[index + 1].people - item.people) * 0.1 : 5);
                  return (
                    <div 
                      key={index} 
                      className="absolute transform -translate-x-1/2"
                      style={{ left: position }}
                    >
                      <span className={`text-sm font-medium transition-colors ${
                        isNearSelected ? 'text-primary' : 'text-muted-foreground'
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
                value={[sliderPosition]}
                onValueChange={handleSliderChange}
                max={priceData.length - 1}
                min={0}
                step={0.01}
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
                  const isNearSelected = Math.abs(selectedPeople - item.people) <= 
                    (index < priceData.length - 1 ? (priceData[index + 1].people - item.people) * 0.1 : 5);
                  return (
                    <div 
                      key={index} 
                      className="absolute transform -translate-x-1/2"
                      style={{ left: position }}
                    >
                      <span className={`text-xs transition-colors ${
                        isNearSelected ? 'text-primary font-medium' : 'text-muted-foreground'
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
            
            {/* Выбранная цена на слайдере */}
            {selectedPeople !== waitingCount && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Цена при {selectedPeople} участниках
                </p>
                <p className="text-2xl font-bold text-primary/80">
                  {formatPrice(selectedPrice.price)}
                </p>
              </div>
            )}
            
            {/* Текущая цена */}
            <div>
              <p className="text-sm text-muted-foreground mb-1 font-medium">
                Цена сейчас ({waitingCount} участников)
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