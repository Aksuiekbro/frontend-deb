"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n"

const errorMessages = {
  en: {
    defaultMessage: "Something went wrong",
    heading: "Oops! Something went wrong",
    retry: "Try again",
  },
  ru: {
    defaultMessage: "Что-то пошло не так",
    heading: "Произошла ошибка",
    retry: "Попробовать снова",
  },
  kk: {
    defaultMessage: "Бірдеңе дұрыс болмады",
    heading: "Қате орын алды",
    retry: "Қайталап көру",
  },
} as const

interface ErrorStateProps {
  error?: Error | null
  onRetry?: () => void
  className?: string
  message?: string
}

export function ErrorState({ error, onRetry, className, message }: ErrorStateProps) {
  const t = useTranslations(errorMessages)
  const errorMessage = message || error?.message || t("defaultMessage")

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-[#0D1321] mb-2">{t("heading")}</h3>
      <p className="text-[#4a4e69] text-center mb-4 max-w-md">
        {errorMessage}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-2 bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t("retry")}</span>
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
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
      <h3 className="text-lg font-medium text-[#0D1321] mb-2">{title}</h3>
      <p className="text-[#4a4e69] text-center mb-4 max-w-md">{description}</p>
      {actionText && actionHref ? (
        <Link
          href={actionHref}
          prefetch={prefetch}
          className="bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
        >
          {actionText}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
