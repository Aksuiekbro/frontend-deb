import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  error?: Error | null
  onRetry?: () => void
  className?: string
  message?: string
  /** Set when rendering on a surface that's always dark in both themes (e.g. inside .db-card-dark / .home-hero-slide). */
  onDark?: boolean
  /** Set when rendering directly on the page (e.g. not inside a .db-panel/.db-card-dark) -- text adapts per theme like .home-heading, since Senate shows a photo backdrop there but Classic doesn't. */
  onBackdrop?: boolean
}

export function ErrorState({ error, onRetry, className, message, onDark, onBackdrop }: ErrorStateProps) {
  const errorMessage = message || error?.message || "Something went wrong"

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <AlertCircle className="w-12 h-12 text-[var(--db-status)] mb-4" />
      <h3 className={cn("text-lg font-medium mb-2", onDark ? "text-white" : onBackdrop ? "home-heading" : "text-[var(--db-fg)]")}>Oops! Something went wrong</h3>
      <p className={cn("text-center mb-4 max-w-md", onDark ? "text-white/70" : onBackdrop ? "home-sub" : "text-[var(--db-muted)]")}>
        {errorMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="db-btn db-btn-primary"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionText?: string
  actionHref?: string
  prefetch?: boolean
  className?: string
  /** Set when rendering on a surface that's always dark in both themes (e.g. inside .db-card-dark / .home-hero-slide). */
  onDark?: boolean
  /** Set when rendering directly on the page (e.g. not inside a .db-panel/.db-card-dark) -- text adapts per theme like .home-heading, since Senate shows a photo backdrop there but Classic doesn't. */
  onBackdrop?: boolean
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionText,
  actionHref,
  prefetch,
  className,
  onDark,
  onBackdrop,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", onDark ? "bg-white/10" : "bg-[var(--db-surface)]")}>
        <div className={cn("w-8 h-8 rounded-full opacity-30", onDark ? "bg-white" : "bg-[var(--db-surface-fg)]")} />
      </div>
      <h3 className={cn("text-lg font-medium mb-2", onDark ? "text-white" : onBackdrop ? "home-heading" : "text-[var(--db-fg)]")}>{title}</h3>
      <p className={cn("text-center mb-4 max-w-md", onDark ? "text-white/70" : onBackdrop ? "home-sub" : "text-[var(--db-muted)]")}>{description}</p>
      {actionText && actionHref ? (
        <Link
          href={actionHref}
          prefetch={prefetch}
          className="db-btn db-btn-primary"
        >
          {actionText}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="db-btn db-btn-primary"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
