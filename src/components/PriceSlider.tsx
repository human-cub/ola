import { useState, useEffect } from "react";

interface PriceData {
  people: number;
  price: number;
}

interface PriceSliderProps {
  priceData: PriceData[];
  waitingCount?: number;
}

export const PriceSlider = ({ priceData, waitingCount = 0 }: PriceSliderProps) => {
  // Ensure we have at least 2 tiers
  if (priceData.length < 2) return null;

  // Функция для получения цены по количеству людей
  const getPriceForPeople = (people: number) => {
    const secondTierThreshold = priceData.length > 1 ? priceData[1].people : 0;
    const secondTierPrice = priceData.length > 1 ? priceData[1].price : priceData[0].price;
    
    if (people < secondTierThreshold) {
      return secondTierPrice;
    }
    
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

  const formatPrice = (price: number) => {
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `$${formatted}`;
  };

  const maxPrice = priceData[priceData.length - 1];
  const numSegments = priceData.length - 1;

  // Segment colors from expensive (red) to cheap (green)
  const segmentColors = [
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
  ];

  // Calculate current tier index based on waitingCount
  const getCurrentTierIndex = () => {
    for (let i = priceData.length - 1; i >= 0; i--) {
      if (waitingCount >= priceData[i].people) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTierIndex();

  return (
    <section className="px-4 pt-1 pb-4">
      <div className="container mx-auto max-w-md">
        <div className="relative bg-gradient-card rounded-2xl p-6 sm:p-8 shadow-floating animate-glow-pulse animate-float hover:scale-105 transition-all duration-500 border-[3px] animate-border-pulse backdrop-blur-sm">
          
          <h3 className="text-lg font-bold text-center mb-3 text-primary animate-scale-in">
            Precio por unidad en compra grupal
          </h3>
          
          {/* Información de participantes */}
          <div className="mb-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Ya se reservaron <span className="font-semibold text-primary">{waitingCount}</span> unidades entre distintos compradores
            </p>
            {(() => {
              const secondTierThreshold = priceData.length > 1 ? priceData[1].people : 0;
              if (waitingCount < secondTierThreshold) {
                return null;
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
          
          {/* Volume Discount Slider - New Geometry */}
          <div className="w-full max-w-[400px] mx-auto">
            {/* Internal container with 15px horizontal margin */}
            <div className="mx-[15px] h-[80px] relative flex flex-col justify-between">
              
              {/* Top Labels (Quantity Tick Marks) */}
              <div className="relative h-5">
                {priceData.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === priceData.length - 1;
                  const position = (index / (priceData.length - 1)) * 100;
                  
                  return (
                    <span
                      key={index}
                      className={`absolute text-[11px] xs:text-xs font-medium text-muted-foreground whitespace-nowrap ${
                        isFirst ? "left-0" : isLast ? "right-0" : "-translate-x-1/2"
                      }`}
                      style={
                        !isFirst && !isLast
                          ? { left: `${position}%` }
                          : undefined
                      }
                    >
                      {item.people}
                    </span>
                  );
                })}
              </div>

              {/* Slider Track - 4 equal segments */}
              <div className="flex h-3 rounded-full overflow-hidden">
                {segmentColors.slice(0, numSegments).map((color, index) => (
                  <div
                    key={index}
                    className={`flex-1 transition-opacity duration-300 ${color} ${
                      index < currentTierIndex ? "opacity-40" : "opacity-100"
                    }`}
                  />
                ))}
              </div>

              {/* Bottom Labels (Price Values) - Grid with equal columns */}
              <div
                className="grid h-5"
                style={{
                  gridTemplateColumns: `repeat(${numSegments}, 1fr)`,
                }}
              >
                {priceData.slice(1).map((item, index) => {
                  const isActive = index + 1 <= currentTierIndex;
                  return (
                    <div
                      key={index}
                      className={`text-center text-[11px] xs:text-xs font-semibold transition-colors ${
                        isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {formatPrice(item.price)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Price Display */}
          <div className="text-center mt-4 space-y-1">
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
