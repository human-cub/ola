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
  
  // Функция для получения цены по количеству людей (точные значения, без интерполяции)
  // From 1 to 2nd tier threshold, use 2nd tier price (not higher)
  const getPriceForPeople = (people: number) => {
    const secondTierThreshold = priceData.length > 1 ? priceData[1].people : 0;
    const secondTierPrice = priceData.length > 1 ? priceData[1].price : priceData[0].price;
    
    // Before reaching 2nd tier, use 2nd tier price (buy now price)
    if (people < secondTierThreshold) {
      return secondTierPrice;
    }
    
    // After 2nd tier, calculate normally
    for (let i = priceData.length - 1; i >= 0; i--) {
      if (people >= priceData[i].people) {
        return priceData[i].price;
      }
    }
    return secondTierPrice;
  };
  
  // Функция для получения следующего порога скидки
  const getNextDiscountThreshold = (currentPeople: number) => {
    for (let i = 0; i < priceData.length; i++) {
      if (priceData[i].people > currentPeople) {
        return priceData[i];
      }
    }
    return null;
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
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `$${formatted}`;
  };

  return (
    <section className="px-2 sm:px-4 pt-1 pb-4">
      <div className="mx-auto max-w-md">
        <div className="relative bg-gradient-card rounded-2xl px-3 py-5 sm:p-6 shadow-floating animate-glow-pulse animate-float hover:scale-105 transition-all duration-500 border-[3px] animate-border-pulse backdrop-blur-sm">
          
          <h3 className="text-lg font-bold text-center mb-3 text-primary animate-scale-in">
            Precio por unidad en compra grupal
          </h3>
          
          {/* Información de participantes */}
          <div className="mb-3 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Ya se reservaron <span className="font-semibold text-primary">{waitingCount}</span> unidades entre distintos compradores
            </p>
            {(() => {
              // Only show "Faltan..." once we've reached at least the 2nd tier threshold
              const secondTierThreshold = priceData.length > 1 ? priceData[1].people : 0;
              if (waitingCount < secondTierThreshold) {
                return null; // Hide until second tier is reached
              }
              const nextThreshold = getNextDiscountThreshold(waitingCount);
              if (nextThreshold) {
                const remaining = nextThreshold.people - waitingCount;
                return (
                  <p className="text-sm text-muted-foreground">
                    Faltan <span className="font-bold text-primary">{remaining}</span> unidades más para el próximo descuento
                  </p>
                );
              }
              return null;
            })()}
          </div>
          
          {/* Price Scale */}
          <div className="relative mb-4 px-1">
            {/* People numbers (top) - using flexbox for precise positioning */}
            <div className="flex justify-between items-center mb-2">
              {priceData.map((item, index) => {
                const isNearSelected = Math.abs(selectedPeople - item.people) <= 
                  (index < priceData.length - 1 ? (priceData[index + 1].people - item.people) * 0.1 : 5);
                const isFirst = index === 0;
                const isLast = index === priceData.length - 1;
                return (
                  <span 
                    key={index} 
                    className={`text-sm font-medium transition-colors ${
                      isNearSelected ? 'text-primary' : 'text-muted-foreground'
                    } ${isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center'}`}
                  >
                    {item.people}
                  </span>
                );
              })}
            </div>
            
            {/* Slider - full width */}
            <div className="mb-2">
              <Slider
                value={[sliderPosition]}
                onValueChange={handleSliderChange}
                max={priceData.length - 1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
            
            {/* Price numbers (bottom) - using flexbox for precise positioning */}
            <div className="flex justify-between items-center">
              {priceData.map((item, index) => {
                const isNearSelected = Math.abs(selectedPeople - item.people) <= 
                  (index < priceData.length - 1 ? (priceData[index + 1].people - item.people) * 0.1 : 5);
                const isFirstPrice = index === 0;
                const isFirst = index === 0;
                const isLast = index === priceData.length - 1;
                return (
                  <span 
                    key={index} 
                    className={`transition-colors whitespace-nowrap ${
                      isFirstPrice 
                        ? 'text-xs text-muted-foreground line-through opacity-60'
                        : isNearSelected 
                          ? 'text-xs text-primary font-medium' 
                          : 'text-xs text-muted-foreground'
                    } ${isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center'}`}
                  >
                    {formatPrice(item.price)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Current Price Display */}
          <div className="text-center relative space-y-1 -mt-2">
            <div className={`absolute inset-0 -z-10 ${showMaxGlow ? 'shadow-glow animate-pulse' : ''}`}></div>
            
            {/* Выбранная цена на слайдере */}
            {selectedPeople !== waitingCount && (
              <div className="mb-1">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Precio al llegar a {selectedPeople} participantes
                </p>
                <p className="text-2xl font-bold text-primary/80">
                  {formatPrice(selectedPrice.price)}
                </p>
              </div>
            )}
            
            {/* Mensaje de precio mayorista */}
            <div>
              <p className="text-sm text-muted-foreground mb-1 font-medium text-center">
                Esperá y podés obtener el precio mayorista
              </p>
              <div className="flex items-center justify-center gap-3">
                {/* Precio tachado */}
                <p className="text-lg text-muted-foreground line-through opacity-60">
                  {formatPrice(priceData[0].price)}
                </p>
                {/* Precio mayorista */}
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(maxPrice.price)}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};