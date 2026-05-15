"use client"

import Script from "next/script"
import { useEffect, useRef, useCallback } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
    __turnstileCallbacks?: Map<string, (token: string) => void>
  }
}

interface TurnstileWidgetProps {
  siteKey: string
  onToken: (token: string) => void
  onExpire?: () => void
}

export default function TurnstileWidget({ siteKey, onToken, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const callbackKey = useRef(`ts_${Math.random().toString(36).slice(2)}`)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return
    const key = callbackKey.current
    if (!window.__turnstileCallbacks) window.__turnstileCallbacks = new Map()
    window.__turnstileCallbacks.set(key, onToken)

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        window.__turnstileCallbacks?.get(key)?.(token)
      },
      "expired-callback": () => {
        onExpire?.()
      },
      theme: "dark",
      size: "normal",
    })
  }, [siteKey, onToken, onExpire])

  useEffect(() => {
    // Script may already be loaded (e.g. if component remounts)
    if (window.turnstile) renderWidget()
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [renderWidget])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  )
}
