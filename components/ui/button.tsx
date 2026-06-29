import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/tw";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 dark:text-white",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:text-white",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-white",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:text-white",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-white",
        link: "text-primary underline-offset-4 hover:underline dark:text-white",

        mtbPrimary:
          "bg-[var(--brand-deep)] text-[var(--ink-inverse)] hover:bg-[var(--brand-deep-hover)] shadow-md",
        mtbSecondary:
          "bg-[var(--surface-base)] text-[var(--ink-primary)] hover:shadow-xl disabled:opacity-70 ",
        mtbOutline:
          "border-2 border-[var(--border-accent)] text-[var(--ink-accent)] bg-transparent hover:bg-[var(--surface-calm)]",
        mtbTertiary: "border border-[var(--border-ink)]",
        mtbGhost:
          "text-[var(--ink-primary)] hover:text-[var(--ink-accent)] hover:bg-[var(--surface-soft)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        mtbPill: "py-4 px-8 rounded-full text-base",
      },
      width: {
        fit: "w-fit",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, width, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size,width, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
