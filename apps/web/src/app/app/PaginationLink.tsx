"use client"

import { useRouter } from "next/navigation"
import { useSearchTransition } from "./SearchTransitionContext"

interface Props {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Drop-in replacement for plain <Link> in pagination.
 * Wraps the navigation in the shared startTransition so the results
 * area dims and the loading bar appears while the new page loads.
 */
export default function PaginationLink({ href, children, className }: Props) {
  const router = useRouter()
  const { startTransition } = useSearchTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(() => router.push(href))
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
