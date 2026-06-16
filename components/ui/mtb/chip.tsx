"use client";

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/utils" 
import { theme } from "@/lib/new-home/theme/theme"

const chipVariants = cva(
  cn(
    theme.chip,
  ),
  {
    variants: {
      isActive: {
        true: theme.chipActive,
        false: theme.chipInactive,
      },
      size: {
        default: "", // Empty! It safely relies entirely on theme.chip for standard sizing
        lg: "px-10 sm:px-24", // Automatically overrides theme.chip padding/text
        stretch: "flex-1 text-center", // Automatically overrides theme.chip
      }
    },
    defaultVariants: {
      isActive: false,
      size: "default",
    }
  }
)

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">, 
    VariantProps<typeof chipVariants> {
    isActive?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, isActive, size, ...props }, ref) => {
    return (
      <button
        type="button" 
        className={cn(chipVariants({ isActive, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Chip.displayName = "Chip"

export { Chip, chipVariants }