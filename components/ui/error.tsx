import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  error?: Error | null
  onRetry?: () => void
  className?: string
  message?: string
}

export function ErrorState({ error, onRetry, className, message }: ErrorStateProps) {
  const errorMessage = message || error?.message || "Something went wrong"

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-[#0D1321] mb-2">Oops! Something went wrong</h3>
      <p className="text-[#4a4e69] text-center mb-4 max-w-md">
        {errorMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
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
  className?: string
}

export function EmptyState({ title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
      <h3 className="text-lg font-medium text-[#0D1321] mb-2">{title}</h3>
      <p className="text-[#4a4e69] text-center mb-4 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}