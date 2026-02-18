import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

export interface GradientBorderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  /** CSS gradient for the border, e.g. "linear-gradient(to right, #f09433, #dc2743, #bc1888)" */
  gradient?: string
  /** CSS color for the hover glow, e.g. "rgba(189, 23, 136, 0.5)" */
  glowColor?: string
}

const GradientBorderButton = React.forwardRef<
  HTMLButtonElement,
  GradientBorderButtonProps
>(
  (
    { className, asChild = false, gradient, glowColor, style, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "gradient-border inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        style={
          {
            ...(gradient ? { "--_gb-gradient": gradient } : {}),
            ...(glowColor ? { "--_gb-glow": glowColor } : {}),
            ...style,
          } as React.CSSProperties
        }
        ref={ref}
        {...props}
      />
    )
  }
)
GradientBorderButton.displayName = "GradientBorderButton"

export { GradientBorderButton }
