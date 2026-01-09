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
  const getPriceForPeople = (people: number) => {
    // Находим ближайший порог снизу
    for (let i = priceData.length - 1; i >= 0; i--) {
      if (people >= priceData[i].people) {
        return priceData[i].price;
      }
    }
    return priceData[0].price;
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

  // Calcular cuántas unidades faltan para el próximo descuento
  const nextThreshold = getNextDiscountThreshold(waitingCount);
  const remaining = nextThreshold ? nextThreshold.people - waitingCount : 0;

  return (
    <section className="px-4 pt-1 pb-4">
      <div className="container mx-auto max-w-md">
        <div className="relative bg-gradient-card rounded-2xl p-6 sm:p-8 shadow-floating animate-glow-pulse animate-float hover:scale-105 transition-all duration-500 border-[3px] animate-border-pulse backdrop-blur-sm">
          
          {/* Título */}
          <h3 className="text-xl font-bold text-center mb-4 text-primary italic">
            Precio por unidad en compra grupal
          </h3>
          
          {/* Faltan X para el próximo descuento */}
          {nextThreshold && (
            <p className="text-center text-muted-foreground mb-4">
              Faltan <span className="font-semibold">{remaining}</span> para el próximo descuento
            </p>
          )}
          
          {/* Label de unidades actuales arriba del slider */}
          <div className="text-center mb-2">
            <span className="text-primary font-semibold text-sm">
              {waitingCount} unidades
            </span>
          </div>
          
          {/* Price Scale */}
          <div className="relative mb-2">
            {/* People numbers (top row) */}
            <div className="relative mb-1">
              <div className="flex justify-between px-1">
                {priceData.map((item, index) => (
                  <span 
                    key={index} 
                    className="text-xs text-muted-foreground"
                  >
                    {item.people}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Slider */}
            <div className="mb-1 -mx-2">
              <Slider
                value={[sliderPosition]}
                onValueChange={handleSliderChange}
                max={priceData.length - 1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
            
            {/* Price numbers (bottom row) */}
            <div className="flex justify-between px-1">
              {priceData.map((item, index) => (
                <span 
                  key={index} 
                  className="text-xs text-muted-foreground"
                >
                  {formatPrice(item.price)}
                </span>
              ))}
            </div>
          </div>

          {/* Precio actual y precio mayorista final */}
          <div className="flex justify-between items-end mt-4 mb-4">
            {/* Precio actual */}
            <div className="text-center">
              <p className="text-xl font-bold text-[#c9302c]">
                {formatPrice(currentActualPrice.price)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Precio actual
              </p>
            </div>
            
            {/* Precio mayorista final */}
            <div className="text-center">
              <p className="text-xl font-bold text-[#5cb85c]">
                {formatPrice(maxPrice.price)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Precio mayorista final
              </p>
            </div>
          </div>
          
          {/* Separador visual */}
          <div className="border-t border-border/50 my-4"></div>

          {/* Mensaje de precio mayorista */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Esperá y podés obtener el precio mayorista
            </p>
            <div className="flex items-center justify-center gap-3">
              {/* Precio tachado */}
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(priceData[0].price)}
              </span>
              {/* Precio mayorista grande */}
              <span className="text-3xl font-bold text-[#5cb85c]">
                {formatPrice(maxPrice.price)}
              </span>
            </div>
          </div>
          
          {/* Comprando ahora */}
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Comprando ahora{" "}
              <span className="font-semibold text-primary">
                {formatPrice(currentActualPrice.price)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
