import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

function SkeletonSiteCard() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonChart, SkeletonSiteCard, SkeletonTable }
