"use client"

import { type ReactNode, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
}

export default function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-navy-light border border-white/[0.06] rounded-2xl shadow-xl",
          sizeClasses[size],
        )}
      >
        {title && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              <h2 id="modal-title" className="text-white font-semibold text-lg">{title}</h2>
              {description && (
                <p id="modal-description" className="text-gray-400 text-sm mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-navy transition-colors shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
