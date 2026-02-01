import { cn } from "@/lib/utils";

interface PriceTier {
  quantity: number;
  price: number;
}

interface VolumeDiscountSliderProps {
  tiers: PriceTier[];
  currentTier?: number;
  className?: string;
}

export const VolumeDiscountSlider = ({
  tiers,
  currentTier = 0,
  className,
}: VolumeDiscountSliderProps) => {
  if (tiers.length < 2) return null;

  // Ensure we have exactly 5 quantity points and 4 price segments
  const quantityLabels = tiers.map((t) => t.quantity);
  const priceLabels = tiers.map((t) => t.price);

  // Segment colors from expensive (red) to cheap (green)
  const segmentColors = [
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
  ];

  return (
    <div className={cn("w-full max-w-[400px]", className)}>
      {/* Internal container with 15px horizontal margin */}
      <div className="mx-[15px] h-[80px] relative flex flex-col justify-between">
        
        {/* Top Labels (Quantity Tick Marks) */}
        <div className="relative h-5 text-[10px] xs:text-xs font-medium text-muted-foreground">
          {quantityLabels.map((qty, index) => {
            const isFirst = index === 0;
            const isLast = index === quantityLabels.length - 1;
            
            // Calculate position percentage
            const position = (index / (quantityLabels.length - 1)) * 100;
            
            return (
              <span
                key={index}
                className={cn(
                  "absolute whitespace-nowrap",
                  isFirst && "left-0",
                  isLast && "right-0",
                  !isFirst && !isLast && "-translate-x-1/2"
                )}
                style={
                  !isFirst && !isLast
                    ? { left: `${position}%` }
                    : undefined
                }
              >
                {qty}
              </span>
            );
          })}
        </div>

        {/* Slider Track - 4 equal segments */}
        <div className="flex h-3 rounded-full overflow-hidden">
          {segmentColors.slice(0, tiers.length - 1).map((color, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 transition-opacity duration-200",
                color,
                index < currentTier ? "opacity-40" : "opacity-100"
              )}
            />
          ))}
        </div>

        {/* Bottom Labels (Price Values) - Grid with equal columns */}
        <div
          className="grid h-5"
          style={{
            gridTemplateColumns: `repeat(${Math.max(tiers.length - 1, 1)}, 1fr)`,
          }}
        >
          {priceLabels.slice(0, -1).map((price, index) => (
            <div
              key={index}
              className="text-center text-[10px] xs:text-xs font-semibold text-foreground"
            >
              ${price.toLocaleString("es-AR")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
