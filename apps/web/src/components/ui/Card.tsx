import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "sm" | "gold"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default: "bg-navy-light border border-white/[0.06] rounded-2xl p-6 shadow-lg",
  sm:      "bg-navy-light border border-white/[0.06] rounded-xl p-4",
  gold:    "bg-navy-light border border-gold/20 rounded-2xl p-6 shadow-[0_0_32px_rgba(249,215,131,0.08)]",
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = "Card"

export default Card
