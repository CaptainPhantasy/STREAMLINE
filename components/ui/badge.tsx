"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] aria-invalid:ring-red-500/50 aria-invalid:border-red-500 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-theme-accent-primary bg-theme-card text-theme-accent-primary [a&]:hover:bg-theme-secondary shadow-glow",
        secondary:
          "border-theme-accent-secondary bg-theme-card text-theme-accent-secondary [a&]:hover:bg-theme-secondary shadow-glow",
        destructive:
          "border-destructive bg-theme-card text-destructive [a&]:hover:bg-theme-secondary",
        outline:
          "border-theme-border text-white [a&]:hover:bg-theme-secondary [a&]:hover:border-theme-accent-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
