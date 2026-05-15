import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4", className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-navy-light border border-white/[0.06] flex items-center justify-center mb-4 text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}
