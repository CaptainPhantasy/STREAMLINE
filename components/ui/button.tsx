"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-theme-accent-primary text-white hover:bg-theme-accent-primary shadow-glow focus-visible:ring-theme-accent-primary/50 border-2 border-theme-accent-primary",
        destructive:
          "bg-destructive text-white hover:bg-red-600 focus-visible:ring-red-500/50 border-2 border-destructive",
        outline:
          "border-2 border-theme-accent-primary bg-theme-card text-theme-accent-primary hover:bg-theme-secondary hover:shadow-glow focus-visible:ring-theme-accent-primary/50",
        secondary:
          "bg-theme-accent-secondary text-black hover:bg-theme-accent-secondary shadow-glow focus-visible:ring-theme-accent-secondary/50 border-2 border-theme-accent-secondary",
        ghost:
          "hover:bg-theme-secondary hover:text-theme-accent-primary text-white border-2 border-transparent hover:border-theme-accent-primary/50",
        link: "text-theme-accent-primary underline-offset-4 hover:underline hover:text-theme-subtle",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  React.ElementRef<typeof Slot> | HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
