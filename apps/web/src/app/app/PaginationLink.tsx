"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSearchTransition } from "./SearchTransitionContext"

interface Props {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Pagination link that:
 * 1. Renders as a real Next.js <Link> so the RSC payload is prefetched as
 *    soon as the link enters the viewport (full prefetch) — clicking feels instant.
 * 2. Intercepts the click to wrap router.push in startTransition so the results
 *    area dims and the loading bar appears during the brief render phase.
 */
export default function PaginationLink({ href, children, className }: Props) {
  const router = useRouter()
  const { startTransition } = useSearchTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(() => router.push(href))
  }

  return (
    <Link href={href} prefetch={true} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
