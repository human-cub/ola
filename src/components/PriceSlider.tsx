import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

const priceData = [
  { people: 1, price: 64000 },
  { people: 10, price: 52500 },
  { people: 30, price: 46000 },
  { people: 50, price: 40000 },
  { people: 100, price: 36200 },
];

export const PriceSlider = () => {
  const [selectedIndex, setSelectedIndex] = useState(4); // Default to 100 people
  const [showMaxGlow, setShowMaxGlow] = useState(false);

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
          
          <h3 className="text-lg font-bold text-center mb-6 text-foreground bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent animate-scale-in">
            El precio baja a medida que se suman más participantes
          </h3>
          
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
          <div className="text-center relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl -z-10 animate-shimmer ${showMaxGlow ? 'shadow-glow animate-pulse' : ''}`}></div>
            
            <p className="text-sm text-muted-foreground mb-1 font-medium">
              Precio con {currentPrice.people} {currentPrice.people === 1 ? 'participante' : 'participantes'}
            </p>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              {/* Crossed out retail price - only show when not at leftmost position */}
              {selectedIndex > 0 && (
                <span className="text-lg text-gray-400 line-through font-medium">
                  {formatPrice(retailPrice)}
                </span>
              )}
              
              {/* Main price with glow animation */}
              <div className={`relative ${showMaxGlow ? 'animate-pulse' : ''}`}>
                {showMaxGlow && (
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md animate-ping"></div>
                )}
                <p className="text-4xl font-black text-primary animate-bounce-subtle bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent drop-shadow-sm relative z-10">
                  {formatPrice(currentPrice.price)}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground font-medium border-t border-primary/20 pt-2">
              💰 Precio por persona
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};