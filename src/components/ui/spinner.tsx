import olaLogo from "@/assets/ola-logo-new.webp";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
};

export const Spinner = ({ size = "md", className }: SpinnerProps) => {
  return (
    <img
      src={olaLogo}
      alt="Cargando..."
      className={cn("animate-spin", sizeClasses[size], className)}
    />
  );
};
