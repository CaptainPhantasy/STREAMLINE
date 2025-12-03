import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-[var(--color-text-subtle)]/50 selection:bg-theme-accent-primary selection:text-black",
        "bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-[var(--color-text-primary)] w-full min-h-[80px] rounded-md px-3 py-2 text-base transition-all outline-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-theme-accent-primary focus-visible:ring-theme-accent-primary/50 focus-visible:ring-[3px] focus-visible:shadow-glow",
        "hover:border-theme-accent-primary",
        "aria-invalid:ring-red-500/50 aria-invalid:border-red-500",
        "resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
