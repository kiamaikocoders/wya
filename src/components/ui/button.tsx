import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const baseButtonClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const buttonVariants = cva(
  baseButtonClasses,
  {
    variants: {
      variant: {
        default:
          "bg-kenya-orange text-kenya-dark shadow-[0_10px_30px_-12px_rgba(255,128,0,0.55)] hover:shadow-[0_18px_40px_-15px_rgba(255,128,0,0.6)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-white/15 bg-white/5 text-white hover:bg-white/10",
        secondary:
          "bg-kenya-brown text-white hover:bg-kenya-brown/80",
        ghost:
          "text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0",
        link: "text-kenya-orange underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark shadow-[0_10px_35px_-12px_rgba(255,128,0,0.6)] hover:shadow-[0_20px_45px_-15px_rgba(255,128,0,0.7)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "gradient",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
