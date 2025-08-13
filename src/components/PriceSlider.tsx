import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const priceData = [
  { people: 1, price: 55000 },
  { people: 10, price: 46000 },
  { people: 30, price: 40000 },
  { people: 50, price: 37000 },
  { people: 100, price: 31500 },
];

export const PriceSlider = () => {
  const [selectedIndex, setSelectedIndex] = useState(4); // Default to 100 people

  const handleSliderChange = (value: number[]) => {
    setSelectedIndex(value[0]);
  };

  const currentPrice = priceData[selectedIndex];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-md">
        <div className="bg-gradient-card rounded-2xl p-6 shadow-floating">
          <h3 className="text-lg font-semibold text-center mb-6 text-foreground">
            Precio por cantidad de personas
          </h3>
          
          {/* Price Scale */}
          <div className="relative mb-8">
            {/* People numbers (top) */}
            <div className="flex justify-between mb-2">
              {priceData.map((item, index) => (
                <div key={index} className="text-center">
                  <span className={`text-sm font-medium ${
                    index === selectedIndex ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {item.people}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Slider */}
            <div className="px-2 mb-2">
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
            <div className="flex justify-between">
              {priceData.map((item, index) => (
                <div key={index} className="text-center">
                  <span className={`text-xs ${
                    index === selectedIndex ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    ${(item.price / 1000).toFixed(0)}k
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Price Display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Para {currentPrice.people} {currentPrice.people === 1 ? 'persona' : 'personas'}
            </p>
            <p className="text-3xl font-bold text-primary">
              {formatPrice(currentPrice.price)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};