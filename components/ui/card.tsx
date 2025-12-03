"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Professional Card with subtle depth
 * - Soft layered shadows for elevation (not flat)
 * - Subtle top-edge highlight (like glass catching light)
 * - Clean, conservative design for service industry
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base structure
        "relative flex flex-col gap-6 rounded-xl py-6 overflow-hidden",
        // Background - theme-aware for proper contrast
        "bg-[var(--card-bg)]",
        // Border - theme-aware
        "border-[var(--card-border)]",
        // Layered shadow for real depth (using shadow-card utility)
        "shadow-card",
        // Subtle top highlight - like light hitting top edge of a physical card
        "before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:pointer-events-none",
        // Smooth hover - slight lift, not dramatic
        "transition-all duration-200 ease-out",
        "hover:shadow-card-hover hover:-translate-y-px",
        className
      )}
      {...props}
    />
  )
}

/**
 * Stat Card - for KPIs and metrics (Tremor-inspired)
 * Professional, clean, shows data clearly
 */
function StatCard({ 
  className, 
  title, 
  value, 
  change,
  changeType = "neutral",
  icon,
  ...props 
}: React.ComponentProps<"div"> & { 
  title?: string
  value?: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
}) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  }
  
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "relative flex flex-col gap-2 rounded-xl p-5 overflow-hidden",
        "bg-[var(--card-bg)]",
        "border-[var(--card-border)]",
        "shadow-card",
        "before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
        {change && (
          <span className={cn("text-sm font-medium", changeColors[changeType])}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-white relative z-10", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-theme-subtle text-sm relative z-10", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  StatCard,
}
