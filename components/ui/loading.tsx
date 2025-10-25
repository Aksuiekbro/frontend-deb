import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-[#3E5C76]",
        sizes[size],
        className
      )}
    />
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-[12px] p-6 shadow-lg animate-pulse">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/3 mb-4" />
      <div className="flex space-x-2 mb-6">
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>
      <Skeleton className="h-10 w-full rounded" />
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-white rounded-[12px] overflow-hidden shadow-lg animate-pulse">
      <Skeleton className="h-[150px] w-full" />
      <div className="p-6 pt-[48px]">
        <Skeleton className="h-8 w-3/4 mb-6" />
        <div className="flex justify-between mb-6">
          <div className="text-center">
            <Skeleton className="h-8 w-8 mb-2" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded" />
      </div>
    </div>
  )
}

export function TestimonialSkeleton() {
  return (
    <div className="bg-white border border-[#9a8c98] rounded-[12px] py-16 px-16 animate-pulse">
      <Skeleton className="w-[64px] h-[64px] rounded-full mx-auto mb-4" />
      <Skeleton className="h-6 w-1/2 mx-auto mb-1" />
      <Skeleton className="h-4 w-1/3 mx-auto mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  )
}

interface LoadingStateProps {
  children: React.ReactNode
  isLoading: boolean
  fallback?: React.ReactNode
}

export function LoadingState({ children, isLoading, fallback }: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        {fallback || <LoadingSpinner size="lg" />}
      </div>
    )
  }

  return <>{children}</>
}