"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)]/50 selection:bg-theme-accent-primary selection:text-black",
        "bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-[var(--color-text-primary)] h-9 w-full min-w-0 rounded-md px-3 py-1 text-base transition-all outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-theme-accent-primary focus-visible:ring-theme-accent-primary/50 focus-visible:ring-[3px] focus-visible:shadow-glow",
        "hover:border-theme-accent-primary",
        "aria-invalid:ring-red-500/50 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
