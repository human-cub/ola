import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselArrowButtonProps = {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
};

export const CarouselArrowButton = ({
  direction,
  onClick,
  className,
}: CarouselArrowButtonProps) => {
  const Icon = direction === "prev"
    ? <ChevronLeft className="-ml-[2px] text-primary"/>
    : <ChevronRight className="-mr-[2px] text-primary"/>;

  return (
    <Button
      size="icon"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 bg-white hover:bg-white border-2 border-primary shadow-floating z-20 h-9 w-9 rounded-full hover:shadow-glow transition-all duration-300 ease-out",

        'active:scale-90',

        direction === "prev"
          ? "left-[8px]"
          : "right-[8px]",
        className,
      )}
    >
      {Icon}
    </Button>
  );
};
