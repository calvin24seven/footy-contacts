import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "gold" | "navy" | "green" | "red" | "amber"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default: "bg-white/10 text-gray-300 border border-white/10",
  gold:    "bg-gold/15 text-gold border border-gold/20",
  navy:    "bg-navy text-gray-300 border border-navy-light",
  green:   "bg-green-500/20 text-green-400 border border-green-500/20",
  red:     "bg-red-500/20 text-red-400 border border-red-500/20",
  amber:   "bg-amber-500/20 text-amber-400 border border-amber-500/20",
}

export default function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
